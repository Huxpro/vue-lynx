export type RenderMode = 'vdom' | 'vapor';

interface VaporEntry {
  vaporStatus?: 'supported' | 'unsupported';
  vaporFile?: string;
  vaporWebFile?: string;
}

type Listener = () => void;

export interface RenderModeBrowser {
  location: { href: string };
  history: {
    readonly state: unknown;
    replaceState(data: unknown, unused: string, url?: string | URL | null): void;
  };
  addEventListener(type: 'popstate', listener: Listener): void;
  removeEventListener(type: 'popstate', listener: Listener): void;
}

export interface RenderModeStore {
  getSnapshot(): RenderMode;
  getServerSnapshot(): RenderMode;
  subscribe(listener: Listener): () => void;
  setMode(mode: RenderMode, entry?: string): void;
  destroy(): void;
}

function modeFromHref(href?: string): RenderMode {
  if (!href) return 'vdom';
  return new URL(href).searchParams.get('go-mode') === 'vapor' ? 'vapor' : 'vdom';
}

export function resolveRenderMode(
  requestedMode: RenderMode,
  entry?: VaporEntry,
): RenderMode {
  return requestedMode === 'vapor'
    && entry?.vaporStatus === 'supported'
    && Boolean(entry.vaporFile)
    && Boolean(entry.vaporWebFile)
    ? 'vapor'
    : 'vdom';
}

export function createRenderModeStore(browser?: RenderModeBrowser): RenderModeStore {
  let mode = modeFromHref(browser?.location.href);
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const syncFromLocation = () => {
    const nextMode = modeFromHref(browser?.location.href);
    if (nextMode === mode) return;
    mode = nextMode;
    notify();
  };

  browser?.addEventListener('popstate', syncFromLocation);

  return {
    getSnapshot: () => mode,
    getServerSnapshot: () => 'vdom',
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setMode(nextMode, entry) {
      if (browser) {
        const url = new URL(browser.location.href);
        url.searchParams.set('go-mode', nextMode);
        if (entry) url.searchParams.set('go-entry', entry);
        browser.history.replaceState(browser.history.state, '', url);
      }
      if (nextMode === mode) return;
      mode = nextMode;
      notify();
    },
    destroy() {
      browser?.removeEventListener('popstate', syncFromLocation);
      listeners.clear();
    },
  };
}

const browser = typeof window === 'undefined'
  ? undefined
  : (window as unknown as RenderModeBrowser);

export const renderModeStore = createRenderModeStore(browser);
