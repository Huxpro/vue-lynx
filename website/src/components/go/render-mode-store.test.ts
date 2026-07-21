import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createRenderModeStore,
  resolveRenderMode,
  type RenderModeBrowser,
} from './render-mode-store';

function createBrowser(href: string, stored?: Record<string, string>) {
  const listeners = new Set<() => void>();
  const replacedUrls: string[] = [];
  const storage = new Map<string, string>(Object.entries(stored ?? {}));
  const browser: RenderModeBrowser = {
    location: { href },
    history: {
      state: { rspress: true },
      replaceState(_state, _unused, url) {
        const nextHref = String(url);
        browser.location.href = nextHref;
        replacedUrls.push(nextHref);
      },
    },
    addEventListener(type, listener) {
      if (type === 'popstate') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'popstate') listeners.delete(listener);
    },
    storage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => void storage.set(key, value),
    },
  };

  return {
    browser,
    replacedUrls,
    storage,
    popstate(nextHref: string) {
      browser.location.href = nextHref;
      for (const listener of listeners) listener();
    },
  };
}

test('shares mode changes with every subscriber', () => {
  const { browser } = createBrowser('https://vue.lynx.test/guide');
  const store = createRenderModeStore(browser);
  const snapshots: string[] = [];
  const unsubscribeA = store.subscribe(() => snapshots.push(`a:${store.getSnapshot()}`));
  const unsubscribeB = store.subscribe(() => snapshots.push(`b:${store.getSnapshot()}`));

  store.setMode('vapor');

  assert.equal(store.getSnapshot(), 'vapor');
  assert.deepEqual(snapshots, ['a:vapor', 'b:vapor']);
  unsubscribeA();
  unsubscribeB();
  store.destroy();
});

test('persists the preference and restores it on a clean URL', () => {
  const { browser, storage } = createBrowser('https://vue.lynx.test/guide');
  const store = createRenderModeStore(browser);

  store.setMode('vapor');
  assert.equal(storage.get('vue-lynx:go-mode'), 'vapor');
  store.destroy();

  // Simulates a reload / navigation to another page: no URL param, but the
  // persisted preference survives.
  const { browser: browser2 } = createBrowser('https://vue.lynx.test/api/other', {
    'vue-lynx:go-mode': 'vapor',
  });
  const restored = createRenderModeStore(browser2);
  assert.equal(restored.getSnapshot(), 'vapor');
  assert.equal(restored.getServerSnapshot(), 'vdom');
  restored.destroy();
});

test('does not pollute clean URLs when toggling', () => {
  const { browser, replacedUrls } = createBrowser('https://vue.lynx.test/guide');
  const store = createRenderModeStore(browser);

  store.setMode('vapor');

  assert.deepEqual(replacedUrls, []);
  assert.equal(browser.location.href, 'https://vue.lynx.test/guide');
  store.destroy();
});

test('deep link overrides storage without overwriting it', () => {
  const { browser } = createBrowser('https://vue.lynx.test/guide?go-mode=vapor', {
    'vue-lynx:go-mode': 'vdom',
  });
  const store = createRenderModeStore(browser);

  assert.equal(store.getSnapshot(), 'vapor');
  // Following someone else's link must not flip the visitor's own preference.
  assert.equal(browser.storage!.getItem('vue-lynx:go-mode'), 'vdom');
  store.destroy();
});

test('keeps an existing URL mode param truthful, preserving unrelated state', () => {
  const { browser, replacedUrls } = createBrowser(
    'https://vue.lynx.test/guide?lang=zh&go-mode=vdom#demo',
  );
  const store = createRenderModeStore(browser);

  store.setMode('vapor');

  assert.equal(replacedUrls.length, 1);
  assert.equal(
    replacedUrls[0],
    'https://vue.lynx.test/guide?lang=zh&go-mode=vapor#demo',
  );
  store.destroy();
});

test('falls back to VDOM for an invalid URL mode', () => {
  const { browser } = createBrowser('https://vue.lynx.test/guide?go-mode=turbo');
  const store = createRenderModeStore(browser);

  assert.equal(store.getSnapshot(), 'vdom');
  assert.equal(store.getServerSnapshot(), 'vdom');
  store.destroy();
});

test('resynchronizes subscribers after popstate with an explicit mode', () => {
  const { browser, popstate } = createBrowser(
    'https://vue.lynx.test/guide?go-mode=vapor',
  );
  const store = createRenderModeStore(browser);
  const snapshots: string[] = [];
  store.subscribe(() => snapshots.push(store.getSnapshot()));

  popstate('https://vue.lynx.test/guide?go-mode=vdom');

  assert.equal(store.getSnapshot(), 'vdom');
  assert.deepEqual(snapshots, ['vdom']);
  store.destroy();
});

test('popstate to a clean URL keeps the current preference', () => {
  const { browser, popstate } = createBrowser(
    'https://vue.lynx.test/guide?go-mode=vapor',
  );
  const store = createRenderModeStore(browser);

  popstate('https://vue.lynx.test/guide');

  assert.equal(store.getSnapshot(), 'vapor');
  store.destroy();
});

test('survives a storage that throws', () => {
  const { browser } = createBrowser('https://vue.lynx.test/guide');
  browser.storage = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('denied');
    },
  };
  const store = createRenderModeStore(browser);

  assert.equal(store.getSnapshot(), 'vdom');
  store.setMode('vapor');
  assert.equal(store.getSnapshot(), 'vapor');
  store.destroy();
});

test('counts registered examples and their Vapor coverage', () => {
  const store = createRenderModeStore();
  const events: string[] = [];
  store.subscribe(() => {
    const { total, vaporSupported } = store.getExampleCensus();
    events.push(`${vaporSupported}/${total}`);
  });

  assert.deepEqual(store.getExampleCensus(), { total: 0, vaporSupported: 0, tabGroups: 0 });
  assert.deepEqual(store.getServerExampleCensus(), { total: 0, vaporSupported: 0, tabGroups: 0 });

  const unregisterA = store.registerExample(true);
  const unregisterB = store.registerExample(false);
  assert.deepEqual(store.getExampleCensus(), { total: 2, vaporSupported: 1, tabGroups: 0 });

  unregisterB();
  assert.deepEqual(store.getExampleCensus(), { total: 1, vaporSupported: 1, tabGroups: 0 });

  unregisterA();
  assert.deepEqual(store.getExampleCensus(), { total: 0, vaporSupported: 0, tabGroups: 0 });
  // The empty census is a stable reference — safe for useSyncExternalStore.
  assert.equal(store.getExampleCensus(), store.getServerExampleCensus());

  assert.deepEqual(events, ['1/1', '1/2', '1/1', '0/0']);
  store.destroy();
});

test('counts registered ModeTabs groups', () => {
  const store = createRenderModeStore();

  const unregister = store.registerModeTabs();
  assert.deepEqual(store.getExampleCensus(), { total: 0, vaporSupported: 0, tabGroups: 1 });

  unregister();
  assert.equal(store.getExampleCensus(), store.getServerExampleCensus());
  store.destroy();
});

test('uses Vapor only for supported entries with both bundles', () => {
  assert.equal(
    resolveRenderMode('vapor', {
      vaporStatus: 'supported',
      vaporFile: 'dist-vapor/main.lynx.bundle',
      vaporWebFile: 'dist-vapor/main.web.bundle',
    }),
    'vapor',
  );
  assert.equal(
    resolveRenderMode('vapor', {
      vaporStatus: 'unsupported',
      vaporFile: 'dist-vapor/main.lynx.bundle',
      vaporWebFile: 'dist-vapor/main.web.bundle',
    }),
    'vdom',
  );
  assert.equal(
    resolveRenderMode('vapor', {
      vaporStatus: 'supported',
      vaporFile: 'dist-vapor/main.lynx.bundle',
    }),
    'vdom',
  );
});

test('keeps VDOM when it is the requested mode', () => {
  assert.equal(
    resolveRenderMode('vdom', {
      vaporStatus: 'supported',
      vaporFile: 'dist-vapor/main.lynx.bundle',
      vaporWebFile: 'dist-vapor/main.web.bundle',
    }),
    'vdom',
  );
});
