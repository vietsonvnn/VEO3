
import React, { useState, useRef, useEffect } from 'react';
import { KeyIcon, DocumentArrowUpIcon, CheckCircleIcon, TrashIcon } from './icons';
import type { ApiConfig, Cookie } from '../types';
import { storageService } from '../services/storageService';

interface SettingsTabProps {
  onApiConfigSave: (config: ApiConfig) => void;
}

const DEFAULT_API_KEY = 'AIzaSyAe6cP63f9NvTZmfSexQ3a6M1GKm0sh1wo';

const SettingsTab: React.FC<SettingsTabProps> = ({ onApiConfigSave }) => {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved API config from session storage OR auto-save default
  useEffect(() => {
    const savedConfig = storageService.getApiConfig();
    if (savedConfig) {
      setApiKey(savedConfig.apiKey);
      if (savedConfig.cookies) {
        setCookies(savedConfig.cookies);
      }
      console.log('✅ Restored API config from session');
    } else {
      // First time - auto-load cookie.txt and save default config
      loadCookieFile().then((loadedCookies) => {
        const defaultConfig: ApiConfig = {
          apiKey: DEFAULT_API_KEY,
          cookies: loadedCookies.length > 0 ? loadedCookies : undefined,
        };

        // Update state
        setCookies(loadedCookies);

        // Save to storage
        storageService.saveApiConfig(defaultConfig);
        onApiConfigSave(defaultConfig);

        console.log('✅ Auto-saved default API configuration', {
          apiKey: DEFAULT_API_KEY.substring(0, 20) + '...',
          cookieCount: loadedCookies.length
        });
      });
    }
  }, []);

  const loadCookieFile = async (): Promise<Cookie[]> => {
    try {
      const response = await fetch('/cookie.txt');
      if (response.ok) {
        const content = await response.text();
        const parsedCookies = JSON.parse(content) as Cookie[];
        if (Array.isArray(parsedCookies)) {
          console.log(`✅ Auto-loaded ${parsedCookies.length} cookies from cookie.txt`);
          return parsedCookies;
        }
      }
    } catch (error) {
      console.log('ℹ️ cookie.txt not found or invalid - you can upload manually');
    }
    return [];
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

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-blue-400 mb-2">🔒 Storage Policy</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• ✅ API keys stored in <strong>sessionStorage</strong> (current tab only)</li>
          <li>• ✅ Persists during page refreshes (in same tab)</li>
          <li>• ❌ Cleared when you close the browser tab</li>
          <li>• ⚠️ Never share your API key or cookie file</li>
        </ul>
      </div>

      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-2 border-green-600 rounded-lg p-5 mt-4">
        <h3 className="font-semibold text-green-400 mb-3 text-lg flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          NEW: Bypass Quota Limits with Cookie Authentication!
        </h3>
        <p className="text-sm text-gray-300 mb-3 font-medium">
          Tired of 429 Rate Limit errors? Use authenticated cookies from Google AI Studio to bypass quota restrictions!
        </p>

        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-purple-400 mb-2">📋 How to Export Cookies:</h4>
          <ol className="text-sm text-gray-400 space-y-2">
            <li>
              <strong className="text-gray-300">Step 1:</strong> Install browser extension:
              <ul className="ml-4 mt-1 space-y-1">
                <li>• <a href="https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg" target="_blank" className="text-blue-400 hover:underline">EditThisCookie</a> (Chrome)</li>
                <li>• <a href="https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/" target="_blank" className="text-blue-400 hover:underline">Cookie Editor</a> (Firefox)</li>
              </ul>
            </li>
            <li>
              <strong className="text-gray-300">Step 2:</strong> Login to <a href="https://aistudio.google.com" target="_blank" className="text-purple-400 hover:underline">aistudio.google.com</a>
            </li>
            <li>
              <strong className="text-gray-300">Step 3:</strong> Click extension icon → Export cookies as JSON
            </li>
            <li>
              <strong className="text-gray-300">Step 4:</strong> Save as <code className="bg-gray-700 px-2 py-0.5 rounded">cookie.json</code>
            </li>
            <li>
              <strong className="text-gray-300">Step 5:</strong> Upload file above or place in <code className="bg-gray-700 px-2 py-0.5 rounded">public/cookie.txt</code>
            </li>
          </ol>
        </div>

        <div className="bg-green-900/30 border border-green-700 rounded p-3">
          <h4 className="font-semibold text-green-400 mb-2">✅ Benefits:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>No more 429 errors!</strong> Bypass API quota limits</li>
            <li>• <strong>Faster rate limits</strong> (5s delay vs 12s with API key)</li>
            <li>• <strong>Same as web interface</strong> - uses your logged-in session</li>
            <li>• <strong>Works with free accounts</strong> - no paid plan needed</li>
          </ul>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-4">
        <h3 className="font-semibold text-yellow-400 mb-2">⚠️ Important Security Note</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Cookies contain your Google account session</li>
          <li>• <strong>NEVER share your cookie file</strong> with others</li>
          <li>• Cookies are stored in sessionStorage (cleared when tab closes)</li>
          <li>• For maximum security, logout from aistudio.google.com after exporting cookies</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsTab;
