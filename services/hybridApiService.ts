/**
 * Hybrid API Service
 *
 * Automatically selects between:
 * 1. Direct API (cookie-based auth) → Bypass quota
 * 2. SDK API (API key) → Standard quota
 *
 * Based on VideoConfig.useCookieAuth setting
 */

import { GoogleGenAI } from '@google/genai';
import type { CreativeAssets, Scene, VideoConfig, ApiConfig } from '../types';
import { directApiService } from './directApiService';
import * as originalGeminiService from './geminiService';
import { logger } from './loggerService';

export class HybridAPIService {
  private static instance: HybridAPIService;
  private apiConfig: ApiConfig | null = null;

  private constructor() {}

  static getInstance(): HybridAPIService {
    if (!HybridAPIService.instance) {
      HybridAPIService.instance = new HybridAPIService();
    }
    return HybridAPIService.instance;
  }

  /**
   * Configure service with API config
   */
  configure(config: ApiConfig): void {
    this.apiConfig = config;
    logger.info('🔧 Hybrid API Service configured', {
      hasApiKey: !!config.apiKey,
      hasCookies: !!(config.cookies && config.cookies.length > 0),
      cookieCount: config.cookies?.length || 0,
    });
  }

  /**
   * Generate creative assets
   * Auto-selects Direct API or SDK based on config.useCookieAuth
   */
  async generateCreativeAssets(
    idea: string,
    userScript: string,
    config: VideoConfig
  ): Promise<CreativeAssets> {
    if (!this.apiConfig) {
      throw new Error('API config not set. Call configure() first.');
    }

    // Use Direct API if cookie auth is enabled AND we have cookies
    if (config.useCookieAuth && this.apiConfig.cookies && this.apiConfig.cookies.length > 0) {
      logger.info('🚀 Using Direct API (Cookie Auth) - Bypassing quota!');

      // Configure Direct API service
      directApiService.configure({
        cookies: this.apiConfig.cookies,
        useCookieAuth: true,
        apiKey: this.apiConfig.apiKey,
      });

      return await directApiService.generateCreativeAssets(idea, userScript, config);
    } else {
      // Fallback to original SDK
      logger.info('🔑 Using SDK API (API Key) - Standard quota');

      const ai = new GoogleGenAI({ apiKey: this.apiConfig.apiKey });
      return await originalGeminiService.generateCreativeAssets(ai, idea, userScript, config);
    }
  }

  /**
   * Generate character variations
   */
  async generateCharacterVariations(
    prompt: string,
    count: number,
    config: VideoConfig
  ): Promise<Array<{ base64: string; mimeType: string }>> {
    if (!this.apiConfig) {
      throw new Error('API config not set. Call configure() first.');
    }

    if (config.useCookieAuth && this.apiConfig.cookies && this.apiConfig.cookies.length > 0) {
      logger.info('🚀 Using Direct API for character generation');

      directApiService.configure({
        cookies: this.apiConfig.cookies,
        useCookieAuth: true,
        apiKey: this.apiConfig.apiKey,
      });

      return await directApiService.generateCharacterVariations(prompt, count);
    } else {
      logger.info('🔑 Using SDK API for character generation');

      const ai = new GoogleGenAI({ apiKey: this.apiConfig.apiKey });
      return await originalGeminiService.generateCharacterVariations(ai, prompt, count);
    }
  }

  /**
   * Generate speech
   */
  async generateSpeech(
    script: string,
    config: VideoConfig
  ): Promise<{ base64: string; mimeType: string }> {
    if (!this.apiConfig) {
      throw new Error('API config not set. Call configure() first.');
    }

    if (config.useCookieAuth && this.apiConfig.cookies && this.apiConfig.cookies.length > 0) {
      logger.info('🚀 Using Direct API for TTS');

      directApiService.configure({
        cookies: this.apiConfig.cookies,
        useCookieAuth: true,
        apiKey: this.apiConfig.apiKey,
      });

      return await directApiService.generateSpeech(script);
    } else {
      logger.info('🔑 Using SDK API for TTS');

      const ai = new GoogleGenAI({ apiKey: this.apiConfig.apiKey });
      return await originalGeminiService.generateSpeech(ai, script);
    }
  }

  /**
   * Generate video
   */
  async generateVideo(
    prompt: string,
    imageBase64: string | undefined,
    imageMimeType: string | undefined,
    aspectRatio: '16:9' | '9:16',
    config: VideoConfig
  ): Promise<{ blob: Blob; url: string }> {
    if (!this.apiConfig) {
      throw new Error('API config not set. Call configure() first.');
    }

    if (config.useCookieAuth && this.apiConfig.cookies && this.apiConfig.cookies.length > 0) {
      logger.info('🚀 Using Direct API for Veo video generation');

      directApiService.configure({
        cookies: this.apiConfig.cookies,
        useCookieAuth: true,
        apiKey: this.apiConfig.apiKey,
      });

      return await directApiService.generateVideo(prompt, imageBase64, imageMimeType, aspectRatio);
    } else {
      logger.info('🔑 Using SDK API for Veo video generation');

      const ai = new GoogleGenAI({ apiKey: this.apiConfig.apiKey });
      return await originalGeminiService.generateVideo(ai, prompt, imageBase64, imageMimeType, aspectRatio);
    }
  }

  /**
   * Generate scenes videos (batch)
   */
  async generateScenesVideos(
    scenes: Scene[],
    aspectRatio: '16:9' | '9:16',
    characterImageBase64: string | undefined,
    characterImageMimeType: string | undefined,
    config: VideoConfig,
    onProgress?: (sceneId: string, status: 'pending' | 'success' | 'error', result?: any) => void
  ): Promise<Scene[]> {
    if (!this.apiConfig) {
      throw new Error('API config not set. Call configure() first.');
    }

    if (config.useCookieAuth && this.apiConfig.cookies && this.apiConfig.cookies.length > 0) {
      logger.info('🚀 Using Direct API for batch scene generation');

      directApiService.configure({
        cookies: this.apiConfig.cookies,
        useCookieAuth: true,
        apiKey: this.apiConfig.apiKey,
      });

      // Manual batch processing with Direct API
      const updatedScenes: Scene[] = [];
      const API_DELAY = 5000; // 5s with cookie auth (vs 12s with API key)

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];

        try {
          onProgress?.(scene.id, 'pending');

          logger.info(`📹 Generating scene ${i + 1}/${scenes.length}`, {
            sceneId: scene.id,
          });

          // Generate voice
          const audio = await directApiService.generateSpeech(scene.voiceScript);
          const audioUrl = `data:${audio.mimeType};base64,${audio.base64}`;

          // Wait before video
          await new Promise(resolve => setTimeout(resolve, API_DELAY));

          // Generate video
          const video = await directApiService.generateVideo(
            scene.videoPrompt,
            characterImageBase64,
            characterImageMimeType,
            aspectRatio
          );

          const updatedScene: Scene = {
            ...scene,
            audioUrl,
            videoUrl: video.url,
            characterImage: characterImageBase64 ? `data:${characterImageMimeType};base64,${characterImageBase64}` : null,
            status: 'success',
          };

          updatedScenes.push(updatedScene);
          onProgress?.(scene.id, 'success', updatedScene);

          // Rate limiting
          if (i < scenes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, API_DELAY));
          }
        } catch (error: any) {
          logger.error(`❌ Scene ${scene.id} failed`, { error: error.message });

          const errorScene: Scene = {
            ...scene,
            status: 'error',
          };

          updatedScenes.push(errorScene);
          onProgress?.(scene.id, 'error', error);
        }
      }

      return updatedScenes;
    } else {
      logger.info('🔑 Using SDK API for batch scene generation');

      const ai = new GoogleGenAI({ apiKey: this.apiConfig.apiKey });
      return await originalGeminiService.generateScenesVideos(
        ai,
        scenes,
        aspectRatio,
        characterImageBase64,
        characterImageMimeType,
        onProgress
      );
    }
  }

  /**
   * Get current auth mode
   */
  getAuthMode(config: VideoConfig): 'cookie' | 'apikey' | 'none' {
    if (!this.apiConfig) return 'none';

    if (config.useCookieAuth && this.apiConfig.cookies && this.apiConfig.cookies.length > 0) {
      return 'cookie';
    } else if (this.apiConfig.apiKey) {
      return 'apikey';
    }

    return 'none';
  }
}

export const hybridApiService = HybridAPIService.getInstance();
