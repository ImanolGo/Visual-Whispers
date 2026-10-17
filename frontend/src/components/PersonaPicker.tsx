'use client';

import { useState } from 'react';
import { customPersona, PERSONAS } from '@/lib/personas';
import type { Persona } from '@/lib/types';

type Props = {
  team: Persona[];
  onChange: (team: Persona[]) => void;
  shuffle: boolean;
  onShuffle: (v: boolean) => void;
  disabled?: boolean;
};

export function PersonaPicker({ team, onChange, shuffle, onShuffle, disabled }: Props) {
  const [custom, setCustom] = useState('');
  const [extra, setExtra] = useState<Persona[]>([]);
  const all = [...PERSONAS, ...extra];

  const toggle = (p: Persona) => {
    const inTeam = team.some((t) => t.id === p.id);
    if (inTeam && team.length === 1) return; // someone has to play
    onChange(inTeam ? team.filter((t) => t.id !== p.id) : [...team, p]);
  };

  const addCustom = () => {
    if (custom.trim().length < 3) return;
    const p = customPersona(custom);
    if (!all.some((a) => a.id === p.id)) setExtra((e) => [...e, p]);
    if (!team.some((t) => t.id === p.id)) onChange([...team, p]);
    setCustom('');
  };

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="text-lg font-semibold" style={{ fontStretch: '125%' }}>Who is in the circle?</legend>
      <p className="text-sm text-muted mt-1 max-w-prose">
        Pick one character to keep the same voice, or several to take turns in the order you pick them.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {all.map((p) => {
          const order = team.findIndex((t) => t.id === p.id);
          const selected = order !== -1;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p)}
                aria-pressed={selected}
                title={p.blurb}
                className={`group flex items-center gap-2 rounded-full border-2 pl-2 pr-3 py-1.5 text-sm transition-colors
                  ${selected ? 'border-ink bg-ink text-paper' : 'border-[var(--line)] bg-sheet hover:border-ink'}`}
              >
                <span aria-hidden className="text-lg leading-none">{p.emoji}</span>
                <span className="font-medium">{p.name}</span>
                {selected && team.length > 1 && (
                  <span className="ml-0.5 grid h-5 w-5 place-items-center rounded-full bg-pink text-[11px] font-bold text-white">
                    {order + 1}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <form
          className="flex min-w-0 flex-1 basis-72 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <label htmlFor="custom-persona" className="sr-only">Invent a character</label>
          <input
            id="custom-persona"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Invent one: a tired barista who sees latte art everywhere"
            className="min-w-0 flex-1 rounded-lg border-2 border-[var(--line)] bg-sheet px-3 py-2 text-sm placeholder:text-muted focus:border-ink"
            maxLength={200}
          />
          <button type="submit" className="rounded-lg border-2 border-ink px-3 text-sm font-semibold hover:bg-ink hover:text-paper">
            Add
          </button>
        </form>
        <label className={`flex items-center gap-2 text-sm ${team.length < 2 ? 'opacity-50' : ''}`}>
          <input type="checkbox" checked={shuffle} onChange={(e) => onShuffle(e.target.checked)} disabled={team.length < 2}
                 className="h-4 w-4 accent-[var(--pink)]" />
          Random order
        </label>
      </div>
    </fieldset>
  );
}
