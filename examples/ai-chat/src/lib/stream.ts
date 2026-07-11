import { API_BASE } from './config';
import { getSessionId } from './api';

const _fetch: typeof fetch = globalThis.fetch ?? fetch;

export interface StreamChunk {
  type: string;
  [key: string]: unknown;
}

export interface StreamRequest {
  path: string;
  body: unknown;
  signal: AbortSignal;
  onChunk: (chunk: StreamChunk) => void;
}

/**
 * Consumes the AI SDK UI-message-stream SSE protocol (the same wire format
 * `@ai-sdk/vue`'s DefaultChatTransport speaks).
 *
 * Lynx for Web has real ReadableStream support, so responses stream
 * incrementally; on runtimes without `response.body` (native Lynx fetch)
 * it falls back to a server-buffered polling stream — same chunks, same
 * ordering, slightly coarser latency.
 */
export async function streamUIMessages(req: StreamRequest): Promise<void> {
  const headers = {
    'content-type': 'application/json',
    'x-session-id': getSessionId(),
  };

  const probe = await _fetch(`${API_BASE}${req.path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req.body),
    signal: req.signal,
  });

  if (!probe.ok) {
    const text = await probe.text();
    let message = `Request failed (${probe.status})`;
    try {
      message = JSON.parse(text)?.message || message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  if (probe.body && typeof probe.body.getReader === 'function') {
    await readSse(probe.body, req.onChunk);
    return;
  }

  // ---- polling fallback ----------------------------------------------------
  // The first response was consumed as a full buffer; if the server already
  // streamed everything into it, parse it directly.
  const text = await probe.text();
  if (text.startsWith('data:')) {
    for (const chunk of parseSseText(text)) req.onChunk(chunk);
    return;
  }

  // Otherwise re-request in poll mode.
  const start = await _fetch(`${API_BASE}${req.path}?mode=poll`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req.body),
    signal: req.signal,
  });
  const { streamId } = (await start.json()) as { streamId: string };
  let cursor = 0;
  for (;;) {
    if (req.signal.aborted) return;
    const res = await _fetch(`${API_BASE}/api/stream/${streamId}?cursor=${cursor}`, {
      headers,
      signal: req.signal,
    });
    const data = (await res.json()) as {
      events: StreamChunk[];
      cursor: number;
      done: boolean;
    };
    for (const chunk of data.events) req.onChunk(chunk);
    cursor = data.cursor;
    if (data.done) return;
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onChunk: (c: StreamChunk) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) {
      const chunk = parseSseEvent(event);
      if (chunk) onChunk(chunk);
    }
  }
}

function parseSseEvent(event: string): StreamChunk | null {
  for (const line of event.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') return null;
    try {
      return JSON.parse(data) as StreamChunk;
    } catch {
      return null;
    }
  }
  return null;
}

function parseSseText(text: string): StreamChunk[] {
  const chunks: StreamChunk[] = [];
  for (const event of text.split('\n\n')) {
    const chunk = parseSseEvent(event);
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}
