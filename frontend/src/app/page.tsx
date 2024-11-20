'use client';

import { useState } from 'react';
import { ImageChain } from '../components/ImageChain';
import { Controls } from '../components/Controls';
import type { WhisperState } from '../app/types';

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [whispers, setWhispers] = useState<WhisperState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleNewGeneration = (newWhisper: WhisperState) => {
    setWhispers(prev => [...prev, newWhisper]);
  };

  const handleReset = () => {
    setWhispers([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Visual Whispers</h1>
          
          <div className="mb-8 max-w-xl mx-auto text-center text-gray-600">
            <p>Generate images through an AI telephone game where each image is described from a unique perspective.</p>
          </div>

          {error && (
            <div className="my-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <Controls 
            onNewGeneration={handleNewGeneration}
            onReset={handleReset}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            currentIteration={whispers.length}
          />

          <ImageChain 
            whispers={whispers}
            isGenerating={isGenerating}
          />
        </div>
      </main>
    </div>
  );
}