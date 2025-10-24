
import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { CreativeAssets, Scene, VideoConfig, Language } from '../types';
import { decode } from '../utils/fileUtils';
import { logger } from './loggerService';

const PROMPT_ENGINE_MODEL = 'gemini-2.5-flash';
const IMAGE_GEN_MODEL = 'imagen-4.0-generate-001';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const VIDEO_GEN_MODEL = 'veo-3.1-generate-preview';

// Rate limiting delay between API calls (in ms)
const API_DELAY = 12000; // 12 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Uses Gemini to generate creative assets (prompts, script) from a user's idea.
 */
export async function generateCreativeAssets(
  ai: GoogleGenAI,
  idea: string,
  userScript: string,
  config: VideoConfig
): Promise<CreativeAssets> {
  const languageMap: Record<Language, string> = {
    en: 'English',
    vi: 'Vietnamese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    fr: 'French',
    es: 'Spanish',
  };

  logger.info('🎬 Starting prompt generation', {
    sceneCount: config.sceneCount,
    style: config.style,
    language: config.language,
  });

  const styleDescription = config.style === 'custom' && config.customStyle
    ? config.customStyle
    : config.style;

  const prompt = `
    Based on the following idea, generate a set of creative assets for a video.

    User's idea: "${idea}"
    User provided script: "${userScript || 'Not provided'}"

    Video Configuration:
    - Style: ${styleDescription}
    - Language: ${languageMap[config.language]}
    - Number of scenes: ${config.sceneCount}
    - Duration per scene: 8 seconds (fixed for VEO 3.1)
    - Total duration: ~${config.totalDurationMinutes} minute(s)

    Your tasks:
    1. **characterPrompt**: Create a detailed, visually rich prompt for an image generation model (like Imagen) to create the main character.
       The character should fit the "${styleDescription}" style. Describe appearance, clothing, and setting.

    2. **scenes**: Generate ${config.sceneCount} distinct scenes. For each scene:
       - videoPrompt: Describe an 8-second cinematic scene in "${styleDescription}" style
       - voiceScript: Write dialogue/narration in ${languageMap[config.language]}
       - Ensure continuity between scenes

    3. **voiceScript**: If user provided a script, use it. Otherwise, create an overall narration.

    Return the response in JSON format according to the provided schema.
  `;

  logger.info('📤 Sending request to Gemini API...');

  const response = await ai.models.generateContent({
    model: PROMPT_ENGINE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterPrompt: { type: Type.STRING, description: 'Prompt for character image generation.' },
          videoPrompt: { type: Type.STRING, description: 'General video theme.' },
          voiceScript: { type: Type.STRING, description: 'Overall script for voiceover.' },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                videoPrompt: { type: Type.STRING },
                voiceScript: { type: Type.STRING },
              },
            },
          },
        },
        required: ['characterPrompt', 'videoPrompt', 'voiceScript', 'scenes'],
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText) as CreativeAssets;

    // Add IDs to scenes
    if (parsed.scenes) {
      parsed.scenes = parsed.scenes.map((scene: any, idx: number) => ({
        id: `scene_${Date.now()}_${idx}`,
        index: idx,
        prompt: parsed.characterPrompt,
        videoPrompt: scene.videoPrompt,
        voiceScript: scene.voiceScript,
        characterImage: null,
        audioUrl: null,
        videoUrl: null,
        status: 'idle' as const,
      }));
    }

    logger.success(`✅ Generated ${parsed.scenes?.length || 0} scenes successfully`, {
      characterPrompt: parsed.characterPrompt.substring(0, 100) + '...',
      sceneCount: parsed.scenes?.length,
    });

    return parsed;
  } catch (e) {
    logger.error('❌ Failed to parse JSON from Gemini', { error: e });
    console.error("Failed to parse JSON from prompt engine:", response.text);
    throw new Error("Could not generate creative plan. The model returned an invalid format.");
  }
}

/**
 * Generates a character image using Imagen.
 */
export async function generateCharacterImage(ai: GoogleGenAI, prompt: string): Promise<{ base64: string; mimeType: string; }> {
  const response = await ai.models.generateImages({
    model: IMAGE_GEN_MODEL,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '1:1',
      outputMimeType: 'image/png',
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
    throw new Error('Image generation failed.');
  }

  const image = response.generatedImages[0].image;
  return { base64: image.imageBytes, mimeType: image.mimeType || 'image/png' };
}

/**
 * Generates multiple character variations for consistency selection
 */
export async function generateCharacterVariations(
  ai: GoogleGenAI,
  prompt: string,
  count: number = 3
): Promise<Array<{ base64: string; mimeType: string; }>> {
  const variations: Array<{ base64: string; mimeType: string; }> = [];

  for (let i = 0; i < count; i++) {
    try {
      console.log(`Generating character variation ${i + 1}/${count}...`);
      const variation = await generateCharacterImage(ai, prompt);
      variations.push(variation);
      console.log(`✓ Variation ${i + 1} generated successfully`);

      // Rate limiting between image generations
      if (i < count - 1) {
        console.log(`Waiting ${API_DELAY / 1000}s before next variation...`);
        await sleep(API_DELAY);
      }
    } catch (error: any) {
      console.error(`✗ Failed to generate variation ${i + 1}:`, error?.message || error);

      // If we have at least one variation, that's enough
      if (variations.length > 0) {
        console.log(`Continuing with ${variations.length} variation(s)...`);
        break;
      }
    }
  }

  if (variations.length === 0) {
    throw new Error('Failed to generate any character variations. Please check your API key and try again.');
  }

  console.log(`Total variations generated: ${variations.length}`);
  return variations;
}


/**
 * Generates speech from text using Gemini TTS.
 */
export async function generateSpeech(ai: GoogleGenAI, script: string): Promise<{ base64: string; mimeType: string; }> {
   const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
        return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
    
    throw new Error('Text-to-speech generation failed.');
}


/**
 * Generates a video using Veo with a reference image.
 */
export async function generateVideo(ai: GoogleGenAI, prompt: string, imageBase64: string, imageMimeType: string): Promise<{ blob: Blob, url: string }> {
  let operation = await ai.models.generateVideos({
    model: VIDEO_GEN_MODEL,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
      referenceImages: [{
        image: {
            imageBytes: imageBase64,
            mimeType: imageMimeType,
        }
      }],
    },
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error('Video generation succeeded, but no download link was found.');
  }

  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video file. Status: ${videoResponse.statusText}`);
  }
  
  const videoBlob = await videoResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);
  return { blob: videoBlob, url: videoUrl };
}

/**
 * Batch generation for multiple scenes with rate limiting
 */
export async function generateScenesVideos(
  ai: GoogleGenAI,
  scenes: Scene[],
  characterImageBase64: string,
  characterImageMimeType: string,
  onProgress?: (sceneId: string, status: 'pending' | 'success' | 'error', result?: any) => void
): Promise<Scene[]> {
  const updatedScenes: Scene[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    try {
      // Notify progress
      onProgress?.(scene.id, 'pending');

      // Generate voice
      const audio = await generateSpeech(ai, scene.voiceScript);
      const audioUrl = `data:${audio.mimeType};base64,${audio.base64}`;

      // Wait before video generation (rate limiting)
      await sleep(API_DELAY);

      // Generate video
      const video = await generateVideo(ai, scene.videoPrompt, characterImageBase64, characterImageMimeType);

      const updatedScene: Scene = {
        ...scene,
        audioUrl,
        videoUrl: video.url,
        characterImage: `data:${characterImageMimeType};base64,${characterImageBase64}`,
        status: 'success',
      };

      updatedScenes.push(updatedScene);
      onProgress?.(scene.id, 'success', updatedScene);

      // Rate limiting between scenes (except last one)
      if (i < scenes.length - 1) {
        await sleep(API_DELAY);
      }
    } catch (error) {
      console.error(`Failed to generate scene ${scene.id}:`, error);

      const errorScene: Scene = {
        ...scene,
        status: 'error',
      };

      updatedScenes.push(errorScene);
      onProgress?.(scene.id, 'error', error);
    }
  }

  return updatedScenes;
}
