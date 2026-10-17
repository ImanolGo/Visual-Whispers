'use client';

import { useEffect, useRef, useState } from 'react';
import type { LiveStep, Step } from '@/lib/types';
import { LiveCard, StepCard } from './StepCard';

export function Trail({ steps, live, freshIds }: { steps: Step[]; live: LiveStep | null; freshIds: Set<string> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = steps.length + (live ? 1 : 0);

  const scrollTo = (i: number) => {
    const el = ref.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  // Follow the newest card as the game plays.
  useEffect(() => {
    if (count > 0) {
      setActive(count - 1);
      scrollTo(count - 1);
    }
  }, [count]);

  // Arrow keys move through the trail, but never while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      setActive((a) => {
        const next = Math.max(0, Math.min(count - 1, a + (e.key === 'ArrowRight' ? 1 : -1)));
        scrollTo(next);
        return next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count]);

  if (!count) return null;

  return (
    <section aria-label="The whisper trail" className="mt-12">
      <div className="flex items-baseline justify-between gap-4 px-4 sm:px-8">
        <h2 className="text-2xl font-bold" style={{ fontStretch: '125%' }}>The trail</h2>
        <p className="hidden text-sm text-muted sm:block">
          <mark className="new">Highlighted</mark> words are new this round. Use ← → to step through.
        </p>
      </div>
      <div ref={ref} className="trail mt-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-6 sm:px-8">
        {steps.map((s, i) => (
          <div key={s.image_id} className="flex items-stretch gap-4" onClick={() => setActive(i)}>
            {i > 0 && <Connector />}
            <StepCard step={s} index={i} active={active === i} fresh={freshIds.has(s.image_id)} />
          </div>
        ))}
        {live && (
          <div className="flex items-stretch gap-4">
            {steps.length > 0 && <Connector />}
            <LiveCard live={live} index={steps.length} />
          </div>
        )}
      </div>
    </section>
  );
}

function Connector() {
  return (
    <div aria-hidden className="flex w-6 flex-none items-center">
      <svg viewBox="0 0 24 60" className="w-6 text-pink">
        <path d="M2 30 C 8 18, 16 42, 22 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M17 25 L22 30 L17 35" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
