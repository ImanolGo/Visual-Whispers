import { Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { WhisperState } from '../app/types';

interface ImageChainProps {
  whispers: WhisperState[];
  isGenerating: boolean;
}

export const ImageChain = ({ whispers, isGenerating }: ImageChainProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateWhispers('prev');
      } else if (e.key === 'ArrowRight') {
        navigateWhispers('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [whispers.length]);

  // Scroll to new image when added
  useEffect(() => {
    if (whispers.length > 0) {
      setCurrentIndex(whispers.length - 1);
      scrollToIndex(whispers.length - 1);
    }
  }, [whispers.length]);

  const scrollToIndex = (index: number) => {
    const element = scrollContainerRef.current?.querySelector(
      `[data-index="${index}"]`
    );
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
    setCurrentIndex(index);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whispers)
      });

      if (!response.ok) throw new Error('Download failed');

      // Get the response as blob
      const blob = await response.blob();
      
      // Create a link and click it to download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visual_whispers_${new Date().toISOString().slice(0,19).replace(/[:.]/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report');
    }
  };

  const navigateWhispers = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(whispers.length - 1, currentIndex + 1);
    
    scrollToIndex(newIndex);
  };

  if (whispers.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <div className="mt-12 relative">
      {/* Add download button if there are whispers */}
      {whispers.length > 0 && (
        <button
          onClick={handleDownload}
          className="absolute right-4 top-[-3rem] bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Chain
        </button>
      )}
      
      {/* Navigation buttons */}
      {whispers.length > 1 && (
        <>
          <button
            onClick={() => navigateWhispers('prev')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-all
              ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            disabled={currentIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigateWhispers('next')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-all
              ${currentIndex === whispers.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            disabled={currentIndex === whispers.length - 1}
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main content */}
      <div
        ref={scrollContainerRef}
        className="relative flex items-stretch overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {whispers.map((whisper, index) => (
          <div
            key={index}
            data-index={index}
            className="flex-none w-full snap-center transition-opacity duration-300"
            style={{ opacity: currentIndex === index ? 1 : 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-6xl">
              <div className="flex flex-row items-stretch gap-8">
                {/* Image section */}
                <div className="w-1/2">
                  <div className="relative aspect-square">
                    <img
                      src={whisper.imageUrl}
                      alt={`Generated image ${index + 1}`}
                      className="rounded-md shadow-sm object-cover w-full h-full transform transition-transform duration-300 hover:scale-[1.02]"
                    />
                    <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      #{whisper.iteration}
                    </div>
                  </div>
                </div>

                {/* Description section */}
                <div className="w-1/2 flex flex-col justify-center">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Iteration {whisper.iteration}
                    </h3>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Description (will be used as next prompt):
                      </p>
                      <p 
                        className="text-gray-700 text-lg leading-relaxed"
                        data-testid="image-description"
                      >
                        {whisper.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading state */}
        {isGenerating && (
          <div className="flex-none w-full snap-center">
            <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-6xl">
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

      {/* Timeline thumbnails */}
      <div className="mt-8 flex justify-center">
        <div className="flex gap-2 p-2 bg-white rounded-lg shadow-sm overflow-x-auto max-w-full">
          {whispers.map((whisper, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`relative flex-none w-16 h-16 rounded-md overflow-hidden transition-all duration-300
                ${currentIndex === index 
                  ? 'ring-2 ring-blue-500 scale-110' 
                  : 'hover:ring-2 ring-blue-500 opacity-70 hover:opacity-100'}`}
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