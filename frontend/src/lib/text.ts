/** Split a whisper into segments, flagging words the backend says are new this round. */
export function highlightNew(text: string, newWords: string[]): { text: string; isNew: boolean }[] {
  if (!newWords.length) return [{ text, isNew: false }];
  const fresh = new Set(newWords.map((w) => w.toLowerCase()));
  const out: { text: string; isNew: boolean }[] = [];
  for (const part of text.split(/([A-Za-z][A-Za-z'-]+)/)) {
    if (!part) continue;
    const isNew = fresh.has(part.toLowerCase().replace(/^['-]+|['-]+$/g, ''));
    const last = out[out.length - 1];
    if (last && last.isNew === isNew && !isNew) last.text += part;
    else out.push({ text: part, isNew });
  }
  return out;
}

export function percent(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function imaginationLabel(x: number): string {
  if (x < 0.35) return 'Literal';
  if (x < 0.7) return 'Playful';
  return 'Unhinged';
}
