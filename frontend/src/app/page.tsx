'use client';

import { ImageChain } from '../components/ImageChain';
import { Controls } from '../components/Controls';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Visual Whispers</h1>
      <Controls />
      <ImageChain />
    </main>
  );
}
