
import React, { useState, useEffect } from 'react';
import type { VideoConfig, VideoStyle, Language, VeoModel } from '../types';
import { CogIcon } from './icons';

interface ConfigFormProps {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ config, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomStyle, setShowCustomStyle] = useState(config.style === 'custom');

  // Auto-calculate scenes when duration changes
  const handleDurationChange = (minutes: number) => {
    const totalSeconds = minutes * 60;
    const calculatedScenes = Math.ceil(totalSeconds / 8); // Each VEO video = 8s

    onChange({
      ...config,
      totalDurationMinutes: minutes,
      sceneCount: calculatedScenes,
    });
  };

  const handleStyleChange = (style: VideoStyle) => {
    setShowCustomStyle(style === 'custom');
    onChange({
      ...config,
      style,
      customStyle: style === 'custom' ? config.customStyle : undefined,
    });
  };

  const styles: { value: VideoStyle; label: string }[] = [
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'documentary', label: 'Documentary' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'anime', label: 'Anime' },
    { value: 'noir', label: 'Film Noir' },
    { value: 'sci-fi', label: 'Sci-Fi' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'horror', label: 'Horror' },
    { value: 'romance', label: 'Romance' },
    { value: 'custom', label: 'Custom (nhập tay)' },
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

  const veoModels: { value: VeoModel; label: string; badge?: string }[] = [
    { value: 'veo-3.1-fast', label: 'Veo 3.1 - Fast', badge: 'Beta Audio' },
    { value: 'veo-3.1-quality', label: 'Veo 3.1 - Quality', badge: 'Beta Audio' },
    { value: 'veo-2-fast', label: 'Veo 2 - Fast', badge: 'Ending Soon' },
    { value: 'veo-2-quality', label: 'Veo 2 - Quality', badge: 'Ending Soon' },
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
            onChange={(e) => onChange({ ...config, mode: e.target.value as any })}
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

        {/* Total Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Total Duration: {config.totalDurationMinutes} minute(s)
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={config.totalDurationMinutes}
            onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            ≈ {config.sceneCount} scenes x 8s = {config.sceneCount * 8}s total
          </p>
        </div>

        {/* Style */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video Style
          </label>
          <select
            value={config.style}
            onChange={(e) => handleStyleChange(e.target.value as VideoStyle)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {styles.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {showCustomStyle && (
            <input
              type="text"
              value={config.customStyle || ''}
              onChange={(e) => onChange({ ...config, customStyle: e.target.value })}
              placeholder="Nhập style tùy chỉnh (VD: retro 80s music video)"
              className="w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            />
          )}
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Language
          </label>
          <select
            value={config.language}
            onChange={(e) => onChange({ ...config, language: e.target.value as Language })}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tỷ lệ khung hình (Aspect Ratio)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...config, aspectRatio: '16:9' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition ${
                  config.aspectRatio === '16:9'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                📺 Khổ ngang (16:9)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, aspectRatio: '9:16' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition ${
                  config.aspectRatio === '9:16'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                📱 Khổ dọc (9:16)
              </button>
            </div>
          </div>

          {/* VEO Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mô hình (Model)
            </label>
            <select
              value={config.veoModel}
              onChange={(e) => onChange({ ...config, veoModel: e.target.value as VeoModel })}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {veoModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} {model.badge && `(${model.badge})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Veo 3 - Fast không tính tin dụng với người dùng gói Ultra
            </p>
          </div>

          {/* Videos per prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Câu trả lời đầu ra cho mỗi câu lệnh: {config.videosPerPrompt}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={config.videosPerPrompt}
              onChange={(e) => onChange({ ...config, videosPerPrompt: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tạo {config.videosPerPrompt} video variant(s) cho mỗi scene để chọn lựa
            </p>
          </div>

          {/* Cookie Authentication Toggle */}
          <div className="md:col-span-2 border-t border-gray-700 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={config.useCookieAuth}
                onChange={(e) => onChange({ ...config, useCookieAuth: e.target.checked })}
                className="w-5 h-5 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300 group-hover:text-green-400 transition">
                    🚀 Bypass Quota Limits với Cookie Auth
                  </span>
                  {config.useCookieAuth && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {config.useCookieAuth
                    ? '✅ Sử dụng authenticated cookies - Không bị limit quota 429!'
                    : '⚠️ API Key mode - Có thể bị rate limit (429 errors)'}
                </p>
                {config.useCookieAuth && (
                  <p className="text-xs text-green-400 mt-1 font-medium">
                    💡 Nhớ upload cookies trong Settings tab trước khi generate
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Character Image Toggle */}
          <div className="md:col-span-2 border-t border-gray-700 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.useCharacterImage}
                onChange={(e) => onChange({ ...config, useCharacterImage: e.target.checked })}
                className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-300">
                  Sử dụng ảnh nhân vật (Imagen 4.0)
                </span>
                <p className="text-xs text-gray-500">
                  {config.useCharacterImage
                    ? '⚠️ Yêu cầu billing enabled - Tạo character reference image với Imagen'
                    : '✅ Chế độ prompt-only - Không cần Imagen (miễn phí hơn)'}
                </p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigForm;
