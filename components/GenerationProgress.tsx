
import React from 'react';
import type { GenerationStatus, GenerationStep, StepStatus } from '../types';
import { CheckCircleIcon, DocumentTextIcon, UserIcon, SpeakerWaveIcon, VideoCameraIcon, ExclamationCircleIcon } from './icons';
import Spinner from './Spinner';

interface GenerationProgressProps {
  status: GenerationStatus;
}

const stepConfig: Record<GenerationStep, { name: string; icon: React.FC<any> }> = {
  prompting: { name: 'Generating Prompts & Script', icon: DocumentTextIcon },
  character: { name: 'Creating Character Image', icon: UserIcon },
  voice: { name: 'Synthesizing Voiceover', icon: SpeakerWaveIcon },
  video: { name: 'Generating Video with Veo', icon: VideoCameraIcon },
};

const StatusIcon: React.FC<{ status: StepStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Spinner />;
    case 'success':
      return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
    case 'error':
      return <ExclamationCircleIcon className="w-6 h-6 text-red-400" />;
    default:
      return <div className="w-6 h-6 border-2 border-gray-500 rounded-full"></div>;
  }
};

const GenerationProgress: React.FC<GenerationProgressProps> = ({ status }) => {
  const steps = Object.keys(status) as GenerationStep[];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center">Creation in Progress...</h2>
      <p className="text-gray-400 text-center max-w-md">The AI is working its magic. Video generation with Veo can take a few minutes. Please be patient!</p>
      <div className="w-full max-w-sm space-y-4">
        {steps.map((stepKey) => {
          const stepStatus = status[stepKey];
          const { name, icon: Icon } = stepConfig[stepKey];
          return (
            <div key={stepKey} className="flex items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex-shrink-0 mr-4">
                <StatusIcon status={stepStatus} />
              </div>
              <div className="flex-grow">
                <p className={`font-medium ${stepStatus !== 'idle' ? 'text-white' : 'text-gray-400'}`}>{name}</p>
              </div>
              <Icon className={`w-6 h-6 flex-shrink-0 ${stepStatus !== 'idle' ? 'text-purple-400' : 'text-gray-500'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationProgress;
