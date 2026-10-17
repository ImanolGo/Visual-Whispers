'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadShared, runStep } from './api';
import { personaForRound } from './personas';
import type { Chain, LiveStep, Persona, Step } from './types';

const CHAIN_KEY = 'vw:chain';

function readStored(): Chain | null {
  try {
    const raw = localStorage.getItem(CHAIN_KEY);
    return raw ? (JSON.parse(raw) as Chain) : null;
  } catch {
    return null;
  }
}

function writeStored(chain: Chain | null) {
  try {
    if (chain && chain.steps.length) localStorage.setItem(CHAIN_KEY, JSON.stringify(chain));
    else localStorage.removeItem(CHAIN_KEY);
  } catch {
    /* private mode etc. */
  }
}

export type PlaySettings = { team: Persona[]; shuffle: boolean; imagination: number; bleed: boolean };

export function useChain() {
  const [origin, setOrigin] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [live, setLive] = useState<LiveStep | null>(null);
  const [roundsLeft, setRoundsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sharedFrom, setSharedFrom] = useState<string | null>(null);

  // Refs so the play loop always sees the latest chain (the old UI read the
  // previous description back out of the DOM, and its key handler used stale state).
  const stepsRef = useRef<Step[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const freshIds = useRef(new Set<string>()); // painted this session -> gets the print animation
  stepsRef.current = steps;

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('c');
    if (id) {
      loadShared(id)
        .then((chain) => {
          setOrigin(chain.origin);
          setSteps(chain.steps);
          setSharedFrom(id);
        })
        .catch((e) => setError(e.message));
      return;
    }
    const stored = readStored();
    if (stored) {
      setOrigin(stored.origin);
      setSteps(stored.steps);
    }
  }, []);

  useEffect(() => {
    if (!sharedFrom) writeStored(steps.length ? { origin, steps } : null);
  }, [origin, steps, sharedFrom]);

  const play = useCallback(
    async (rounds: number, settings: PlaySettings) => {
      const start = origin.trim();
      if (!start) {
        setError('Type something to whisper first.');
        return;
      }
      if (abortRef.current) return; // already playing
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      if (sharedFrom) {
        // continuing someone else's chain makes it yours
        setSharedFrom(null);
        window.history.replaceState(null, '', window.location.pathname);
      }

      try {
        for (let i = 0; i < rounds && !controller.signal.aborted; i++) {
          setRoundsLeft(rounds - i);
          const current = stepsRef.current;
          const last = current[current.length - 1];
          const persona = personaForRound(settings.team, current.length, settings.shuffle);
          const heard = last ? last.next_prompt : start;
          setLive({ stage: 'painting', persona, heard, text: '' });

          const step = await runStep(
            { prompt: heard, origin: start, previous: last?.description ?? null, persona,
              imagination: settings.imagination, bleed: settings.bleed },
            {
              onStage: (stage, model) => setLive((l) => (l ? { ...l, stage, model } : l)),
              onImage: (imageUrl) => setLive((l) => (l ? { ...l, imageUrl } : l)),
              onToken: (t) => setLive((l) => (l ? { ...l, text: l.text + t } : l)),
            },
            controller.signal,
          );
          freshIds.current.add(step.image_id);
          stepsRef.current = [...stepsRef.current, step];
          setSteps(stepsRef.current);
          setLive(null);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        abortRef.current = null;
        setLive(null);
        setRoundsLeft(0);
      }
    },
    [origin, sharedFrom],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setSteps([]);
    setLive(null);
    setError(null);
    setSharedFrom(null);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return {
    origin, setOrigin, steps, live, error, setError, sharedFrom,
    playing: roundsLeft > 0, roundsLeft, play, stop, reset, freshIds: freshIds.current,
    chain: { origin, steps } as Chain,
  };
}
