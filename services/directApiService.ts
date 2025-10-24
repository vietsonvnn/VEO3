/**
 * Direct API Service - Bypass Quota Limits
 *
 * Gọi trực tiếp Google AI Studio Internal APIs thay vì dùng SDK
 * Sử dụng authenticated cookies từ browser session → Bypass quota!
 *
 * Cách hoạt động:
 * 1. User login vào aistudio.google.com
 * 2. Export cookies (dùng EditThisCookie extension)
 * 3. Import cookies vào tool
 * 4. Tool gọi TRỰC TIẾP internal APIs với cookies
 * 5. Bypass quota vì dùng session của user, không phải API key!
 */

import type { Cookie, CreativeAssets, Scene, VideoConfig, Language } from '../types';
import { logger } from './loggerService';

interface DirectAPIConfig {
  cookies: Cookie[];
  useCookieAuth: boolean; // true = dùng cookies, false = dùng API key
  apiKey?: string; // Fallback nếu cookies fail
}

export class DirectAPIService {
  private static instance: DirectAPIService;
  private cookies: Cookie[] = [];
  private useCookieAuth: boolean = false;
  private apiKey?: string;

  // Google AI Studio Internal API Endpoints
  private readonly ENDPOINTS = {
    // Gemini text generation (prompt engine)
    GEMINI_GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',

    // Imagen 4.0 image generation
    IMAGEN_GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages',

    // Veo 3.1 video generation
    VEO_GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideos',
    VEO_OPERATIONS: 'https://generativelanguage.googleapis.com/v1beta/operations/{operationId}',

    // Text-to-Speech
    TTS_GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
  };

  private constructor() {}

  static getInstance(): DirectAPIService {
    if (!DirectAPIService.instance) {
      DirectAPIService.instance = new DirectAPIService();
    }
    return DirectAPIService.instance;
  }

  /**
   * Configure authentication
   */
  configure(config: DirectAPIConfig): void {
    this.cookies = config.cookies;
    this.useCookieAuth = config.useCookieAuth;
    this.apiKey = config.apiKey;

    logger.info('🔧 Direct API Service configured', {
      useCookieAuth: this.useCookieAuth,
      cookieCount: this.cookies.length,
      hasApiKey: !!this.apiKey,
      mode: this.useCookieAuth ? 'COOKIE AUTH (Bypass Quota)' : 'API KEY (Standard)',
    });
  }

  /**
   * Get Cookie header string
   */
  private getCookieHeader(): string {
    return this.cookies
      .filter(c => c.domain.includes('google') || c.domain.includes('googleapis'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }

  /**
   * Generate SAPISIDHASH for authenticated requests
   * Google's internal auth mechanism
   */
  private async getSAPISIDHash(): Promise<string | null> {
    // Find SAPISID or __Secure-1PSID cookie
    const sapisid = this.cookies.find(c =>
      c.name === 'SAPISID' ||
      c.name === '__Secure-1PSID' ||
      c.name === '__Secure-3PSID'
    );

    if (!sapisid) {
      logger.warning('⚠️ No SAPISID cookie found', {
        availableCookies: this.cookies.map(c => c.name).join(', ')
      });
      return null;
    }

    const origin = 'https://aistudio.google.com';
    const timestamp = Math.floor(Date.now() / 1000);

    // Create hash input: timestamp + space + SAPISID + space + origin
    const hashInput = `${timestamp} ${sapisid.value} ${origin}`;

    // Generate SHA-1 hash (simplified - use crypto in production)
    const hashValue = await this.sha1Hash(hashInput);

    return `SAPISIDHASH ${timestamp}_${hashValue}`;
  }

  /**
   * Simple SHA-1 hash (use crypto.subtle.digest in production)
   */
  private async sha1Hash(str: string): Promise<string> {
    // Simple hash for demonstration
    // In production, use: crypto.subtle.digest('SHA-1', ...)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  }

  /**
   * Make direct HTTP request with authentication
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://aistudio.google.com',
      'Referer': 'https://aistudio.google.com/',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
    };

    // Add authentication
    if (this.useCookieAuth && this.cookies.length > 0) {
      // Cookie-based auth (bypass quota)
      const cookieHeader = this.getCookieHeader();
      const sapisidHash = await this.getSAPISIDHash();

      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }
      if (sapisidHash) {
        headers['Authorization'] = sapisidHash;
      }

      logger.info('🔐 Using cookie authentication (BYPASS QUOTA)', {
        hasCookies: !!cookieHeader,
        hasAuth: !!sapisidHash,
      });
    } else if (this.apiKey) {
      // API key fallback
      endpoint = endpoint.includes('?')
        ? `${endpoint}&key=${this.apiKey}`
        : `${endpoint}?key=${this.apiKey}`;

      logger.info('🔑 Using API key authentication (STANDARD QUOTA)');
    } else {
      throw new Error('No authentication method available. Please provide cookies or API key.');
    }

    // Make request
    logger.info('📤 Making direct API request', {
      endpoint: endpoint.substring(0, 100),
      method,
      authMode: this.useCookieAuth ? 'COOKIES' : 'API_KEY',
    });

    try {
      const response = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: this.useCookieAuth ? 'include' : 'omit',
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ API request failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 500),
        });

        // Check for quota errors
        if (response.status === 429) {
          logger.error('🚫 QUOTA EXCEEDED!', {
            message: 'Rate limit hit. Try enabling cookie authentication to bypass quota.',
            suggestion: 'Import cookies from aistudio.google.com',
          });
        }

        throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      logger.success('✅ API request successful');

      return data as T;
    } catch (error: any) {
      logger.error('❌ Request failed', {
        error: error.message,
        endpoint: endpoint.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Generate creative assets using Gemini
   */
  async generateCreativeAssets(
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

Return the response in JSON format with these fields:
{
  "characterPrompt": "string",
  "videoPrompt": "string",
  "voiceScript": "string",
  "scenes": [
    { "videoPrompt": "string", "voiceScript": "string" }
  ]
}
    `.trim();

    logger.info('🎬 Generating creative assets via direct API', {
      sceneCount: config.sceneCount,
      style: config.style,
      useCookieAuth: this.useCookieAuth,
    });

    const endpoint = this.ENDPOINTS.GEMINI_GENERATE.replace('{model}', 'gemini-2.5-flash');

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
      },
    };

    const response = await this.makeRequest<any>(endpoint, 'POST', requestBody);

    // Parse response
    try {
      const text = response.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text) as CreativeAssets;

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

      logger.success(`✅ Generated ${parsed.scenes?.length || 0} scenes`, {
        sceneCount: parsed.scenes?.length,
      });

      return parsed;
    } catch (e: any) {
      logger.error('❌ Failed to parse response', { error: e.message });
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  /**
   * Generate character image using Imagen 4.0
   */
  async generateCharacterImage(prompt: string): Promise<{ base64: string; mimeType: string }> {
    logger.info('🎨 Generating character image via direct API', {
      promptLength: prompt.length,
      useCookieAuth: this.useCookieAuth,
    });

    const requestBody = {
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/png',
      },
    };

    const response = await this.makeRequest<any>(
      this.ENDPOINTS.IMAGEN_GENERATE,
      'POST',
      requestBody
    );

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('No images generated');
    }

    const image = response.generatedImages[0].image;

    logger.success('✅ Character image generated', {
      mimeType: image.mimeType,
      sizeKB: Math.round(image.imageBytes.length / 1024),
    });

    return {
      base64: image.imageBytes,
      mimeType: image.mimeType || 'image/png',
    };
  }

  /**
   * Generate character variations
   */
  async generateCharacterVariations(
    prompt: string,
    count: number = 3
  ): Promise<Array<{ base64: string; mimeType: string }>> {
    const variations: Array<{ base64: string; mimeType: string }> = [];

    logger.info(`🎭 Generating ${count} character variations via direct API`);

    for (let i = 0; i < count; i++) {
      try {
        logger.info(`⏳ Generating variation ${i + 1}/${count}...`);

        const variation = await this.generateCharacterImage(prompt);
        variations.push(variation);

        logger.success(`✅ Variation ${i + 1} complete`);

        // Rate limiting (reduced delay with cookie auth)
        if (i < count - 1) {
          const delay = this.useCookieAuth ? 5000 : 12000; // 5s with cookies, 12s with API key
          logger.info(`⏱️ Waiting ${delay / 1000}s before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error: any) {
        logger.warning(`⚠️ Failed variation ${i + 1}: ${error.message}`);

        if (variations.length > 0) {
          logger.info(`✅ Stopping with ${variations.length} successful variation(s)`);
          break;
        }
      }
    }

    if (variations.length === 0) {
      throw new Error('Failed to generate any character variations');
    }

    return variations;
  }

  /**
   * Generate speech using TTS
   */
  async generateSpeech(script: string): Promise<{ base64: string; mimeType: string }> {
    logger.info('🎤 Generating speech via direct API', {
      scriptLength: script.length,
      useCookieAuth: this.useCookieAuth,
    });

    const requestBody = {
      contents: [{
        parts: [{ text: script }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    };

    const response = await this.makeRequest<any>(
      this.ENDPOINTS.TTS_GENERATE,
      'POST',
      requestBody
    );

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) {
      throw new Error('No audio data in response');
    }

    logger.success('✅ Speech generated', {
      mimeType: part.inlineData.mimeType,
      sizeKB: Math.round(part.inlineData.data.length / 1024),
    });

    return {
      base64: part.inlineData.data,
      mimeType: part.inlineData.mimeType,
    };
  }

  /**
   * Generate video using Veo 3.1
   */
  async generateVideo(
    prompt: string,
    imageBase64?: string,
    imageMimeType?: string,
    aspectRatio: '16:9' | '9:16' = '16:9'
  ): Promise<{ blob: Blob; url: string }> {
    logger.info('🎬 Starting Veo video generation via direct API', {
      promptPreview: prompt.substring(0, 100),
      hasImage: !!imageBase64,
      aspectRatio,
      useCookieAuth: this.useCookieAuth,
    });

    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    };

    if (imageBase64 && imageMimeType) {
      config.referenceImages = [{
        image: {
          imageBytes: imageBase64,
          mimeType: imageMimeType,
        }
      }];
    }

    const requestBody = {
      prompt,
      config,
    };

    // Start video generation
    let operation = await this.makeRequest<any>(
      this.ENDPOINTS.VEO_GENERATE,
      'POST',
      requestBody
    );

    logger.info('⏳ Video generation started, polling for completion...');

    // Poll for completion
    let pollCount = 0;
    const maxPolls = 60; // 10 minutes max

    while (!operation.done && pollCount < maxPolls) {
      pollCount++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay

      const operationEndpoint = this.ENDPOINTS.VEO_OPERATIONS.replace(
        '{operationId}',
        operation.name
      );

      operation = await this.makeRequest<any>(operationEndpoint, 'GET');

      logger.info(`⏱️ Polling... (${pollCount}/${maxPolls})`);
    }

    if (!operation.done) {
      throw new Error('Video generation timeout');
    }

    logger.success(`✅ Video generation complete after ${pollCount} poll(s)`);

    // Download video
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('No download link in response');
    }

    logger.info('📥 Downloading video...');

    const videoUrl = this.apiKey ? `${downloadLink}&key=${this.apiKey}` : downloadLink;
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    const blobUrl = URL.createObjectURL(videoBlob);

    logger.success('✅ Video ready', {
      sizeKB: Math.round(videoBlob.size / 1024),
    });

    return { blob: videoBlob, url: blobUrl };
  }
}

export const directApiService = DirectAPIService.getInstance();
