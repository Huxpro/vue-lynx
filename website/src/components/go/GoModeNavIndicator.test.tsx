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

test('renders a single Vapor on/off switch (VDOM is simply "off")', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vdom',
      census: { total: 2, vaporSupported: 2 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /Vapor/);
  assert.doesNotMatch(html, /VDOM/);
  assert.match(html, /role="switch"/);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /aria-label="Render examples with Vapor"/);
  assert.match(html, /data-mode="vdom"/);
  assert.match(html, /go-mode-nav-control__track/);
  assert.match(html, /go-mode-nav-control__knob/);
  assert.equal(html.match(/<button/g)?.length, 1);
});

test('the switch reports on when Vapor is active', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 2, vaporSupported: 2 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /aria-checked="true"/);
  assert.match(html, /data-mode="vapor"/);
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

  assert.match(html, /aria-label="以 Vapor 渲染示例"/);
  assert.match(html, /本页 1\/3 个示例支持 Vapor/);
});

test('a Vapor-running example shows a tinted interactive badge', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: '7guis/counter',
      requested: 'vapor',
      mode: 'vapor',
      status: 'supported',
      onToggle: noop,
    }),
  );

  assert.match(html, /<button/);
  assert.match(html, /data-render-mode="vapor"/);
  assert.match(html, />Vapor</);
  assert.match(html, /click to switch every example to VDOM/);
});

test('a supported example in VDOM mode invites switching to Vapor', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: '7guis/counter',
      requested: 'vdom',
      mode: 'vdom',
      status: 'supported',
      onToggle: noop,
    }),
  );

  assert.match(html, /<button/);
  assert.match(html, />VDOM</);
  assert.doesNotMatch(html, /VDOM only/);
  assert.match(html, /click to switch every example to Vapor/);
});

test('supported examples with missing Vapor bundles explain their fallback', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'hello-world/main',
      requested: 'vapor',
      mode: 'vdom',
      status: 'supported',
    }),
  );

  assert.doesNotMatch(html, /<button/);
  assert.match(html, /VDOM only/);
  assert.match(html, /Vapor bundle not built/);
});

test('unsupported examples explain their VDOM fallback while Vapor is requested', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'transition/main',
      requested: 'vapor',
      mode: 'vdom',
      status: 'unsupported',
      reason: 'transition',
    }),
  );

  assert.doesNotMatch(html, /<button/);
  assert.match(html, /data-render-mode="vdom"/);
  assert.match(html, /VDOM only/);
  assert.match(html, /Uses Transition/);
});

test('unsupported examples stay quiet in VDOM mode (reason in tooltip only)', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'transition/main',
      requested: 'vdom',
      mode: 'vdom',
      status: 'unsupported',
      reason: 'transition',
    }),
  );

  assert.match(html, /VDOM only/);
  assert.doesNotMatch(html, /vapor-status__reason/);
  assert.match(html, /title="Uses Transition"/);
});

test('localizes entry capability and reason codes for Chinese docs', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: 'vue-router/main',
      requested: 'vapor',
      mode: 'vdom',
      status: 'unsupported',
      reason: 'vue-router',
      locale: 'zh',
    }),
  );

  assert.match(html, /仅 VDOM/);
  assert.match(html, /使用 Vue Router/);
});
