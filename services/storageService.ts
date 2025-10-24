
import type { VideoConfig, ApiConfig } from '../types';

const STORAGE_KEYS = {
  API_CONFIG: 'veo_api_config',
  LAST_IDEA: 'veo_last_idea',
  LAST_SCRIPT: 'veo_last_script',
  LAST_CONFIG: 'veo_last_config',
  PROJECTS: 'veo_projects',
} as const;

const SESSION_KEYS = {
  API_KEY: 'veo_session_api_key', // Stored in sessionStorage (current tab only)
  COOKIES: 'veo_session_cookies',
} as const;

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // API Config - Session storage (persists during tab session only)
  saveApiConfig(config: Partial<ApiConfig>): void {
    try {
      // Save to sessionStorage (lasts only during browser tab session)
      if (config.apiKey) {
        sessionStorage.setItem(SESSION_KEYS.API_KEY, config.apiKey);
      }
      if (config.cookies) {
        sessionStorage.setItem(SESSION_KEYS.COOKIES, JSON.stringify(config.cookies));
      }

      // Save metadata to localStorage
      const safeConfig = {
        hasKey: !!config.apiKey,
        hasCookies: config.cookies && config.cookies.length > 0,
        cookieCount: config.cookies?.length || 0,
      };
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(safeConfig));
    } catch (e) {
      console.error('Failed to save API config', e);
    }
  }

  getApiConfig(): ApiConfig | null {
    try {
      const apiKey = sessionStorage.getItem(SESSION_KEYS.API_KEY);
      const cookiesJson = sessionStorage.getItem(SESSION_KEYS.COOKIES);

      if (!apiKey) return null;

      return {
        apiKey,
        cookies: cookiesJson ? JSON.parse(cookiesJson) : undefined,
      };
    } catch (e) {
      console.error('Failed to get API config', e);
      return null;
    }
  }

  getApiConfigInfo(): { hasKey: boolean; hasCookies: boolean; cookieCount: number } | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // Last Idea
  saveLastIdea(idea: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_IDEA, idea);
    } catch (e) {
      console.error('Failed to save last idea', e);
    }
  }

  getLastIdea(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_IDEA) || '';
    } catch (e) {
      return '';
    }
  }

  // Last Script
  saveLastScript(script: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SCRIPT, script);
    } catch (e) {
      console.error('Failed to save last script', e);
    }
  }

  getLastScript(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SCRIPT) || '';
    } catch (e) {
      return '';
    }
  }

  // Last Config
  saveLastConfig(config: VideoConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save last config', e);
    }
  }

  getLastConfig(): VideoConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_CONFIG);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // Clear all user data
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      Object.values(SESSION_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  }
}

export const storageService = StorageService.getInstance();
