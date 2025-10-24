
export type AppState = 'api_key_selection' | 'form' | 'progress' | 'results' | 'scene_review';

export type TabType = 'create' | 'projects' | 'settings' | 'logs';

export type GenerationStep = 'prompting' | 'character' | 'voice' | 'video';

export type StepStatus = 'idle' | 'pending' | 'success' | 'error';

export type GenerationStatus = {
  [key in GenerationStep]: StepStatus;
};

export type GenerationMode = 'auto' | 'review';

export type VideoStyle =
  | 'cinematic'
  | 'documentary'
  | 'cartoon'
  | 'realistic'
  | 'anime'
  | 'noir'
  | 'sci-fi'
  | 'fantasy'
  | 'horror'
  | 'romance'
  | 'custom';

export type Language = 'en' | 'vi' | 'ja' | 'ko' | 'zh' | 'fr' | 'es';

export type VeoModel = 'veo-3.1-fast' | 'veo-3.1-quality' | 'veo-2-fast' | 'veo-2-quality';

export interface Cookie {
  domain: string;
  expirationDate?: number;
  hostOnly: boolean;
  httpOnly: boolean;
  name: string;
  path: string;
  sameSite: string | null;
  secure: boolean;
  session: boolean;
  storeId: string | null;
  value: string;
}

export interface ApiConfig {
  apiKey: string;
  cookies?: Cookie[];
}

export interface VideoConfig {
  style: VideoStyle;
  customStyle?: string; // For when style is 'custom'
  language: Language;
  totalDurationMinutes: number; // Total video duration in minutes (user input)
  sceneCount: number; // Auto-calculated: totalDurationMinutes * 60 / 8
  aspectRatio: '16:9' | '9:16';
  veoModel: VeoModel;
  videosPerPrompt: number; // 1-4, số video variants per scene
  mode: GenerationMode;
  useCharacterImage: boolean; // Generate with character reference or prompt-only
  useCookieAuth: boolean; // NEW: Use cookie authentication to bypass quota (default: false)
}

export interface Scene {
  id: string;
  index: number;
  prompt: string;
  videoPrompt: string;
  voiceScript: string;
  characterImage: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  status: StepStatus;
}

export interface CreativeAssets {
  characterPrompt: string;
  videoPrompt: string;
  voiceScript: string;
  scenes?: Scene[];
}

export interface CharacterVariation {
  id: string;
  imageUrl: string;
  prompt: string;
  selected: boolean;
}

export interface GeneratedData {
  characterImage: string | null;
  characterVariations: CharacterVariation[];
  audioUrl: string | null;
  videoUrl: string | null;
  creativeAssets: CreativeAssets | null;
  scenes: Scene[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  idea: string;
  script: string;
  config: VideoConfig;
  creativeAssets: CreativeAssets | null;
  generatedData: GeneratedData;
  createdAt: string;
  updatedAt: string;
}

export interface BatchItem {
  id: string;
  idea: string;
  script: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: GeneratedData;
}
