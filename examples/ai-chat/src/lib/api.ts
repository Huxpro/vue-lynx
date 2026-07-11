import { API_BASE } from './config';
import { getItem, setItem } from './storage';
import { uid } from './uid';

// lynx-stack's RuntimeWrapperWebpackPlugin shadows `fetch` with an undefined
// parameter on the web platform — always go through globalThis.
const _fetch: typeof fetch = globalThis.fetch ?? fetch;

let sessionId = getItem('ai-chat:session');
if (!sessionId) {
  sessionId = uid();
  setItem('ai-chat:session', sessionId);
}

export function getSessionId(): string {
  return sessionId!;
}

export interface ApiError extends Error {
  status?: number;
}

/**
 * Replaces the original's $fetch: JSON in/out, throws on !ok with the
 * server's `message`, and attaches the session header (stand-in for the
 * original's cookie session).
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await _fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      'x-session-id': sessionId!,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err: ApiError = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data as T;
}

/** Absolute URL for server-relative assets (sample images, avatars). */
export function assetUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}
