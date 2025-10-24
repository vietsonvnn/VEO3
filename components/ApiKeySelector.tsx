
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, KeyIcon, DocumentArrowUpIcon } from './icons';
import type { Cookie, ApiConfig } from '../types';

// FIX: Define a named interface `AIStudio` and use it in the global Window declaration.
// This resolves the TypeScript error about subsequent property declarations needing
// the same type and expecting a named type `AIStudio`.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

interface ApiKeySelectorProps {
  onKeySelected: (config: ApiConfig) => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [manualEntry, setManualEntry] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setIsKeySelected(true);
          onKeySelected({ apiKey: process.env.API_KEY || '' });
        }
      }
      setIsLoading(false);
    };
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success and proceed. The main App component will handle API errors.
      setIsKeySelected(true);
      onKeySelected({ apiKey: process.env.API_KEY || '' });
    } else {
      alert('AI Studio context not found. Please run this in Google AI Studio.');
    }
  };

  const handleManualSubmit = () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }
    setIsKeySelected(true);
    onKeySelected({ apiKey: apiKey.trim(), cookies: cookies.length > 0 ? cookies : undefined });
  };

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
        alert(`Successfully loaded ${parsedCookies.length} cookies`);
      } catch (error) {
        alert('Failed to parse cookie file. Please ensure it is valid JSON format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-400">Checking API Key status...</p>
      </div>
    );
  }

  if (manualEntry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center text-2xl font-semibold">
            <KeyIcon className="w-8 h-8 mr-3 text-purple-400" />
            <span>Manual API Configuration</span>
          </h2>
          <button
            onClick={() => setManualEntry(false)}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Back
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 focus:ring-purple-500 focus:border-purple-500"
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
          <label className="block text-sm font-medium text-gray-300 mb-2">
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

        <button
          onClick={handleManualSubmit}
          disabled={!apiKey.trim()}
          className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="flex items-center text-2xl font-semibold">
        <KeyIcon className="w-8 h-8 mr-3 text-purple-400" />
        <span>Veo API Key Required</span>
      </div>
      <p className="text-gray-400 max-w-md">
        This application uses the Veo API for video generation, which requires you to select an API key. Your key is used to authenticate your requests.
      </p>
      <p className="text-sm text-gray-500">
        For more information on billing, please visit the{' '}
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
          official documentation
        </a>.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={handleSelectKey}
          className="flex-1 flex items-center justify-center px-6 py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          <KeyIcon className="w-5 h-5 mr-2" />
          Select API Key
        </button>
        <button
          onClick={() => setManualEntry(true)}
          className="flex-1 flex items-center justify-center px-6 py-3 font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
        >
          Manual Entry
        </button>
      </div>
    </div>
  );
};

export default ApiKeySelector;
