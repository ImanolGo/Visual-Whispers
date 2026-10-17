/**
 * Feed a chunk of an SSE stream; calls `onEvent` for each complete event and
 * returns the leftover (incomplete) buffer to pass in with the next chunk.
 */
export function parseSSE(buffer: string, chunk: string, onEvent: (event: string, data: unknown) => void): string {
  let buf = (buffer + chunk).replace(/\r\n/g, '\n');
  let idx: number;
  while ((idx = buf.indexOf('\n\n')) !== -1) {
    const block = buf.slice(0, idx);
    buf = buf.slice(idx + 2);
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (data.length) {
      try {
        onEvent(event, JSON.parse(data.join('\n')));
      } catch {
        /* ignore malformed event */
      }
    }
  }
  return buf;
}
