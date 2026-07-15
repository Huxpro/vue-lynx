import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { GoModeNavIndicator } from './GoModeNavIndicator';
import { VaporStatus } from './VaporStatus';

Object.assign(globalThis, { React });

const { createElement } = React;

test('switches the requested example renderer from the global navigation', () => {
  const html = renderToStaticMarkup(createElement(GoModeNavIndicator));

  assert.match(html, /Examples/);
  assert.match(html, /VDOM/);
  assert.match(html, /Vapor/);
  assert.match(html, /role="group"/);
  assert.match(html, /aria-label="Example renderer"/);
  assert.match(html, /data-mode="vdom"/);
  assert.equal(html.match(/<button/g)?.length, 2);
  assert.match(html, /aria-pressed="true"[^>]*>VDOM/);
});

test('localizes the global renderer control for Chinese docs', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavIndicator, { locale: 'zh' }),
  );

  assert.match(html, /示例/);
  assert.match(html, /VDOM/);
  assert.match(html, /aria-label="示例渲染器"/);
});

test('supported examples show their effective VDOM renderer without another switch', () => {
  const html = renderToStaticMarkup(
    createElement(VaporStatus, {
      entry: '7guis/counter',
      mode: 'vdom',
      status: 'supported',
    }),
  );

  assert.match(html, /data-render-mode="vdom"/);
  assert.match(html, />VDOM</);
  assert.doesNotMatch(html, /Vapor ready/);
  assert.doesNotMatch(html, /<button/);
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
