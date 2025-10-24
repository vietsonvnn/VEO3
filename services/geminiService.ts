
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
  logger.info('🎨 Generating character image with Imagen 4.0', {
    model: IMAGE_GEN_MODEL,
    promptLength: prompt.length
  });

  try {
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
      logger.error('❌ Imagen returned no images', { response });
      throw new Error('Image generation failed - no images returned.');
    }

    const image = response.generatedImages[0].image;
    logger.success('✅ Character image generated', {
      mimeType: image.mimeType,
      sizeKB: Math.round(image.imageBytes.length / 1024)
    });

    return { base64: image.imageBytes, mimeType: image.mimeType || 'image/png' };
  } catch (error: any) {
    logger.error('❌ Imagen generation error', {
      error: error.message,
      code: error.code,
      status: error.status
    });
    throw error;
  }
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

  logger.info(`🎭 Starting character variation generation (${count} variations)`, {
    targetCount: count,
    promptPreview: prompt.substring(0, 100) + '...'
  });

  for (let i = 0; i < count; i++) {
    try {
      logger.info(`⏳ Generating variation ${i + 1}/${count}...`);
      const variation = await generateCharacterImage(ai, prompt);
      variations.push(variation);
      logger.success(`✅ Variation ${i + 1} generated successfully`);

      // Rate limiting between image generations
      if (i < count - 1) {
        logger.info(`⏱️ Waiting ${API_DELAY / 1000}s before next variation (rate limit protection)...`);
        await sleep(API_DELAY);
      }
    } catch (error: any) {
      logger.warning(`⚠️ Failed to generate variation ${i + 1}`, {
        error: error?.message,
        attemptedCount: i + 1,
        successfulCount: variations.length
      });

      // If we have at least one variation, that's enough
      if (variations.length > 0) {
        logger.warning(`⚠️ Stopping early with ${variations.length} variation(s) (minimum requirement met)`);
        break;
      }

      // If first attempt failed, try once more with longer delay
      if (i === 0) {
        logger.info(`🔄 Retrying first variation after extended delay...`);
        await sleep(API_DELAY * 2); // 24 seconds
        try {
          const variation = await generateCharacterImage(ai, prompt);
          variations.push(variation);
          logger.success(`✅ Retry successful for variation ${i + 1}`);
          if (i < count - 1) await sleep(API_DELAY);
        } catch (retryError: any) {
          logger.error(`❌ Retry also failed`, { error: retryError?.message });
        }
      }
    }
  }

  if (variations.length === 0) {
    logger.error('❌ Failed to generate ANY character variations', {
      attemptedCount: count,
      possibleCauses: [
        'API key may not have Imagen 4.0 access',
        'Rate limits exceeded',
        'Invalid prompt format',
        'Network/API issues'
      ],
      alternatives: [
        'Try Google Whisk (whisk.labs.google.com) for manual image generation',
        'Use Gemini API with Imagen access enabled',
        'Upgrade API plan to enable Imagen 4.0'
      ]
    });
    throw new Error(
      'Failed to generate any character variations. Please check your API key and try again.\n\n' +
      'Alternatives:\n' +
      '• Visit whisk.labs.google.com to generate images manually\n' +
      '• Enable Imagen 4.0 in your Google AI Studio project\n' +
      '• Upgrade your API plan if using free tier'
    );
  }

  logger.success(`✅ Character variation generation complete`, {
    successfulCount: variations.length,
    targetCount: count
  });

  return variations;
}


/**
 * Generates speech from text using Gemini TTS.
 */
export async function generateSpeech(ai: GoogleGenAI, script: string): Promise<{ base64: string; mimeType: string; }> {
  logger.info('🎤 Generating speech with Gemini TTS', {
    model: TTS_MODEL,
    scriptLength: script.length,
    scriptPreview: script.substring(0, 100) + '...'
  });

  try {
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
      logger.success('✅ Speech generated successfully', {
        mimeType: part.inlineData.mimeType,
        sizeKB: Math.round(part.inlineData.data.length / 1024)
      });
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }

    logger.error('❌ TTS returned no audio data', { response });
    throw new Error('Text-to-speech generation failed - no audio data returned.');
  } catch (error: any) {
    logger.error('❌ TTS generation error', {
      error: error.message,
      code: error.code
    });
    throw error;
  }
}


/**
 * Generates a video using Veo with optional character reference image.
 */
export async function generateVideo(
  ai: GoogleGenAI,
  prompt: string,
  imageBase64?: string,
  imageMimeType?: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<{ blob: Blob, url: string }> {
  logger.info('🎬 Starting video generation with Veo', {
    model: VIDEO_GEN_MODEL,
    promptPreview: prompt.substring(0, 100) + '...',
    hasCharacterImage: !!imageBase64,
    aspectRatio
  });

  try {
    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio,
    };

    // Only add referenceImages if provided
    if (imageBase64 && imageMimeType) {
      config.referenceImages = [{
        image: {
          imageBytes: imageBase64,
          mimeType: imageMimeType,
        }
      }];
    }

    let operation = await ai.models.generateVideos({
      model: VIDEO_GEN_MODEL,
      prompt: prompt,
      config,
    });

    logger.info('⏳ Video generation in progress, polling for completion...');

    // Poll for completion
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
      logger.info(`⏱️ Still processing... (check ${pollCount})`);
    }

    logger.success(`✅ Video generation complete after ${pollCount} poll(s)`);

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      logger.error('❌ No download link in response', { operation });
      throw new Error('Video generation succeeded, but no download link was found.');
    }

    logger.info('📥 Downloading video file...');
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
      logger.error('❌ Video download failed', { status: videoResponse.status, statusText: videoResponse.statusText });
      throw new Error(`Failed to download video file. Status: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    logger.success('✅ Video downloaded and ready', {
      sizeKB: Math.round(videoBlob.size / 1024),
      type: videoBlob.type
    });

    return { blob: videoBlob, url: videoUrl };
  } catch (error: any) {
    logger.error('❌ Video generation error', {
      error: error.message,
      code: error.code
    });
    throw error;
  }
}

/**
 * Batch generation for multiple scenes with rate limiting
 */
export async function generateScenesVideos(
  ai: GoogleGenAI,
  scenes: Scene[],
  aspectRatio: '16:9' | '9:16',
  characterImageBase64?: string,
  characterImageMimeType?: string,
  onProgress?: (sceneId: string, status: 'pending' | 'success' | 'error', result?: any) => void
): Promise<Scene[]> {
  const updatedScenes: Scene[] = [];
  const useCharacter = !!characterImageBase64 && !!characterImageMimeType;

  logger.info(`🎬 Starting batch scene generation`, {
    sceneCount: scenes.length,
    useCharacterImage: useCharacter,
    aspectRatio
  });

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    try {
      // Notify progress
      onProgress?.(scene.id, 'pending');

      logger.info(`📹 Generating scene ${i + 1}/${scenes.length}`, {
        sceneId: scene.id,
        promptPreview: scene.videoPrompt.substring(0, 50) + '...'
      });

      // Generate voice
      const audio = await generateSpeech(ai, scene.voiceScript);
      const audioUrl = `data:${audio.mimeType};base64,${audio.base64}`;

      // Wait before video generation (rate limiting)
      await sleep(API_DELAY);

      // Generate video (with or without character image)
      const video = await generateVideo(
        ai,
        scene.videoPrompt,
        characterImageBase64,
        characterImageMimeType,
        aspectRatio
      );

      const updatedScene: Scene = {
        ...scene,
        audioUrl,
        videoUrl: video.url,
        characterImage: useCharacter ? `data:${characterImageMimeType};base64,${characterImageBase64}` : null,
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
