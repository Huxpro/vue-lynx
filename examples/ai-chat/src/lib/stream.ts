import { API_BASE } from './config';
import { getSessionId } from './api';
import { backendMode } from './backend-mode';
import { localStream } from './local-backend';
import {
  currentStreamEnvironment,
  selectStreamTransport,
  type StreamTransport,
} from './stream-transport';

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

export interface RemoteStreamOptions {
  transport?: StreamTransport;
  pollIntervalMs?: number;
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
  if ((await backendMode()) === 'local') {
    const chatId = req.path.match(/^\/api\/chats\/([^/?]+)/)?.[1] ?? '';
    await localStream(
      chatId,
      req.body as { model?: string; messages?: never[] },
      req.signal,
      req.onChunk,
    );
    return;
  }

  await streamRemoteUIMessages(req);
}

/** Consume a remote stream using a transport selected before generation starts. */
export async function streamRemoteUIMessages(
  req: StreamRequest,
  options: RemoteStreamOptions = {},
): Promise<void> {
  const transport = options.transport ?? selectStreamTransport(currentStreamEnvironment());

  const headers = {
    'content-type': 'application/json',
    'x-session-id': getSessionId(),
  };

  if (transport === 'poll') {
    await readPollingStream(req, headers, options.pollIntervalMs ?? 120);
    return;
  }

  const response = await _fetch(`${API_BASE}${req.path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req.body),
    signal: req.signal,
  });

  await assertOk(response);
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error(
      'Streaming fetch is unavailable in this runtime; configure the polling transport',
    );
  }
  await readSse(response.body, req.onChunk);
}

function pollPath(path: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}mode=poll`;
}

async function readPollingStream(
  req: StreamRequest,
  headers: Record<string, string>,
  pollIntervalMs: number,
): Promise<void> {
  const start = await _fetch(`${API_BASE}${pollPath(req.path)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req.body),
    signal: req.signal,
  });
  await assertOk(start);
  const { streamId } = (await start.json()) as { streamId?: string };
  if (!streamId) throw new Error('Polling stream did not return a stream id');

  let cursor = 0;
  let completed = false;
  try {
    for (;;) {
      if (req.signal.aborted) return;
      const res = await _fetch(`${API_BASE}/api/stream/${streamId}?cursor=${cursor}`, {
        headers,
        signal: req.signal,
      });
      await assertOk(res);
      if (req.signal.aborted) return;
      const data = (await res.json()) as {
        events: StreamChunk[];
        cursor: number;
        done: boolean;
      };
      for (const chunk of data.events) req.onChunk(chunk);
      cursor = data.cursor;
      if (data.done) {
        completed = true;
        return;
      }
      if (pollIntervalMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }
  } finally {
    if (!completed) {
      await _fetch(`${API_BASE}/api/stream/${streamId}`, {
        method: 'DELETE',
        headers,
      }).catch(() => undefined);
    }
  }
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;
  const text = await response.text();
  let message = `Request failed (${response.status})`;
  try {
    message = JSON.parse(text)?.message || message;
  } catch {
    /* keep default */
  }
  throw new Error(message);
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
      if (chunk) {
        onChunk(chunk);
      }
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
