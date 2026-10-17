import { assetUrl } from '@/lib/api';
import { percent } from '@/lib/text';
import type { Step } from '@/lib/types';

/** Which of your original words survived, and how fast the story lost them. */
export function DriftPanel({ origin, steps }: { origin: string; steps: Step[] }) {
  const last = steps[steps.length - 1];
  const points = [1, ...steps.map((s) => s.drift.survival)];
  const w = 260, h = 80, pad = 6;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, points.length - 1);
  const y = (v: number) => pad + (1 - v) * (h - 2 * pad);
  const path = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <section className="grid gap-8 md:grid-cols-[1fr_auto]" aria-label="Drift">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontStretch: '125%' }}>What survived</h2>
        <p className="mt-1 text-sm text-muted">Your original words, after {steps.length} {steps.length === 1 ? 'whisper' : 'whispers'}.</p>
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-2xl" aria-label={`Original prompt: ${origin}`}>
          {last.drift.origin_words.length === 0 && <span className="text-muted">(no content words to track)</span>}
          {last.drift.origin_words.map(({ word, kept }) => (
            <span key={word} className={kept ? 'font-semibold underline decoration-blue decoration-4 underline-offset-4'
                                              : 'text-muted line-through decoration-pink decoration-[3px]'}>
              {word}<span className="sr-only">{kept ? ' (kept)' : ' (lost)'}</span>
            </span>
          ))}
        </p>
      </div>
      <figure>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[260px]" role="img"
             aria-label={`Share of original words per round: ${points.map(percent).join(', ')}`}>
          <line x1={pad} x2={w - pad} y1={y(0)} y2={y(0)} stroke="var(--line)" />
          <path d={path} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" />
          {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={i ? 'var(--blue)' : 'var(--pink)'} />)}
        </svg>
        <figcaption className="mt-1 text-xs text-muted">Words left per round, from 100% at your prompt</figcaption>
      </figure>
    </section>
  );
}

/** The punchline: where it started, where it ended up. */
export function Punchline({ origin, steps }: { origin: string; steps: Step[] }) {
  const first = steps[0], last = steps[steps.length - 1];
  return (
    <section aria-label="First and last" className="grid max-w-4xl gap-8 sm:grid-cols-2">
      <figure>
        <img src={assetUrl(first.image_url)} alt="The first painting" className="print aspect-square w-full rounded-md object-cover" />
        <figcaption className="mt-3">
          <span className="text-sm text-muted">Where it started</span>
          <p className="mt-1 text-xl font-semibold">“{origin}”</p>
        </figcaption>
      </figure>
      <figure>
        <img src={assetUrl(last.image_url)} alt="The latest painting" className="print aspect-square w-full rounded-md object-cover" />
        <figcaption className="mt-3">
          <span className="text-sm text-muted">Where it ended up, {steps.length - 1} whispers later</span>
          <p className="whisper mt-1 text-xl leading-snug">{last.persona.emoji} “{last.description}”</p>
        </figcaption>
      </figure>
    </section>
  );
}
