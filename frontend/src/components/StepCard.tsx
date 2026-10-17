'use client';

import { assetUrl } from '@/lib/api';
import { highlightNew, percent } from '@/lib/text';
import type { LiveStep, Step } from '@/lib/types';

const CARD = 'flex w-[min(86vw,23rem)] flex-none snap-start flex-col rounded-2xl border-2 border-[var(--line)] bg-sheet p-4';

function Heard({ text, isFirst }: { text: string; isFirst: boolean }) {
  const short = text.split('\n\n')[0];
  return (
    <details className="group mt-1 text-sm text-muted">
      <summary className="cursor-pointer select-none list-none truncate hover:text-ink">
        <span aria-hidden className="inline-block transition-transform group-open:rotate-90">▸</span>{' '}
        {isFirst ? 'Painted from your prompt' : 'What the painter heard'}
      </summary>
      <p className="mt-1 whitespace-pre-line">{isFirst ? short : text}</p>
    </details>
  );
}

export function StepCard({ step, index, active, fresh }: { step: Step; index: number; active: boolean; fresh: boolean }) {
  const parts = highlightNew(step.description, step.drift.new_words);
  return (
    <article data-index={index} className={`${CARD} ${active ? 'border-ink' : ''}`} aria-label={`Round ${index + 1}`}>
      <header className="flex items-baseline gap-3">
        <span className="text-3xl font-black tabular-nums" style={{ fontStretch: '140%' }}>{index + 1}</span>
        <span className="truncate text-sm">
          <span aria-hidden>{step.persona.emoji}</span> {step.persona.name}
        </span>
      </header>
      <Heard text={step.heard} isFirst={index === 0} />

      <div className="mt-3 px-1.5">
        <img src={assetUrl(step.image_url)} alt={`Round ${index + 1}: ${step.description.slice(0, 120)}`}
             className={`print aspect-square w-full rounded-md object-cover ${fresh ? 'fresh' : ''}`} loading="lazy" />
      </div>

      <p className="whisper mt-4 text-[1.13rem] leading-relaxed">
        {parts.map((p, i) => (p.isNew ? <mark key={i} className="new">{p.text}</mark> : <span key={i}>{p.text}</span>))}
      </p>

      <footer className="mt-auto pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
            <span className="block h-full bg-blue" style={{ width: percent(step.drift.survival) }} />
          </span>
          <span className="tabular-nums">{percent(step.drift.survival)} of your words left</span>
        </div>
      </footer>
    </article>
  );
}

export function LiveCard({ live, index }: { live: LiveStep; index: number }) {
  return (
    <article className={`${CARD} border-ink`} aria-live="polite" aria-busy="true" aria-label={`Round ${index + 1}, in progress`}>
      <header className="flex items-baseline gap-3">
        <span className="text-3xl font-black tabular-nums" style={{ fontStretch: '140%' }}>{index + 1}</span>
        <span className="truncate text-sm"><span aria-hidden>{live.persona.emoji}</span> {live.persona.name}</span>
      </header>
      <p className="mt-1 text-sm text-muted">
        {live.stage === 'painting' ? 'Painting what they heard…' : `${live.persona.name} is squinting at it…`}
      </p>
      <div className="mt-3 px-1.5">
        {live.imageUrl ? (
          <img src={live.imageUrl} alt="The new painting" className="print fresh aspect-square w-full rounded-md object-cover" />
        ) : (
          <div className="halftone aspect-square w-full rounded-md" aria-hidden />
        )}
      </div>
      <p className="whisper caret mt-4 min-h-[6rem] text-[1.13rem] leading-relaxed">{live.text}</p>
    </article>
  );
}
