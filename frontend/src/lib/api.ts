import { parseSSE } from './sse';
import type { Chain, Health, Persona, Step } from './types';

/** Empty in production (same origin as the backend); http://localhost:8000 in `next dev`. */
export const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const assetUrl = (path: string) => (path.startsWith('http') ? path : `${API}${path}`);

async function errorMessage(res: Response, fallback: string): Promise<string> {
  // The old client called res.json() on any error, which threw on plain-text 500s and hid the real message.
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text);
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d: { msg: string }) => d.msg).join('; ');
  } catch {
    /* not JSON */
  }
  return text.slice(0, 200) || `${fallback} (${res.status})`;
}

export async function health(): Promise<Health | null> {
  try {
    const res = await fetch(`${API}/api/health`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export type StepHandlers = {
  onStage: (stage: 'painting' | 'looking', model?: string) => void;
  onImage: (url: string) => void;
  onToken: (text: string) => void;
};

export async function runStep(
  body: { prompt: string; origin: string; previous: string | null; persona: Persona; imagination: number; bleed: boolean },
  handlers: StepHandlers,
  signal?: AbortSignal,
): Promise<Step> {
  const res = await fetch(`${API}/api/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, persona: { name: body.persona.name, emoji: body.persona.emoji, voice: body.persona.voice } }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(await errorMessage(res, 'The whisper failed'));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done: Step | null = null;
  let failure: string | null = null;

  while (true) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    buffer = parseSSE(buffer, decoder.decode(value, { stream: true }), (event, data) => {
      const d = data as Record<string, unknown>;
      if (event === 'stage') handlers.onStage(d.stage as 'painting' | 'looking', d.model as string);
      else if (event === 'image') handlers.onImage(assetUrl(d.url as string));
      else if (event === 'token') handlers.onToken(d.text as string);
      else if (event === 'done') done = d as unknown as Step;
      else if (event === 'error') failure = String(d.message);
    });
  }
  if (failure) throw new Error(failure);
  if (!done) throw new Error('The connection closed before the whisper finished');
  return done;
}

function exportBody(chain: Chain) {
  return JSON.stringify({
    origin: chain.origin,
    steps: chain.steps.map((s) => ({
      image_id: s.image_id,
      description: s.description,
      persona: s.persona,
      survival: s.drift.survival,
    })),
  });
}

export async function download(chain: Chain, kind: 'gif' | 'html'): Promise<void> {
  const res = await fetch(`${API}/api/export/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: exportBody(chain),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Export failed'));
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  const slug = chain.origin.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/-$/, '');
  a.href = url;
  a.download = `whispers-${slug || 'chain'}.${kind}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function share(chain: Chain): Promise<string> {
  const res = await fetch(`${API}/api/chains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chain),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Could not create a link'));
  const { id } = await res.json();
  return `${window.location.origin}${window.location.pathname}?c=${id}`;
}

export async function loadShared(id: string): Promise<Chain> {
  const res = await fetch(`${API}/api/chains/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(await errorMessage(res, 'That shared chain was not found'));
  return res.json();
}
