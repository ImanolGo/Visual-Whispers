import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { generateImage } from '../utils/api';
import type { WhisperState } from '../app/page';

interface ControlsProps {
  onNewGeneration: (whisper: WhisperState) => void;
  onReset: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  currentIteration: number;
}

export const Controls = ({
  onNewGeneration,
  onReset,
  isGenerating,
  setIsGenerating,
  currentIteration
}: ControlsProps) => {
  const [prompt, setPrompt] = useState('');
  const [perspective, setPerspective] = useState('as a medieval peasant');
  const [temperature, setTemperature] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Get the current prompt based on iteration
    const currentPrompt = currentIteration === 0 ? prompt : prompt || 
      document.querySelector('.text-gray-700')?.textContent || '';

    console.log('Submitting with:', {
      prompt: currentPrompt,
      perspective,
      temperature,
      currentIteration
    });

    if (!currentPrompt && currentIteration === 0) {
      setError('Please enter an initial prompt');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Calling API with:', {
        prompt: currentPrompt,
        perspective,
        temperature
      });

      const response = await generateImage(currentPrompt, perspective, temperature);
      console.log('API Response:', response);

      onNewGeneration({
        imageUrl: response.image_urls[0],
        description: response.description,
        prompt: response.modified_prompt,
        iteration: currentIteration + 1
      });

      // Only clear prompt for initial generation
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
          <div>
            <label htmlFor="perspective" className="block text-sm font-medium text-gray-700 mb-1">
              Description Perspective
            </label>
            <select
              id="perspective"
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isGenerating}
            >
              <option value="as a medieval peasant">Medieval Peasant</option>
              <option value="as a 6-year-old child">6-Year-Old Child</option>
              <option value="as an art critic">Art Critic</option>
              <option value="as a time traveler from the year 3000">Future Time Traveler</option>
              <option value="as a confused alien">Confused Alien</option>
              <option value="as a poetic soul">Poetic Soul</option>
            </select>
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