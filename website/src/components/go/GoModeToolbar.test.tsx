import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { VaporStatus } from './VaporStatus';

Object.assign(globalThis, { React });

const { createElement } = React;

async function loadToolbar() {
  try {
    return (await import('./GoModeToolbar')).GoModeToolbar;
  } catch {
    return undefined;
  }
}

test('describes one page-wide preview preference', async () => {
  const GoModeToolbar = await loadToolbar();
  assert.equal(typeof GoModeToolbar, 'function');

  const html = renderToStaticMarkup(createElement(GoModeToolbar!));

  assert.match(html, /Preview renderer/);
  assert.match(html, /All supported examples/);
  assert.match(html, /resets preview state/);
  assert.match(html, /role="group"/);
  assert.match(html, /aria-label="Preview renderer"/);
});

test('localizes the page-wide preference for Chinese docs', async () => {
  const GoModeToolbar = await loadToolbar();
  assert.equal(typeof GoModeToolbar, 'function');

  const html = renderToStaticMarkup(
    createElement(GoModeToolbar!, { locale: 'zh' }),
  );

  assert.match(html, /预览渲染器/);
  assert.match(html, /所有支持的示例/);
  assert.match(html, /切换会重置状态/);
});

test('supported examples show capability without another mode switch', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: '7guis/counter',
      mode: 'vdom',
      status: 'supported',
    }),
  );

  assert.match(html, /Vapor ready/);
  assert.doesNotMatch(html, /<button/);
});

test('unsupported examples explain their VDOM fallback', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'transition/main',
      mode: 'vdom',
      status: 'unsupported',
      reason: 'transition',
    }),
  );

  assert.match(html, /VDOM only/);
  assert.match(html, /Uses Transition/);
  assert.doesNotMatch(html, /<button/);
});

test('localizes entry capability and reason codes for Chinese docs', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'vue-router/main',
      mode: 'vdom',
      status: 'unsupported',
      reason: 'vue-router',
      locale: 'zh',
    }),
  );

  assert.match(html, /仅 VDOM/);
  assert.match(html, /使用 Vue Router/);
});
