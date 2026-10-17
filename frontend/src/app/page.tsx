'use client';

import { useEffect, useState } from 'react';
import { DriftPanel, Punchline } from '@/components/Drift';
import { PersonaPicker } from '@/components/PersonaPicker';
import { Title } from '@/components/Title';
import { Trail } from '@/components/Trail';
import { API, download, health as fetchHealth, share } from '@/lib/api';
import { PERSONAS, STARTERS } from '@/lib/personas';
import { imaginationLabel } from '@/lib/text';
import type { Health, Persona } from '@/lib/types';
import { useChain } from '@/lib/useChain';

const SETTINGS_KEY = 'vw:settings';
type Saved = { teamIds: string[]; shuffle: boolean; imagination: number; bleed: boolean; rounds: number };

export default function Home() {
  const c = useChain();
  const [team, setTeam] = useState<Persona[]>([PERSONAS[0]]);
  const [shuffle, setShuffle] = useState(false);
  const [imagination, setImagination] = useState(0.6);
  const [bleed, setBleed] = useState(true);
  const [rounds, setRounds] = useState(5);
  const [health, setHealth] = useState<Health | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyExport, setBusyExport] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth().then(setHealth);
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') as Saved | null;
      if (s) {
        const restored = s.teamIds.map((id) => PERSONAS.find((p) => p.id === id)).filter(Boolean) as Persona[];
        if (restored.length) setTeam(restored);
        setShuffle(s.shuffle);
        setImagination(s.imagination);
        setBleed(s.bleed);
        setRounds(s.rounds || 5);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const saved: Saved = { teamIds: team.map((t) => t.id), shuffle, imagination, bleed, rounds };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [team, shuffle, imagination, bleed, rounds]);

  const started = c.steps.length > 0;
  const settings = { team, shuffle, imagination, bleed };

  const runExport = async (kind: 'gif' | 'html' | 'link') => {
    setBusyExport(kind);
    setNotice(null);
    try {
      if (kind === 'link') {
        const url = await share(c.chain);
        try {
          await navigator.clipboard.writeText(url);
          setNotice(`Link copied: ${url}`);
        } catch {
          setNotice(`Share this link: ${url}`);
        }
      } else {
        await download(c.chain, kind);
      }
    } catch (e) {
      c.setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyExport(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl pb-24">
      <header className="px-4 pt-10 sm:px-8 sm:pt-16">
        <Title />
        <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-muted">
          Telephone, played with pictures. One model paints, a character describes what they see,
          and the next painting is made from their words alone. Watch what gets lost.
        </p>
        <Status health={health} />
      </header>

      {c.sharedFrom && (
        <p className="mx-4 mt-8 rounded-xl border-2 border-blue px-4 py-3 text-sm sm:mx-8">
          Someone shared this chain with you. Pass it on to keep playing, or start over with your own.
        </p>
      )}

      <section className="mt-10 px-4 sm:px-8" aria-label="Start">
        {started ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <p className="text-2xl sm:text-3xl">
              <span className="text-muted">It started as </span>
              <span className="font-semibold">“{c.origin}”</span>
            </p>
            <button type="button" onClick={c.reset} disabled={c.playing}
                    className="text-sm text-muted underline underline-offset-4 hover:text-ink disabled:opacity-40">
              Start over
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); c.play(1, settings); }}>
            <label htmlFor="origin" className="text-lg font-semibold" style={{ fontStretch: '125%' }}>
              What should we whisper?
            </label>
            <div className="mt-2 flex items-end gap-3 border-b-[3px] border-ink">
              <input
                id="origin"
                value={c.origin}
                onChange={(e) => c.setOrigin(e.target.value)}
                placeholder={STARTERS[0]}
                maxLength={300}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent pb-2 text-[clamp(1.4rem,4vw,2.6rem)] font-medium placeholder:text-[var(--line)] focus:outline-none"
              />
              <button type="button" title="Suggest a prompt"
                      onClick={() => c.setOrigin(STARTERS[Math.floor(Math.random() * STARTERS.length)])}
                      className="mb-2 rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold hover:bg-ink hover:text-paper">
                <span aria-hidden>🎲</span> Suggest
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-10 grid gap-10 px-4 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <PersonaPicker team={team} onChange={setTeam} shuffle={shuffle} onShuffle={setShuffle} disabled={c.playing} />

        <fieldset disabled={c.playing} className="min-w-0">
          <legend className="text-lg font-semibold" style={{ fontStretch: '125%' }}>How loose?</legend>
          <label htmlFor="imagination" className="mt-3 flex items-baseline justify-between text-sm">
            <span>Imagination</span>
            <span className="font-semibold">{imaginationLabel(imagination)}</span>
          </label>
          <input id="imagination" type="range" min={0} max={1} step={0.05} value={imagination}
                 onChange={(e) => setImagination(Number(e.target.value))} className="mt-2 w-full" />
          <div className="flex justify-between text-xs text-muted"><span>Literal</span><span>Playful</span><span>Unhinged</span></div>

          <label className="mt-6 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)}
                   className="mt-0.5 h-4 w-4 accent-[var(--pink)]" />
            <span>
              Let the character steer the painter
              <span className="block text-muted">Their obsessions get added to the next painting prompt, so drift is faster.</span>
            </span>
          </label>
        </fieldset>
      </section>

      <section className="mt-10 flex flex-wrap items-center gap-3 px-4 sm:px-8" aria-label="Play">
        {c.playing ? (
          <>
            <button type="button" onClick={c.stop}
                    className="rounded-full border-2 border-ink px-6 py-3 font-semibold hover:bg-ink hover:text-paper">
              Stop
            </button>
            <span className="text-sm text-muted" aria-live="polite">
              {c.roundsLeft > 1 ? `${c.roundsLeft} rounds to go` : 'Last round'}
            </span>
          </>
        ) : (
          <>
            <button type="button" onClick={() => c.play(1, settings)} disabled={!c.origin.trim() || health === null}
                    className="rounded-full bg-pink px-7 py-3 text-lg font-bold text-white shadow-[3px_3px_0_var(--blue)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                    style={{ fontStretch: '120%' }}>
              {started ? 'Pass it on' : 'Start the whisper'}
            </button>
            <div className="flex items-center overflow-hidden rounded-full border-2 border-ink">
              <button type="button" onClick={() => c.play(rounds, settings)} disabled={!c.origin.trim() || health === null}
                      className="px-5 py-2.5 font-semibold hover:bg-ink hover:text-paper disabled:opacity-40">
                Play {rounds} rounds
              </button>
              <label htmlFor="rounds" className="sr-only">Number of rounds</label>
              <select id="rounds" value={rounds} onChange={(e) => setRounds(Number(e.target.value))}
                      className="border-l-2 border-ink bg-transparent py-2.5 pl-2 pr-1 text-sm">
                {[3, 5, 8, 12].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </>
        )}
      </section>

      {c.error && (
        <div role="alert" className="mx-4 mt-6 flex items-start justify-between gap-4 rounded-xl border-2 border-pink bg-sheet px-4 py-3 text-sm sm:mx-8">
          <span>{c.error}</span>
          <button type="button" onClick={() => c.setError(null)} className="text-muted hover:text-ink" aria-label="Dismiss">✕</button>
        </div>
      )}

      <Trail steps={c.steps} live={c.live} freshIds={c.freshIds} />

      {started && (
        <div className="mt-8 space-y-16 px-4 sm:px-8">
          <DriftPanel origin={c.origin} steps={c.steps} />
          {c.steps.length > 1 && <Punchline origin={c.origin} steps={c.steps} />}

          <section aria-label="Keep it" className="border-t-2 border-[var(--line)] pt-8">
            <h2 className="text-2xl font-bold" style={{ fontStretch: '125%' }}>Keep it</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {([['gif', 'Download GIF'], ['html', 'Download page'], ['link', 'Copy share link']] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => runExport(k)} disabled={!!busyExport || c.playing}
                        className="rounded-full border-2 border-ink px-5 py-2 font-semibold hover:bg-ink hover:text-paper disabled:opacity-40">
                  {busyExport === k ? 'Working…' : label}
                </button>
              ))}
            </div>
            {notice && <p className="mt-3 break-all text-sm text-muted" aria-live="polite">{notice}</p>}
          </section>
        </div>
      )}
    </main>
  );
}

function Status({ health }: { health: Health | null | undefined }) {
  if (health === undefined) return null;
  if (health === null)
    return (
      <p role="alert" className="mt-4 text-sm">
        <span className="font-semibold text-pink">Can’t reach the backend</span>
        <span className="text-muted"> at {API || window.location.origin}. Start it with ./start-local.sh, then reload.</span>
      </p>
    );
  if (!health.ok)
    return (
      <p role="alert" className="mt-4 text-sm">
        <span className="font-semibold text-pink">Setup needed: </span>
        <span className="text-muted">{health.problems.join('; ')}. Add it to .env and restart the backend.</span>
      </p>
    );
  return (
    <p className="mt-4 text-xs text-muted">
      {health.mock ? 'Demo mode: offline stand-ins, no API keys used. ' : ''}
      Painter: {health.painter}. Describer: {health.describer}.
    </p>
  );
}
