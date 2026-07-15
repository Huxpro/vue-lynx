import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { GoModeNavControl, GoModeNavIndicator } from './GoModeNavIndicator';
import { VaporStatus } from './VaporStatus';

Object.assign(globalThis, { React });

const { createElement } = React;

const noop = () => {};

test('renders nothing on pages without examples (and on the server)', () => {
  // The store-wired indicator: SSR census is always empty, so pre-rendered
  // pages never carry a dead toggle. It appears client-side only after a
  // <Go> example registers.
  assert.equal(renderToStaticMarkup(createElement(GoModeNavIndicator)), '');

  assert.equal(
    renderToStaticMarkup(
      createElement(GoModeNavControl, {
        mode: 'vdom',
        census: { total: 0, vaporSupported: 0 },
        locale: 'en',
        onSelect: noop,
      }),
    ),
    '',
  );
});

test('switches the requested example renderer from the global navigation', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vdom',
      census: { total: 2, vaporSupported: 2 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /Examples/);
  assert.match(html, /VDOM/);
  assert.match(html, /Vapor/);
  assert.match(html, /role="group"/);
  assert.match(html, /aria-label="Example renderer"/);
  assert.match(html, /data-mode="vdom"/);
  assert.equal(html.match(/<button/g)?.length, 2);
  assert.match(html, /aria-pressed="true"[^>]*>VDOM/);
});

test('shows Vapor coverage when some examples fall back', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 3, vaporSupported: 2 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /go-mode-nav-control__coverage/);
  assert.match(html, /2\/3/);
  assert.match(html, /2 of 3 examples on this page run Vapor/);
});

test('hides the coverage chip when every example runs Vapor', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 3, vaporSupported: 3 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.doesNotMatch(html, /go-mode-nav-control__coverage/);
});

test('localizes the global renderer control for Chinese docs', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 3, vaporSupported: 1 },
      locale: 'zh',
      onSelect: noop,
    }),
  );

  assert.match(html, /示例/);
  assert.match(html, /VDOM/);
  assert.match(html, /aria-label="示例渲染器"/);
  assert.match(html, /本页 1\/3 个示例支持 Vapor/);
});

test('supported examples show their effective Vapor renderer', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: '7guis/counter',
      mode: 'vapor',
      status: 'supported',
    }),
  );

  assert.match(html, /data-render-mode="vapor"/);
  assert.match(html, />Vapor</);
  assert.doesNotMatch(html, /<button/);
});

test('supported examples with missing Vapor bundles explain their fallback', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'hello-world/main',
      mode: 'vdom',
      status: 'supported',
    }),
  );

  assert.match(html, /VDOM only/);
  assert.match(html, /Vapor bundle not built/);
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

  assert.match(html, /data-render-mode="vdom"/);
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
