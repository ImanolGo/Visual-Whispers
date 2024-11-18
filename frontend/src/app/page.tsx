'use client';

import { useState } from 'react';
import { ImageChain } from '../components/ImageChain';
import { Controls } from '../components/Controls';

export type WhisperState = {
  imageUrl: string;
  description: string;
  prompt: string;
  iteration: number;
};

export type WhisperState = {
  imageUrl: string;
  description: string;
  prompt: string;
  iteration: number;
};

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
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8">Visual Whispers</h1>
      
      <div className="mb-8 max-w-xl mx-auto text-center text-gray-600">
        <p>Generate images through an AI telephone game where each image is described from a unique perspective.</p>
      </div>

      <Controls 
        onNewGeneration={handleNewGeneration}
        onReset={handleReset}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        currentIteration={whispers.length}
      />

      {error && (
        <div className="my-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <ImageChain 
        whispers={whispers}
        isGenerating={isGenerating}
      />
    </main>
  );
}