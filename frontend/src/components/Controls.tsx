import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { generateImage, continueChain } from '../utils/api';
import type { WhisperState } from '../app/types';

interface ControlsProps {
  onNewGeneration: (whisper: WhisperState) => void;
  onReset: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  currentIteration: number;
}

const presetPerspectives = [
  {
    value: "mystic_shaman",
    label: "Ancient Mystic Shaman",
    perspective: "as an ancient mystic shaman who sees the spiritual essence and elemental forces in all things"
  },
  {
    value: "quantum_poet",
    label: "Quantum Physicist Poet",
    perspective: "as a quantum physicist poet who perceives reality through both scientific equations and metaphysical poetry"
  },
  {
    value: "forest_guardian",
    label: "Forest Spirit Guardian",
    perspective: "as an ancient forest spirit who understands the deep connections between all living things"
  },
  {
    value: "space_archeologist",
    label: "Space Archeologist",
    perspective: "as a space archeologist from the year 4000 studying artifacts of ancient Earth civilizations"
  },
  {
    value: "synesthete_musician",
    label: "Synesthete Musician",
    perspective: "as a musician with synesthesia who experiences colors, textures, and music simultaneously"
  },
  {
    value: "clockwork_engineer",
    label: "Victorian Clockwork Engineer",
    perspective: "as a Victorian-era engineer who sees everything in terms of intricate mechanical possibilities"
  },
  {
    value: "dream_interpreter",
    label: "Dream Interpreter",
    perspective: "as a professional dream interpreter who analyzes symbolic meanings and subconscious messages"
  },
  {
    value: "custom",
    label: "✨ Custom Perspective...",
    perspective: ""
  }
];

export const Controls = ({
  onNewGeneration,
  onReset,
  isGenerating,
  setIsGenerating,
  currentIteration
}: ControlsProps) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(presetPerspectives[0].value);
  const [customPerspective, setCustomPerspective] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  // Get the active perspective based on selection
  const getActivePerspective = () => {
    if (selectedPreset === "custom") {
      return customPerspective.trim() ? customPerspective : "as a unique observer";
    }
    return presetPerspectives.find(p => p.value === selectedPreset)?.perspective || presetPerspectives[0].perspective;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsGenerating(true);
    try {
      let response;
      const activePerspective = getActivePerspective();
      
      if (currentIteration === 0) {
        if (!prompt) {
          setError('Please enter an initial prompt');
          return;
        }
        console.log('Generating first image with:', { 
          prompt, 
          perspective: activePerspective, 
          temperature 
        });
        response = await generateImage(prompt, activePerspective, temperature);
      } else {
        const descriptions = document.querySelectorAll('[data-testid="image-description"]');
        const lastDescription = descriptions[descriptions.length - 1]?.textContent;
        
        if (!lastDescription) {
          setError('Could not find previous description');
          return;
        }
        
        console.log('Continuing chain with:', { 
          previousPrompt: lastDescription, 
          perspective: activePerspective, 
          temperature 
        });
        response = await continueChain(lastDescription, activePerspective, temperature);
      }

      console.log('API Response:', response);

      onNewGeneration({
        imageUrl: response.image_url || response.image_urls[0],
        description: response.description,
        prompt: response.modified_prompt || response.description,
        iteration: currentIteration + 1
      });

      if (currentIteration === 0) {
        setPrompt('');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {currentIteration === 0 && (
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Prompt
            </label>
            <input
              type="text"
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter your initial image prompt..."
              disabled={isGenerating}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="perspective" className="block text-sm font-medium text-gray-700">
              Description Perspective
            </label>
            <select
              id="perspective"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isGenerating}
            >
              {presetPerspectives.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            {selectedPreset === "custom" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customPerspective}
                  onChange={(e) => setCustomPerspective(e.target.value)}
                  placeholder="Describe your character's perspective..."
                  className="w-full p-2 border rounded-md"
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Example: "as a tired barista who sees everything as potential coffee art"
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
              Imagination Level: {temperature}
            </label>
            <input
              type="range"
              id="temperature"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Literal</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isGenerating || (currentIteration === 0 && !prompt)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Generating...
              </span>
            ) : (
              currentIteration === 0 ? 'Generate First Image' : 'Generate Next Image'
            )}
          </button>

          {currentIteration > 0 && (
            <button
              type="button"
              onClick={onReset}
              disabled={isGenerating}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
};