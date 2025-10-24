
import React, { useState } from 'react';
import { SparklesIcon } from './icons';
import type { VideoConfig } from '../types';
import ConfigForm from './ConfigForm';
import { getRandomMockData } from '../utils/mockData';

interface IdeaFormProps {
  onGenerate: (idea: string, script: string, config: VideoConfig) => void;
  initialIdea: string;
  initialScript: string;
  initialConfig?: VideoConfig;
  error: string | null;
}

const defaultConfig: VideoConfig = {
  style: 'cinematic',
  language: 'vi',
  totalDurationMinutes: 1, // 1 minute
  sceneCount: 8, // Auto-calculated: 1 min * 60s / 8s = 7.5 ≈ 8 scenes
  aspectRatio: '16:9', // Khổ ngang (default)
  veoModel: 'veo-3.1-fast', // Veo 3.1 - Fast (default)
  videosPerPrompt: 1, // 1 video per scene (default)
  mode: 'auto',
  useCharacterImage: false, // DEFAULT: Prompt-only (no Imagen billing required)
  useCookieAuth: false, // DEFAULT: API Key mode (enable in Settings if you have cookies)
};

const IdeaForm: React.FC<IdeaFormProps> = ({ onGenerate, initialIdea, initialScript, initialConfig, error }) => {
  // If no initial values, use mock data as default
  const mockDefaults = !initialIdea && !initialScript ? getRandomMockData() : null;

  const [idea, setIdea] = useState(initialIdea || mockDefaults?.idea || '');
  const [script, setScript] = useState(initialScript || mockDefaults?.script || '');
  const [config, setConfig] = useState<VideoConfig>(initialConfig || mockDefaults?.config || defaultConfig);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      setIsGenerating(true);
      onGenerate(idea, script, config);
    }
  };

  const handleLoadMockData = () => {
    const mockData = getRandomMockData();
    setIdea(mockData.idea);
    setScript(mockData.script);
    setConfig(mockData.config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">
          Your Idea or Theme
        </label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., A futuristic detective story in a rainy cyberpunk city"
          rows={4}
          required
          className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 focus:ring-purple-500 focus:border-purple-500 transition"
        />
      </div>
      <div>
        <label htmlFor="script" className="block text-sm font-medium text-gray-300 mb-2">
          Voiceover Script (Optional)
        </label>
        <textarea
          id="script"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="If left blank, AI will generate a script for you."
          rows={3}
          className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 focus:ring-purple-500 focus:border-purple-500 transition"
        />
      </div>

      <ConfigForm config={config} onChange={setConfig} />

      <div className="pt-2 flex gap-4">
        <button
          type="button"
          onClick={handleLoadMockData}
          className="flex-shrink-0 px-6 py-3 font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition"
        >
          🎲 Load Mock Data
        </button>

        <button
          type="submit"
          disabled={!idea.trim() || isGenerating}
          className="flex-1 flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="w-6 h-6 mr-2" />
          {isGenerating ? 'Generating...' : 'Start Creation Pipeline'}
        </button>
      </div>
    </form>
  );
};

export default IdeaForm;
