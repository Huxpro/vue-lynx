export type RenderMode = 'vdom' | 'vapor';

interface VaporEntry {
  vaporStatus?: 'supported' | 'unsupported';
  vaporFile?: string;
  vaporWebFile?: string;
}

type Listener = () => void;

/** Aggregate view of the mode-aware content mounted on the current page. */
export interface ExampleCensus {
  /** Examples currently mounted (with loaded metadata). */
  total: number;
  /** Of those, how many can actually render with Vapor. */
  vaporSupported: number;
  /** Mode-aware code-tab groups (<ModeTabs>) currently mounted. */
  tabGroups: number;
}

export interface RenderModeBrowser {
  location: { href: string };
  history: {
    readonly state: unknown;
    replaceState(data: unknown, unused: string, url?: string | URL | null): void;
  };
  addEventListener(type: 'popstate', listener: Listener): void;
  removeEventListener(type: 'popstate', listener: Listener): void;
  /** localStorage-shaped persistence; absent or throwing degrades to memory-only. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

export interface RenderModeStore {
  getSnapshot(): RenderMode;
  getServerSnapshot(): RenderMode;
  subscribe(listener: Listener): () => void;
  setMode(mode: RenderMode): void;
  /**
   * Announce a mounted example (call from an effect; the returned cleanup
   * unregisters it). Feeds the nav control's coverage chip and its
   * dormant/active state.
   */
  registerExample(vaporSupported: boolean): () => void;
  /** Announce a mounted <ModeTabs> group (same lifecycle contract). */
  registerModeTabs(): () => void;
  getExampleCensus(): ExampleCensus;
  getServerExampleCensus(): ExampleCensus;
  destroy(): void;
}

const STORAGE_KEY = 'vue-lynx:go-mode';
const EMPTY_CENSUS: ExampleCensus = Object.freeze({
  total: 0,
  vaporSupported: 0,
  tabGroups: 0,
});

function parseMode(value: string | null | undefined): RenderMode | undefined {
  return value === 'vapor' || value === 'vdom' ? value : undefined;
}

/** Mode requested by the URL (`?go-mode=`), or undefined when absent/invalid. */
function modeFromHref(href?: string): RenderMode | undefined {
  if (!href) return undefined;
  return parseMode(new URL(href).searchParams.get('go-mode'));
}

function modeFromStorage(browser?: RenderModeBrowser): RenderMode | undefined {
  try {
    return parseMode(browser?.storage?.getItem(STORAGE_KEY));
  } catch {
    return undefined; // private browsing / storage denied
  }
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
  // Precedence: explicit deep link > persisted preference > default.
  // A deep link does not overwrite the persisted preference — following a
  // shared ?go-mode=vapor URL must not permanently flip the reader's choice.
  let mode: RenderMode = modeFromHref(browser?.location.href)
    ?? modeFromStorage(browser)
    ?? 'vdom';
  const listeners = new Set<Listener>();
  const examples = new Map<symbol, boolean>();
  const tabGroups = new Set<symbol>();
  let census: ExampleCensus = EMPTY_CENSUS;

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const recount = () => {
    let vaporSupported = 0;
    for (const supported of examples.values()) {
      if (supported) vaporSupported += 1;
    }
    census = examples.size === 0 && tabGroups.size === 0
      ? EMPTY_CENSUS
      : { total: examples.size, vaporSupported, tabGroups: tabGroups.size };
    notify();
  };

  const syncFromLocation = () => {
    // Back/forward: honor an explicit URL mode; a URL without the param
    // keeps the current (persisted) preference rather than resetting it.
    const nextMode = modeFromHref(browser?.location.href);
    if (nextMode === undefined || nextMode === mode) return;
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
    setMode(nextMode) {
      try {
        browser?.storage?.setItem(STORAGE_KEY, nextMode);
      } catch {
        // memory-only for this session
      }
      if (browser && modeFromHref(browser.location.href) !== undefined) {
        // The URL carries an explicit mode (deep link) — keep it truthful,
        // but never introduce the param on clean URLs.
        const url = new URL(browser.location.href);
        url.searchParams.set('go-mode', nextMode);
        browser.history.replaceState(browser.history.state, '', url);
      }
      if (nextMode === mode) return;
      mode = nextMode;
      notify();
    },
    registerExample(vaporSupported) {
      const key = Symbol('go-example');
      examples.set(key, vaporSupported);
      recount();
      return () => {
        examples.delete(key);
        recount();
      };
    },
    registerModeTabs() {
      const key = Symbol('mode-tabs');
      tabGroups.add(key);
      recount();
      return () => {
        tabGroups.delete(key);
        recount();
      };
    },
    getExampleCensus: () => census,
    getServerExampleCensus: () => EMPTY_CENSUS,
    destroy() {
      browser?.removeEventListener('popstate', syncFromLocation);
      listeners.clear();
      examples.clear();
      tabGroups.clear();
      census = EMPTY_CENSUS;
    },
  };
}

const browser: RenderModeBrowser | undefined = typeof window === 'undefined'
  ? undefined
  : {
    location: window.location,
    history: window.history,
    addEventListener: (type, listener) => window.addEventListener(type, listener),
    removeEventListener: (type, listener) => window.removeEventListener(type, listener),
    storage: (() => {
      try {
        return window.localStorage;
      } catch {
        return undefined; // storage access denied
      }
    })(),
  };

export const renderModeStore = createRenderModeStore(browser);
