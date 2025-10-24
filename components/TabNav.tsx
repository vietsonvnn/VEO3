
import React from 'react';
import { SparklesIcon, FolderIcon, CogIcon, DocumentTextIcon } from './icons';

export type TabType = 'create' | 'projects' | 'settings' | 'logs';

interface TabNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.FC<any> }[] = [
    { id: 'create', label: 'Create', icon: SparklesIcon },
    { id: 'projects', label: 'Projects', icon: FolderIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
    { id: 'logs', label: 'Logs', icon: DocumentTextIcon },
  ];

  return (
    <div className="flex border-b border-gray-700 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
              isActive
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabNav;
