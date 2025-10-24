
import React, { useState } from 'react';
import type { Scene } from '../types';
import { VideoCameraIcon, PencilIcon, CheckCircleIcon, ArrowPathIcon } from './icons';

interface SceneReviewProps {
  scenes: Scene[];
  onApprove: () => void;
  onEditScene: (sceneId: string, updates: Partial<Scene>) => void;
  onRegenerateScene: (sceneId: string) => void;
}

const SceneReview: React.FC<SceneReviewProps> = ({ scenes, onApprove, onEditScene, onRegenerateScene }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Scene>>({});

  const startEdit = (scene: Scene) => {
    setEditingId(scene.id);
    setEditValues({
      prompt: scene.prompt,
      videoPrompt: scene.videoPrompt,
      voiceScript: scene.voiceScript,
    });
  };

  const saveEdit = (sceneId: string) => {
    onEditScene(sceneId, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Review Scenes</h2>
        <p className="text-gray-400">Review and edit each scene before generation</p>
      </div>

      <div className="space-y-4">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center font-semibold">
                <VideoCameraIcon className="w-5 h-5 mr-2 text-purple-400" />
                Scene {idx + 1}
              </h3>
              <div className="flex gap-2">
                {editingId === scene.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(scene.id)}
                      className="flex items-center px-3 py-1 text-sm bg-green-600 rounded hover:bg-green-700 transition"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(scene)}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 transition"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => onRegenerateScene(scene.id)}
                      className="flex items-center px-3 py-1 text-sm bg-purple-600 rounded hover:bg-purple-700 transition"
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-1" />
                      Regenerate
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === scene.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Video Prompt</label>
                  <textarea
                    value={editValues.videoPrompt || ''}
                    onChange={(e) => setEditValues({ ...editValues, videoPrompt: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Voice Script</label>
                  <textarea
                    value={editValues.voiceScript || ''}
                    onChange={(e) => setEditValues({ ...editValues, voiceScript: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Video:</span>
                  <p className="text-gray-300">{scene.videoPrompt}</p>
                </div>
                <div>
                  <span className="text-gray-500">Voice:</span>
                  <p className="text-gray-300">{scene.voiceScript}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onApprove}
        className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition"
      >
        <CheckCircleIcon className="w-5 h-5 mr-2" />
        Approve & Generate All Scenes
      </button>
    </div>
  );
};

export default SceneReview;
