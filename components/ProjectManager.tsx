
import React, { useState, useEffect } from 'react';
import type { ProjectMetadata } from '../types';
import { FolderIcon, TrashIcon, PencilIcon, DocumentArrowUpIcon, ArrowDownTrayIcon } from './icons';

interface ProjectManagerProps {
  onSelectProject: (project: ProjectMetadata) => void;
  onNewProject: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ onSelectProject, onNewProject }) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const stored = localStorage.getItem('veo_projects');
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    }
  };

  const saveProjects = (updatedProjects: ProjectMetadata[]) => {
    localStorage.setItem('veo_projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const deleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
    }
  };

  const exportProject = (project: ProjectMetadata) => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `${project.name.replace(/\s+/g, '_')}_${project.id}.json`;
    link.click();
  };

  const importProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as ProjectMetadata;
          imported.id = Date.now().toString(); // New ID
          imported.createdAt = new Date().toISOString();
          saveProjects([...projects, imported]);
          alert('Project imported successfully!');
        } catch (error) {
          alert('Failed to import project. Invalid format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.idea.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center text-2xl font-semibold">
          <FolderIcon className="w-8 h-8 mr-3 text-purple-400" />
          <span>Project Manager</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={importProject}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
            Import
          </button>
          <button
            onClick={onNewProject}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
          >
            + New Project
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search projects..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            {searchTerm ? 'No projects found' : 'No projects yet. Create your first project!'}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportProject(project)}
                    className="text-gray-400 hover:text-purple-400 transition"
                    title="Export"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onSelectProject(project)}
                    className="text-gray-400 hover:text-blue-400 transition"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-gray-400 hover:text-red-400 transition"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">{project.idea}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{project.config.sceneCount} scenes • {project.config.style}</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
