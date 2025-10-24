
import React, { useState } from 'react';
import type { VideoConfig, VideoStyle, Language } from '../types';
import { CogIcon } from './icons';

interface ConfigFormProps {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ config, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof VideoConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const styles: { value: VideoStyle; label: string }[] = [
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'documentary', label: 'Documentary' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'anime', label: 'Anime' },
  ];

  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh', label: '中文' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];

  return (
    <div className="space-y-4 bg-gray-900/30 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center text-lg font-semibold">
          <CogIcon className="w-5 h-5 mr-2 text-purple-400" />
          Video Configuration
        </h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generation Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Generation Mode
          </label>
          <select
            value={config.mode}
            onChange={(e) => handleChange('mode', e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="auto">Auto (No interruption)</option>
            <option value="review">Review (Edit each scene)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {config.mode === 'auto'
              ? 'Generate all scenes automatically'
              : 'Review and edit each scene before continuing'}
          </p>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video Style
          </label>
          <select
            value={config.style}
            onChange={(e) => handleChange('style', e.target.value as VideoStyle)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {styles.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Language
          </label>
          <select
            value={config.language}
            onChange={(e) => handleChange('language', e.target.value as Language)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {languages.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Scene Count */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Scenes: {config.sceneCount}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.sceneCount}
            onChange={(e) => handleChange('sceneCount', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total duration: ~{config.sceneCount * config.durationPerScene}s
          </p>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          {/* Duration per scene */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration per Scene: {config.durationPerScene}s
            </label>
            <input
              type="range"
              min="3"
              max="15"
              value={config.durationPerScene}
              onChange={(e) => handleChange('durationPerScene', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resolution
            </label>
            <select
              value={config.resolution}
              onChange={(e) => handleChange('resolution', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="4k">4K (Ultra HD)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigForm;
