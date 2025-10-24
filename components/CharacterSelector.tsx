
import React from 'react';
import type { CharacterVariation } from '../types';
import { CheckCircleIcon, PhotoIcon } from './icons';

interface CharacterSelectorProps {
  variations: CharacterVariation[];
  onSelect: (id: string) => void;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({ variations, onSelect }) => {
  if (variations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <PhotoIcon className="w-5 h-5 mr-2 text-purple-400" />
        <h3 className="font-semibold">Select Character Variation</h3>
      </div>
      <p className="text-sm text-gray-400">
        Choose the character image that best matches your vision. This will be used for all scenes to ensure consistency.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {variations.map((variation) => (
          <div
            key={variation.id}
            onClick={() => onSelect(variation.id)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
              variation.selected
                ? 'border-purple-500 ring-2 ring-purple-500'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <img
              src={variation.imageUrl}
              alt={`Variation ${variation.id}`}
              className="w-full aspect-square object-cover"
            />
            {variation.selected && (
              <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelector;
