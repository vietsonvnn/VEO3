
import React, { useState, useCallback, useEffect } from 'react';
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
  TabType,
} from './types';
import { hybridApiService } from './services/hybridApiService';
import ApiKeySelector from './components/ApiKeySelector';
import IdeaForm from './components/IdeaForm';
import GenerationProgress from './components/GenerationProgress';
import ResultsDisplay from './components/ResultsDisplay';
import SceneReview from './components/SceneReview';
import CharacterSelector from './components/CharacterSelector';
import ProjectManager from './components/ProjectManager';
import TabNav from './components/TabNav';
import SettingsTab from './components/SettingsTab';
import LogsTab from './components/LogsTab';
import LogViewer from './components/LogViewer';
import { base64ToBlobUrl, downloadBlob } from './utils/fileUtils';
import { storageService } from './services/storageService';
import { logger } from './services/loggerService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('api_key_selection');
  const [activeTab, setActiveTab] = useState<TabType>('create');
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

  // Load saved values on mount
  useEffect(() => {
    const savedApiConfig = storageService.getApiConfig();
    const savedIdea = storageService.getLastIdea();
    const savedScript = storageService.getLastScript();
    const savedConfig = storageService.getLastConfig();

    if (savedApiConfig) {
      setApiConfig(savedApiConfig);
      setAppState('form');
      setActiveTab('create'); // Go directly to Create tab

      // Configure hybrid API service
      hybridApiService.configure(savedApiConfig);

      logger.info('✅ Restored API config from session', {
        hasCookies: !!savedApiConfig.cookies,
        cookieCount: savedApiConfig.cookies?.length || 0,
      });
    }

    if (savedIdea) setIdea(savedIdea);
    if (savedScript) setScript(savedScript);
    if (savedConfig) setVideoConfig(savedConfig);

    logger.info('App initialized', { hasApiConfig: !!savedApiConfig });
  }, []);

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
      // Save inputs to storage
      storageService.saveLastIdea(userIdea);
      storageService.saveLastScript(userScript);
      storageService.saveLastConfig(config);

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

      // Configure hybrid API service
      hybridApiService.configure(apiConfig!);

      const authMode = hybridApiService.getAuthMode(config);
      logger.info('🎬 Starting video generation', {
        idea: userIdea.substring(0, 100),
        sceneCount: config.sceneCount,
        duration: config.totalDurationMinutes,
        style: config.style,
        authMode: authMode === 'cookie' ? '🚀 COOKIE AUTH (BYPASS QUOTA)' : '🔑 API KEY',
        useCookieAuth: config.useCookieAuth,
      });

      if (authMode === 'none') {
        throw new Error('No authentication method available. Please configure API key or cookies in Settings.');
      }

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
        // Step 1: Generate prompts and scenes using Hybrid API
        updateStatus('prompting', 'pending');
        const assets = await hybridApiService.generateCreativeAssets(userIdea, userScript, config);
        setGeneratedData((prev) => ({ ...prev, creativeAssets: assets, scenes: assets.scenes || [] }));
        updateStatus('prompting', 'success');

        // Step 2: Generate character variations (ONLY if enabled)
        let characterVariations: CharacterVariation[] = [];
        if (config.useCharacterImage) {
          updateStatus('character', 'pending');
          logger.info('🎨 Generating character variations...');

          const variations = await hybridApiService.generateCharacterVariations(
            assets.characterPrompt,
            3,
            config
          );
          characterVariations = variations.map((v, idx) => ({
            id: `var_${idx}`,
            imageUrl: `data:${v.mimeType};base64,${v.base64}`,
            prompt: assets.characterPrompt,
            selected: idx === 0,
          }));

          setGeneratedData((prev) => ({
            ...prev,
            characterVariations,
            characterImage: characterVariations[0].imageUrl,
          }));
          updateStatus('character', 'success');
        } else {
          logger.info('⏭️ Skipping character generation (prompt-only mode)');
          updateStatus('character', 'success'); // Mark as success to show progress
        }

        // Step 3: Review mode or Auto mode
        if (config.mode === 'review') {
          setAppState('scene_review');
          return; // Wait for user approval
        } else {
          // Auto mode - continue
          await processScenes(assets.scenes || [], characterVariations[0], config);
        }
      } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(errorMessage);

        logger.error('❌ Generation failed', { error: errorMessage, stack: e.stack });

        if (generationStatus.prompting === 'pending') updateStatus('prompting', 'error');
        else if (generationStatus.character === 'pending') updateStatus('character', 'error');
        else if (generationStatus.voice === 'pending') updateStatus('voice', 'error');
        else if (generationStatus.video === 'pending') updateStatus('video', 'error');

        if (errorMessage.includes('Requested entity was not found')) {
          setError('API Key error. Please re-select your API key.');
          logger.warning('🔑 API key validation failed - redirecting to settings');
          setAppState('api_key_selection');
        } else {
          setAppState('form');
        }
      }
    },
    [apiConfig, generationStatus]
  );

  const processScenes = async (scenes: Scene[], selectedCharacter: CharacterVariation | undefined, config: VideoConfig) => {
    try {
      updateStatus('voice', 'pending');
      updateStatus('video', 'pending');

      let base64: string | undefined;
      let mimeType: string | undefined;

      // Extract base64 from data URL (if character mode is enabled)
      if (config.useCharacterImage && selectedCharacter) {
        const base64Match = selectedCharacter.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!base64Match) throw new Error('Invalid character image format');

        mimeType = base64Match[1];
        base64 = base64Match[2];
        logger.info('🎨 Using character image for video generation');
      } else {
        logger.info('📝 Using prompt-only mode (no character image)');
      }

      // Batch generate all scenes with progress tracking using Hybrid API
      const updatedScenes = await hybridApiService.generateScenesVideos(
        scenes,
        config.aspectRatio,
        base64,
        mimeType,
        config,
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
    if (!apiConfig || !videoConfig) return;

    // Check if using character mode
    if (videoConfig.useCharacterImage) {
      if (!generatedData.characterVariations.length) {
        alert('No character variations available');
        return;
      }
      const selectedCharacter = generatedData.characterVariations.find((v) => v.selected);
      if (!selectedCharacter) {
        alert('Please select a character variation');
        return;
      }
      setAppState('progress');
      await processScenes(generatedData.scenes, selectedCharacter, videoConfig);
    } else {
      // Prompt-only mode
      setAppState('progress');
      await processScenes(generatedData.scenes, undefined, videoConfig);
    }
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

  const handleApiConfigSave = (config: ApiConfig) => {
    setApiConfig(config);
    storageService.saveApiConfig(config);

    // Configure hybrid API service with new config
    hybridApiService.configure(config);

    logger.success('✅ API configuration saved', {
      hasCookies: !!config.cookies,
      cookieCount: config.cookies?.length || 0,
    });
    setActiveTab('create');
  };

  const renderTabContent = () => {
    // Auto-redirect to Settings if no API config (first time load)
    if (!apiConfig && activeTab !== 'settings') {
      // Auto-switch to settings tab to trigger auto-save
      setTimeout(() => setActiveTab('settings'), 100);
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">⏳ Loading default configuration...</p>
          <p className="text-sm text-gray-500">Redirecting to Settings...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'create':
        // Show creation flow based on current state
        switch (appState) {
          case 'api_key_selection':
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

      case 'projects':
        return (
          <ProjectManager
            onSelectProject={handleSelectProject}
            onNewProject={() => {
              setActiveTab('create');
              setAppState('form');
            }}
          />
        );

      case 'settings':
        return <SettingsTab onApiConfigSave={handleApiConfigSave} />;

      case 'logs':
        return <LogsTab />;

      default:
        return <div>Invalid tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Whisk → Veo 3.1 Automation
          </h1>
          <p className="text-gray-400 mt-2">Your automated idea-to-video creation pipeline.</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-500/10 border border-gray-700 overflow-hidden">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="p-6 sm:p-8">
            {renderTabContent()}
          </div>
        </main>

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google AI Studio • Built with React + Vite</p>
        </footer>
      </div>

      {/* Floating Log Viewer */}
      <LogViewer />
    </div>
  );
};

export default App;
