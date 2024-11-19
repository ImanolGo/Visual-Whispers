import { Loader2 } from 'lucide-react';
import type { WhisperState } from '../app/page';

interface ImageChainProps {
  whispers: WhisperState[];
  isGenerating: boolean;
}

export const ImageChain = ({ whispers, isGenerating }: ImageChainProps) => {
  if (whispers.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <div className="space-y-8">
      {whispers.map((whisper, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-6 transition-opacity"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={whisper.imageUrl}
                alt={`Generated image ${index + 1}`}
                className="w-full rounded-md shadow-sm"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Iteration {whisper.iteration}
                </h3>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-500">Description (will be used as next prompt):</p>
                  <p 
                    className="mt-1 text-gray-700"
                    data-testid="image-description"
                  >{whisper.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {isGenerating && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Generating next image...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}