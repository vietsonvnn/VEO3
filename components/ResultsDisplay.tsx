
import React from 'react';
import type { GeneratedData } from '../types';
import { ArrowDownTrayIcon, ArrowPathIcon, DocumentTextIcon, PhotoIcon, SpeakerWaveIcon, VideoCameraIcon } from './icons';

interface ResultsDisplayProps {
  data: GeneratedData;
  onReset: () => void;
  onDownload: (asset: 'character' | 'audio' | 'video') => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, onReset, onDownload }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Creation Complete!</h2>
        <p className="text-gray-400 mt-2">Here are your generated assets. Download them or start a new creation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column for video */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="flex items-center text-xl font-semibold mb-3"><VideoCameraIcon className="w-6 h-6 mr-2 text-purple-400" /> Final Video</h3>
            {data.videoUrl ? (
              <video src={data.videoUrl} controls className="w-full rounded-md aspect-video bg-black" />
            ) : (
              <div className="w-full aspect-video bg-gray-800 rounded-md flex items-center justify-center text-gray-500">Video not available</div>
            )}
            <button
              onClick={() => onDownload('video')}
              disabled={!data.videoUrl}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download Video
            </button>
          </div>
           {/* Prompts Section */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="flex items-center text-xl font-semibold mb-3"><DocumentTextIcon className="w-6 h-6 mr-2 text-purple-400" /> Generated Prompts & Script</h3>
                <div className="space-y-3 text-sm text-gray-300 bg-gray-800/50 p-3 rounded-md">
                <p><strong>Character Prompt:</strong> {data.creativeAssets?.characterPrompt}</p>
                <p><strong>Video Prompt:</strong> {data.creativeAssets?.videoPrompt}</p>
                <p><strong>Voice Script:</strong> {data.creativeAssets?.voiceScript}</p>
                </div>
            </div>
        </div>

        {/* Right column for image and audio */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="flex items-center text-xl font-semibold mb-3"><PhotoIcon className="w-6 h-6 mr-2 text-purple-400" /> Character Image</h3>
            {data.characterImage ? (
              <img src={data.characterImage} alt="Generated Character" className="w-full rounded-md aspect-square object-cover bg-black" />
            ) : (
              <div className="w-full aspect-square bg-gray-800 rounded-md flex items-center justify-center text-gray-500">Image not available</div>
            )}
             <button
              onClick={() => onDownload('character')}
              disabled={!data.characterImage}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download Image
            </button>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="flex items-center text-xl font-semibold mb-3"><SpeakerWaveIcon className="w-6 h-6 mr-2 text-purple-400" /> Voiceover</h3>
            {data.audioUrl ? (
              <audio src={data.audioUrl} controls className="w-full" />
            ) : (
              <div className="w-full h-[54px] bg-gray-800 rounded-md flex items-center justify-center text-gray-500">Audio not available</div>
            )}
            <button
              onClick={() => onDownload('audio')}
              disabled={!data.audioUrl}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download Audio
            </button>
          </div>
        </div>
      </div>
      
      <div className="pt-4">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-all"
        >
          <ArrowPathIcon className="w-6 h-6 mr-2" />
          Start New Creation
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;
