import { API_BASE } from './config';

const _fetch: typeof fetch = globalThis.fetch ?? fetch;

let modePromise: Promise<'remote' | 'local'> | null = null;

/**
 * Decides once, on first API call, whether the example server is reachable.
 * When it isn't — the website's <Go> playground, a LynxExplorer bundle
 * scanned off the website, or just `pnpm dev` without `pnpm dev:server` —
 * every call transparently falls back to the in-app demo backend
 * (local-backend.ts), so the example is always alive.
 */
export function backendMode(): Promise<'remote' | 'local'> {
  if (!modePromise) modePromise = probe();
  return modePromise;
}

async function probe(): Promise<'remote' | 'local'> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await _fetch(`${API_BASE}/api/session`, {
      headers: { 'x-session-id': 'probe' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) return 'remote';
  } catch {
    /* unreachable */
  }
  console.info('[ai-chat] API server unreachable — using the in-app demo backend');
  return 'local';
}
