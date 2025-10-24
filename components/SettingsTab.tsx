
import React, { useState, useRef } from 'react';
import { KeyIcon, DocumentArrowUpIcon, CheckCircleIcon, TrashIcon } from './icons';
import type { ApiConfig, Cookie } from '../types';
import { storageService } from '../services/storageService';

interface SettingsTabProps {
  onApiConfigSave: (config: ApiConfig) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onApiConfigSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCookieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedCookies = JSON.parse(content) as Cookie[];

        if (!Array.isArray(parsedCookies)) {
          throw new Error('Invalid cookie format');
        }

        setCookies(parsedCookies);
        alert(`✅ Successfully loaded ${parsedCookies.length} cookies`);
      } catch (error) {
        alert('❌ Failed to parse cookie file. Please ensure it is valid JSON format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    const config: ApiConfig = {
      apiKey: apiKey.trim(),
      cookies: cookies.length > 0 ? cookies : undefined,
    };

    // Save to storage (only metadata, not actual key for security)
    storageService.saveApiConfig(config);

    // Notify parent
    onApiConfigSave(config);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearAll = () => {
    if (confirm('Clear all saved data including projects?')) {
      storageService.clearAll();
      setApiKey('');
      setCookies([]);
      alert('✅ All data cleared');
    }
  };

  const apiConfigInfo = storageService.getApiConfigInfo();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Configuration</h2>
        <p className="text-gray-400">
          Configure your Gemini API key and optional cookies for authentication.
        </p>
      </div>

      {apiConfigInfo && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">Previously saved configuration found</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            • API Key: {apiConfigInfo.hasKey ? 'Configured' : 'Not set'}
            <br />• Cookies: {apiConfigInfo.hasCookies ? `${apiConfigInfo.cookieCount} loaded` : 'None'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <KeyIcon className="w-4 h-4" />
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <DocumentArrowUpIcon className="w-4 h-4" />
            Cookie File (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleCookieUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition"
          >
            <DocumentArrowUpIcon className="w-5 h-5 mr-2 text-gray-400" />
            <span className="text-gray-400">
              {cookies.length > 0 ? `${cookies.length} cookies loaded` : 'Upload cookie.json'}
            </span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Upload exported cookies from your Google account for enhanced authentication
          </p>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="flex-1 flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saved ? (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Save Configuration
            </>
          )}
        </button>

        <button
          onClick={handleClearAll}
          className="flex items-center justify-center px-6 py-3 font-medium text-gray-300 bg-red-600/20 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition"
        >
          <TrashIcon className="w-5 h-5 mr-2" />
          Clear All Data
        </button>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-yellow-400 mb-2">⚠️ Security Notice</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• API keys are NOT stored in localStorage for security</li>
          <li>• Only metadata (has key, cookie count) is saved</li>
          <li>• You need to re-enter API key each session</li>
          <li>• Never share your API key or cookie file</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsTab;
