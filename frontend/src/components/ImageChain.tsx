import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { WhisperState } from '../app/page';

interface ImageChainProps {
  whispers: WhisperState[];
  isGenerating: boolean;
}

export const ImageChain = ({ whispers, isGenerating }: ImageChainProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to center of new image when added
  useEffect(() => {
    if (scrollContainerRef.current && whispers.length > 0) {
      const newImageElement = scrollContainerRef.current.querySelector(
        `[data-index="${whispers.length - 1}"]`
      );
      
      newImageElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [whispers.length]);

  if (whispers.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <div className="mt-12">
      {/* Main centered image and description */}
      <div
        ref={scrollContainerRef}
        className="relative flex items-center justify-start gap-8 overflow-x-auto pb-8 px-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',  // Firefox
          msOverflowStyle: 'none',  // IE/Edge
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {whispers.map((whisper, index) => (
          <div
            key={index}
            data-index={index}
            className="flex-none snap-center w-full max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-full aspect-square max-w-xl">
                  <img
                    src={whisper.imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="rounded-md shadow-sm object-cover w-full h-full"
                  />
                  <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    #{whisper.iteration}
                  </div>
                </div>
                <div className="w-full max-w-xl space-y-2">
                  <p className="text-sm font-medium text-gray-500">
                    Description (will be used as next prompt):
                  </p>
                  <p 
                    className="text-gray-700"
                    data-testid="image-description"
                  >
                    {whisper.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex-none snap-center w-full max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center h-[600px]">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                  <p className="text-gray-600">Generating next image...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline of thumbnails */}
      <div className="mt-8 flex justify-center">
        <div className="flex gap-2 p-2 bg-white rounded-lg shadow-sm overflow-x-auto max-w-full">
          {whispers.map((whisper, index) => (
            <button
              key={index}
              onClick={() => {
                const element = scrollContainerRef.current?.querySelector(
                  `[data-index="${index}"]`
                );
                element?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'center'
                });
              }}
              className="relative flex-none w-16 h-16 rounded-md overflow-hidden hover:ring-2 ring-blue-500 transition-all"
            >
              <img
                src={whisper.imageUrl}
                alt={`Thumbnail ${index + 1}`}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-xs font-medium">
                #{whisper.iteration}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};