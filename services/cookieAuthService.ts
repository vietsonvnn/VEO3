/**
 * Cookie-based Authentication Service
 *
 * Uses authenticated session cookies from Google AI Studio web interface
 * to bypass API quota limits by making direct authenticated requests.
 *
 * How it works:
 * 1. User logs into aistudio.google.com
 * 2. Export cookies using browser extension (EditThisCookie, Cookie Editor)
 * 3. Import cookies into this tool
 * 4. Make API calls with cookies → Bypass quota!
 */

import type { Cookie } from '../types';
import { logger } from './loggerService';

interface CookieAuthConfig {
  cookies: Cookie[];
  apiKey?: string; // Optional API key for hybrid mode
}

interface AuthenticatedRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export class CookieAuthService {
  private static instance: CookieAuthService;
  private cookies: Cookie[] = [];
  private apiKey?: string;

  private constructor() {}

  static getInstance(): CookieAuthService {
    if (!CookieAuthService.instance) {
      CookieAuthService.instance = new CookieAuthService();
    }
    return CookieAuthService.instance;
  }

  /**
   * Initialize with cookies from Google AI Studio session
   */
  configure(config: CookieAuthConfig): void {
    this.cookies = config.cookies;
    this.apiKey = config.apiKey;

    logger.info('🔐 Cookie authentication configured', {
      cookieCount: this.cookies.length,
      hasApiKey: !!this.apiKey,
      domains: [...new Set(this.cookies.map(c => c.domain))],
    });
  }

  /**
   * Convert Cookie objects to Cookie header string
   */
  private getCookieHeader(): string {
    return this.cookies
      .filter(c => c.domain.includes('google.com'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }

  /**
   * Extract SAPISID cookie for authorization
   * Google uses SAPISID hash for authenticated requests
   */
  private getSAPISIDHash(): string | null {
    const sapisid = this.cookies.find(c => c.name === 'SAPISID' || c.name === '__Secure-1PSID');

    if (!sapisid) {
      logger.warning('⚠️ SAPISID/PSID cookie not found', {
        availableCookies: this.cookies.map(c => c.name)
      });
      return null;
    }

    // Generate SAPISIDHASH (origin, timestamp, SAPISID value)
    const origin = 'https://aistudio.google.com';
    const timestamp = Math.floor(Date.now() / 1000);
    const hashInput = `${timestamp} ${sapisid.value} ${origin}`;

    // Simple hash (in production, use proper SHA-1)
    return `SAPISIDHASH ${timestamp}_${this.simpleHash(hashInput)}`;
  }

  /**
   * Simple hash function (replace with proper crypto in production)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Make authenticated request using cookies
   */
  async makeAuthenticatedRequest<T>(request: AuthenticatedRequest): Promise<T> {
    const cookieHeader = this.getCookieHeader();
    const sapisidHash = this.getSAPISIDHash();

    if (!cookieHeader) {
      throw new Error('No Google cookies available. Please import cookies from Google AI Studio.');
    }

    const headers: Record<string, string> = {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': 'https://aistudio.google.com',
      'Referer': 'https://aistudio.google.com/',
      ...request.headers,
    };

    // Add SAPISIDHASH if available
    if (sapisidHash) {
      headers['Authorization'] = sapisidHash;
    }

    logger.info('📤 Making authenticated request', {
      url: request.url,
      method: request.method,
      hasCookies: !!cookieHeader,
      hasAuth: !!sapisidHash,
    });

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ Authenticated request failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.success('✅ Authenticated request successful', {
        status: response.status,
      });

      return data as T;
    } catch (error: any) {
      logger.error('❌ Request error', {
        error: error.message,
        url: request.url,
      });
      throw error;
    }
  }

  /**
   * Call Gemini API using authenticated cookies
   * Bypasses API key quota limits
   */
  async callGeminiAPI(payload: {
    model: string;
    prompt: string;
    responseSchema?: any;
    responseMimeType?: string;
  }): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent`;

    const body = {
      contents: [{ parts: [{ text: payload.prompt }] }],
      generationConfig: {
        responseSchema: payload.responseSchema,
        responseMimeType: payload.responseMimeType || 'application/json',
      },
    };

    return this.makeAuthenticatedRequest({
      url: this.apiKey ? `${url}?key=${this.apiKey}` : url,
      method: 'POST',
      body,
    });
  }

  /**
   * Call Imagen API using authenticated cookies
   */
  async callImagenAPI(payload: {
    prompt: string;
    numberOfImages?: number;
    aspectRatio?: string;
  }): Promise<any> {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages';

    const body = {
      prompt: payload.prompt,
      config: {
        numberOfImages: payload.numberOfImages || 1,
        aspectRatio: payload.aspectRatio || '1:1',
        outputMimeType: 'image/png',
      },
    };

    return this.makeAuthenticatedRequest({
      url: this.apiKey ? `${url}?key=${this.apiKey}` : url,
      method: 'POST',
      body,
    });
  }

  /**
   * Call Veo API using authenticated cookies
   */
  async callVeoAPI(payload: {
    prompt: string;
    referenceImageBase64?: string;
    referenceImageMimeType?: string;
    aspectRatio?: '16:9' | '9:16';
    resolution?: string;
  }): Promise<any> {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideos';

    const config: any = {
      numberOfVideos: 1,
      resolution: payload.resolution || '720p',
      aspectRatio: payload.aspectRatio || '16:9',
    };

    if (payload.referenceImageBase64 && payload.referenceImageMimeType) {
      config.referenceImages = [{
        image: {
          imageBytes: payload.referenceImageBase64,
          mimeType: payload.referenceImageMimeType,
        }
      }];
    }

    return this.makeAuthenticatedRequest({
      url: this.apiKey ? `${url}?key=${this.apiKey}` : url,
      method: 'POST',
      body: {
        prompt: payload.prompt,
        config,
      },
    });
  }

  /**
   * Check if cookies are valid by making a test request
   */
  async validateCookies(): Promise<boolean> {
    try {
      logger.info('🔍 Validating cookies...');

      // Make a simple test request
      const response = await this.makeAuthenticatedRequest({
        url: 'https://aistudio.google.com/app/apikey',
        method: 'GET',
      });

      logger.success('✅ Cookies are valid');
      return true;
    } catch (error: any) {
      logger.error('❌ Cookie validation failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get authentication status
   */
  getStatus(): {
    hasCookies: boolean;
    cookieCount: number;
    hasApiKey: boolean;
  } {
    return {
      hasCookies: this.cookies.length > 0,
      cookieCount: this.cookies.length,
      hasApiKey: !!this.apiKey,
    };
  }

  /**
   * Clear all authentication data
   */
  clear(): void {
    this.cookies = [];
    this.apiKey = undefined;
    logger.info('🗑️ Cookie authentication cleared');
  }
}

export const cookieAuthService = CookieAuthService.getInstance();
