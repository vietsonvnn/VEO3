
import React, { useState } from 'react';
import type { Scene } from '../types';
import { VideoCameraIcon, PencilIcon, ArrowPathIcon, CheckCircleIcon } from './icons';

interface ScenePreviewCardProps {
  scene: Scene;
  onEdit: (sceneId: string, updates: Partial<Scene>) => void;
  onRegenerate: (sceneId: string) => void;
  disabled?: boolean;
}

const ScenePreviewCard: React.FC<ScenePreviewCardProps> = ({
  scene,
  onEdit,
  onRegenerate,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(scene.videoPrompt);
  const [editedScript, setEditedScript] = useState(scene.voiceScript);

  const handleSave = () => {
    onEdit(scene.id, {
      videoPrompt: editedPrompt,
      voiceScript: editedScript,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPrompt(scene.videoPrompt);
    setEditedScript(scene.voiceScript);
    setIsEditing(false);
  };

  const getStatusBadge = () => {
    switch (scene.status) {
      case 'success':
        return <span className="px-2 py-1 text-xs bg-green-900/30 border border-green-700 text-green-400 rounded">✓ Generated</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-blue-900/30 border border-blue-700 text-blue-400 rounded animate-pulse">⏳ Generating...</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs bg-red-900/30 border border-red-700 text-red-400 rounded">✗ Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">○ Pending</span>;
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <VideoCameraIcon className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Scene {scene.index + 1}</h3>
          {getStatusBadge()}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                disabled={disabled || scene.status === 'pending'}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                title="Edit scene"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => onRegenerate(scene.id)}
                disabled={disabled || scene.status === 'pending'}
                className="flex items-center px-3 py-1 text-sm bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                title="Regenerate scene"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Regen
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center px-3 py-1 text-sm bg-green-600 rounded hover:bg-green-700 transition"
              >
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Video Prompt</label>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Voice Script</label>
            <textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="bg-gray-800/50 p-3 rounded">
            <span className="text-gray-500 text-xs">Video:</span>
            <p className="text-gray-300 mt-1">{scene.videoPrompt}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded">
            <span className="text-gray-500 text-xs">Voice:</span>
            <p className="text-gray-300 mt-1">{scene.voiceScript}</p>
          </div>
        </div>
      )}

      {/* Preview (if generated) */}
      {scene.status === 'success' && scene.videoUrl && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <video
            src={scene.videoUrl}
            controls
            className="w-full rounded bg-black"
            style={{ maxHeight: '200px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ScenePreviewCard;
