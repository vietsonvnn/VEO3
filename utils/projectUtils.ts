
import type { ProjectMetadata, BatchItem } from '../types';

/**
 * Export project to JSON file
 */
export function exportProjectToFile(project: ProjectMetadata): void {
  const dataStr = JSON.stringify(project, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `${project.name.replace(/\s+/g, '_')}_${project.id}.json`;
  link.click();
}

/**
 * Import project from JSON file
 */
export function importProjectFromFile(): Promise<ProjectMetadata> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const project = JSON.parse(event.target?.result as string) as ProjectMetadata;
          // Assign new ID and timestamps
          project.id = Date.now().toString();
          project.createdAt = new Date().toISOString();
          project.updatedAt = new Date().toISOString();
          resolve(project);
        } catch (error) {
          reject(new Error('Failed to parse project file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Export batch items template
 */
export function exportBatchTemplate(): void {
  const template: BatchItem[] = [
    {
      id: '1',
      idea: 'A futuristic detective story in a rainy cyberpunk city',
      script: 'In the neon-lit streets, truth hides in shadows.',
      status: 'pending',
    },
    {
      id: '2',
      idea: 'A chef cooking in a rustic Italian kitchen',
      script: '',
      status: 'pending',
    },
  ];

  const dataStr = JSON.stringify(template, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = 'batch_template.json';
  link.click();
}

/**
 * Import batch items from JSON
 */
export function importBatchItems(): Promise<BatchItem[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const items = JSON.parse(event.target?.result as string) as BatchItem[];
          if (!Array.isArray(items)) {
            throw new Error('Invalid format');
          }
          resolve(items);
        } catch (error) {
          reject(new Error('Failed to parse batch file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}
