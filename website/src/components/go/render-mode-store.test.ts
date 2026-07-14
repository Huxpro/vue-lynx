import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createRenderModeStore,
  type RenderModeBrowser,
} from './render-mode-store';

function createBrowser(href: string) {
  const listeners = new Set<() => void>();
  const replacedUrls: string[] = [];
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
  };

  return {
    browser,
    replacedUrls,
    popstate(nextHref: string) {
      browser.location.href = nextHref;
      for (const listener of listeners) listener();
    },
  };
}

test('shares mode changes with every subscriber', () => {
  const { browser } = createBrowser('https://vue.lynx.test/guide?go-mode=vdom');
  const store = createRenderModeStore(browser);
  const snapshots: string[] = [];
  const unsubscribeA = store.subscribe(() => snapshots.push(`a:${store.getSnapshot()}`));
  const unsubscribeB = store.subscribe(() => snapshots.push(`b:${store.getSnapshot()}`));

  store.setMode('vapor', 'reactivity/main');

  assert.equal(store.getSnapshot(), 'vapor');
  assert.deepEqual(snapshots, ['a:vapor', 'b:vapor']);
  unsubscribeA();
  unsubscribeB();
  store.destroy();
});

test('replaces the URL without discarding unrelated state', () => {
  const { browser, replacedUrls } = createBrowser(
    'https://vue.lynx.test/guide?lang=zh&go-mode=vdom#demo',
  );
  const store = createRenderModeStore(browser);

  store.setMode('vapor', 'reactivity/main');

  assert.equal(replacedUrls.length, 1);
  assert.equal(
    replacedUrls[0],
    'https://vue.lynx.test/guide?lang=zh&go-mode=vapor&go-entry=reactivity%2Fmain#demo',
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

test('resynchronizes subscribers after popstate', () => {
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
