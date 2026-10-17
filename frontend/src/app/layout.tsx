import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Visual Whispers',
  description: 'A game of telephone with pictures. One AI paints, a cast of characters describes, and the story drifts.',
};

export const viewport: Viewport = { themeColor: '#eceff3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
