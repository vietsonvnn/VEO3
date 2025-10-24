
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import type {
  AppState,
  GenerationStep,
  GenerationStatus,
  GeneratedData,
  VideoConfig,
  ApiConfig,
  Scene,
  CharacterVariation,
  ProjectMetadata,
} from './types';
import {
  generateCreativeAssets,
  generateCharacterVariations,
  generateSpeech,
  generateVideo,
  generateScenesVideos,
} from './services/geminiService';
import ApiKeySelector from './components/ApiKeySelector';
import IdeaForm from './components/IdeaForm';
import GenerationProgress from './components/GenerationProgress';
import ResultsDisplay from './components/ResultsDisplay';
import SceneReview from './components/SceneReview';
import CharacterSelector from './components/CharacterSelector';
import ProjectManager from './components/ProjectManager';
import { base64ToBlobUrl, downloadBlob } from './utils/fileUtils';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('api_key_selection');
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [idea, setIdea] = useState<string>('');
  const [script, setScript] = useState<string>('');
  const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    prompting: 'idle',
    character: 'idle',
    voice: 'idle',
    video: 'idle',
  });

  const [generatedData, setGeneratedData] = useState<GeneratedData>({
    characterImage: null,
    characterVariations: [],
    audioUrl: null,
    videoUrl: null,
    creativeAssets: null,
    scenes: [],
  });

  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [showProjectManager, setShowProjectManager] = useState(false);

  const updateStatus = (step: GenerationStep, status: 'pending' | 'success' | 'error') => {
    setGenerationStatus((prev) => ({ ...prev, [step]: status }));
  };

  const saveProject = useCallback(() => {
    if (!currentProject) return;

    const projects = JSON.parse(localStorage.getItem('veo_projects') || '[]');
    const existingIndex = projects.findIndex((p: ProjectMetadata) => p.id === currentProject.id);

    const updatedProject: ProjectMetadata = {
      ...currentProject,
      idea,
      script,
      config: videoConfig!,
      generatedData,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = updatedProject;
    } else {
      projects.push(updatedProject);
    }

    localStorage.setItem('veo_projects', JSON.stringify(projects));
    setCurrentProject(updatedProject);
  }, [currentProject, idea, script, videoConfig, generatedData]);

  const handleGenerate = useCallback(
    async (userIdea: string, userScript: string, config: VideoConfig) => {
      setIdea(userIdea);
      setScript(userScript);
      setVideoConfig(config);
      setAppState('progress');
      setError(null);
      setGenerationStatus({ prompting: 'idle', character: 'idle', voice: 'idle', video: 'idle' });
      setGeneratedData({
        characterImage: null,
        characterVariations: [],
        audioUrl: null,
        videoUrl: null,
        creativeAssets: null,
        scenes: [],
      });

      // Create new project
      const newProject: ProjectMetadata = {
        id: Date.now().toString(),
        name: userIdea.substring(0, 50),
        idea: userIdea,
        script: userScript,
        config,
        creativeAssets: null,
        generatedData: {
          characterImage: null,
          characterVariations: [],
          audioUrl: null,
          videoUrl: null,
          creativeAssets: null,
          scenes: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentProject(newProject);

      try {
        const ai = new GoogleGenAI({ apiKey: apiConfig!.apiKey });

        // Step 1: Generate prompts and scenes
        updateStatus('prompting', 'pending');
        const assets = await generateCreativeAssets(ai, userIdea, userScript, config);
        setGeneratedData((prev) => ({ ...prev, creativeAssets: assets, scenes: assets.scenes || [] }));
        updateStatus('prompting', 'success');

        // Step 2: Generate multiple character variations
        updateStatus('character', 'pending');
        const variations = await generateCharacterVariations(ai, assets.characterPrompt, 3);
        const characterVariations: CharacterVariation[] = variations.map((v, idx) => ({
          id: `var_${idx}`,
          imageUrl: `data:${v.mimeType};base64,${v.base64}`,
          prompt: assets.characterPrompt,
          selected: idx === 0, // Select first by default
        }));

        setGeneratedData((prev) => ({
          ...prev,
          characterVariations,
          characterImage: characterVariations[0].imageUrl,
        }));
        updateStatus('character', 'success');

        // Step 3: Review mode or Auto mode
        if (config.mode === 'review') {
          setAppState('scene_review');
          return; // Wait for user approval
        } else {
          // Auto mode - continue
          await processScenes(ai, assets.scenes || [], characterVariations[0]);
        }
      } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(errorMessage);

        if (generationStatus.prompting === 'pending') updateStatus('prompting', 'error');
        else if (generationStatus.character === 'pending') updateStatus('character', 'error');
        else if (generationStatus.voice === 'pending') updateStatus('voice', 'error');
        else if (generationStatus.video === 'pending') updateStatus('video', 'error');

        if (errorMessage.includes('Requested entity was not found')) {
          setError('API Key error. Please re-select your API key.');
          setAppState('api_key_selection');
        } else {
          setAppState('form');
        }
      }
    },
    [apiConfig, generationStatus]
  );

  const processScenes = async (ai: GoogleGenAI, scenes: Scene[], selectedCharacter: CharacterVariation) => {
    try {
      updateStatus('voice', 'pending');
      updateStatus('video', 'pending');

      // Extract base64 from data URL
      const base64Match = selectedCharacter.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) throw new Error('Invalid character image format');

      const mimeType = base64Match[1];
      const base64 = base64Match[2];

      // Batch generate all scenes with progress tracking
      const updatedScenes = await generateScenesVideos(
        ai,
        scenes,
        base64,
        mimeType,
        (sceneId, status, result) => {
          console.log(`Scene ${sceneId}: ${status}`);
          if (status === 'success' && result) {
            setGeneratedData((prev) => ({
              ...prev,
              scenes: prev.scenes.map((s) => (s.id === sceneId ? result : s)),
            }));
          }
        }
      );

      setGeneratedData((prev) => ({ ...prev, scenes: updatedScenes }));
      updateStatus('voice', 'success');
      updateStatus('video', 'success');

      setAppState('results');
      saveProject();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to generate scenes');
      updateStatus('video', 'error');
      setAppState('results');
    }
  };

  const handleApproveScenes = async () => {
    if (!apiConfig || !generatedData.characterVariations.length) return;

    const ai = new GoogleGenAI({ apiKey: apiConfig.apiKey });
    const selectedCharacter = generatedData.characterVariations.find((v) => v.selected);
    if (!selectedCharacter) {
      alert('Please select a character variation');
      return;
    }

    setAppState('progress');
    await processScenes(ai, generatedData.scenes, selectedCharacter);
  };

  const handleEditScene = (sceneId: string, updates: Partial<Scene>) => {
    setGeneratedData((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s)),
    }));
  };

  const handleRegenerateScene = async (sceneId: string) => {
    // TODO: Implement single scene regeneration
    alert('Scene regeneration coming soon!');
  };

  const handleSelectCharacter = (id: string) => {
    setGeneratedData((prev) => ({
      ...prev,
      characterVariations: prev.characterVariations.map((v) => ({
        ...v,
        selected: v.id === id,
      })),
      characterImage: prev.characterVariations.find((v) => v.id === id)?.imageUrl || null,
    }));
  };

  const handleReset = () => {
    setAppState('form');
    setIdea('');
    setScript('');
    setError(null);
    setGenerationStatus({ prompting: 'idle', character: 'idle', voice: 'idle', video: 'idle' });
    setGeneratedData({
      characterImage: null,
      characterVariations: [],
      audioUrl: null,
      videoUrl: null,
      creativeAssets: null,
      scenes: [],
    });
    setCurrentProject(null);
  };

  const handleDownload = async (asset: 'character' | 'audio' | 'video') => {
    if (!generatedData) return;

    switch (asset) {
      case 'character':
        if (generatedData.characterImage) {
          downloadBlob(generatedData.characterImage, 'character.png');
        }
        break;
      case 'audio':
        if (generatedData.audioUrl) {
          downloadBlob(generatedData.audioUrl, 'voiceover.mp3');
        }
        break;
      case 'video':
        if (generatedData.videoUrl) {
          downloadBlob(generatedData.videoUrl, 'final_video.mp4');
        }
        break;
    }
  };

  const handleSelectProject = (project: ProjectMetadata) => {
    setCurrentProject(project);
    setIdea(project.idea);
    setScript(project.script);
    setVideoConfig(project.config);
    setGeneratedData(project.generatedData);
    setShowProjectManager(false);
    setAppState('results');
  };

  const renderContent = () => {
    if (showProjectManager) {
      return (
        <ProjectManager
          onSelectProject={handleSelectProject}
          onNewProject={() => {
            setShowProjectManager(false);
            setAppState('form');
          }}
        />
      );
    }

    switch (appState) {
      case 'api_key_selection':
        return (
          <ApiKeySelector
            onKeySelected={(config) => {
              setApiConfig(config);
              setAppState('form');
            }}
          />
        );
      case 'form':
        return (
          <IdeaForm
            onGenerate={handleGenerate}
            initialIdea={idea}
            initialScript={script}
            initialConfig={videoConfig || undefined}
            error={error}
          />
        );
      case 'progress':
        return <GenerationProgress status={generationStatus} />;
      case 'scene_review':
        return (
          <div className="space-y-6">
            <CharacterSelector
              variations={generatedData.characterVariations}
              onSelect={handleSelectCharacter}
            />
            <SceneReview
              scenes={generatedData.scenes}
              onApprove={handleApproveScenes}
              onEditScene={handleEditScene}
              onRegenerateScene={handleRegenerateScene}
            />
          </div>
        );
      case 'results':
        return <ResultsDisplay data={generatedData} onReset={handleReset} onDownload={handleDownload} />;
      default:
        return <div>Invalid state</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Whisk → Veo 3.1 Automation
          </h1>
          <p className="text-gray-400 mt-2">Your automated idea-to-video creation pipeline.</p>
          {!showProjectManager && appState !== 'api_key_selection' && (
            <button
              onClick={() => setShowProjectManager(true)}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300"
            >
              View Projects
            </button>
          )}
        </header>
        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-500/10 p-6 sm:p-8 border border-gray-700">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google AI Studio</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
