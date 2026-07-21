import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { GoModeNavControl, GoModeNavIndicator } from './GoModeNavIndicator';
import { VaporStatus } from './VaporStatus';

Object.assign(globalThis, { React });

const { createElement } = React;

const noop = () => {};

test('renders dormant (not hidden) on pages without mode-aware content', () => {
  // Persistent control: instead of popping in and out per page, it dims
  // when nothing on the page responds to it — and still works site-wide.
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vdom',
      census: { total: 0, vaporSupported: 0, tabGroups: 0 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /data-dormant="true"/);
  assert.match(html, /role="switch"/);
  assert.doesNotMatch(html, /go-mode-nav-control__coverage/);
  // SSR (store-wired) pre-renders the same dormant control.
  assert.match(renderToStaticMarkup(createElement(GoModeNavIndicator)), /data-dormant="true"/);
});

test('a page with only ModeTabs wakes the control and shows no coverage chip', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 0, vaporSupported: 0, tabGroups: 2 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.doesNotMatch(html, /data-dormant/);
  assert.doesNotMatch(html, /go-mode-nav-control__coverage/);
});

test('exposes a scope explainer via the info button', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vdom',
      census: { total: 1, vaporSupported: 1, tabGroups: 0 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /info-popover__button/);
  assert.match(html, /aria-label="About this switch"/);
  // Popover only appears after interaction.
  assert.doesNotMatch(html, /info-popover__panel/);
});

test('renders a single on/off switch showing the current mode in the track', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vdom',
      census: { total: 2, vaporSupported: 2, tabGroups: 0 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  // Off: the track's free space reads "VDOM".
  assert.match(html, /go-mode-nav-control__mode[^>]*>VDOM</);
  assert.doesNotMatch(html, />Vapor</);
  assert.match(html, /role="switch"/);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /aria-label="Render examples with Vapor"/);
  assert.match(html, /data-mode="vdom"/);
  assert.match(html, /go-mode-nav-control__track/);
  assert.match(html, /go-mode-nav-control__knob/);
  // One switch + the info button — no segmented pair.
  assert.equal(html.match(/role="switch"/g)?.length, 1);
  assert.equal(html.match(/<button/g)?.length, 2);
});

test('the switch reports on and reads "Vapor" when active', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 2, vaporSupported: 2, tabGroups: 0 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  assert.match(html, /aria-checked="true"/);
  assert.match(html, /data-mode="vapor"/);
  assert.match(html, /go-mode-nav-control__mode[^>]*>Vapor</);
  assert.doesNotMatch(html, />VDOM</);
});

test('coverage count merges into the info chip when some examples fall back', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 3, vaporSupported: 2, tabGroups: 0 },
      locale: 'en',
      onSelect: noop,
    }),
  );

  // One affordance: the "2/3" count rides the ⓘ button, and its popover
  // (aria-label here) explains the number.
  assert.match(html, /go-mode-nav-control__coverage/);
  assert.match(html, /info-popover__count[^>]*>2\/3</);
  assert.match(html, /aria-label="2 of 3 examples on this page run Vapor[^"]*About this switch"/);
});

test('hides the coverage chip when every example runs Vapor', () => {
  const html = renderToStaticMarkup(
    createElement(GoModeNavControl, {
      mode: 'vapor',
      census: { total: 3, vaporSupported: 3, tabGroups: 0 },
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
      census: { total: 3, vaporSupported: 1, tabGroups: 0 },
      locale: 'zh',
      onSelect: noop,
    }),
  );

  assert.match(html, /aria-label="以 Vapor 渲染示例"/);
  assert.match(html, /本页 1\/3 个示例支持 Vapor/);
  assert.match(html, /关于此开关/);
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

  // The badge itself is static; the reason lives behind the ⓘ.
  assert.doesNotMatch(html, /data-interactive/);
  assert.match(html, /vapor-status-group/);
  assert.match(html, /VDOM only/);
  assert.match(html, /Vapor bundle not built/);
  assert.match(html, /aria-label="Why VDOM only\?"/);
});

test('unsupported examples put their reason behind the ⓘ popover', () => {
  for (const requested of ['vapor', 'vdom']) {
    const html = renderToStaticMarkup(
      createElement(VaporStatus, {
        entry: 'transition/main',
        requested,
        mode: 'vdom',
        status: 'unsupported',
        reason: 'transition',
      }),
    );

    assert.match(html, /data-render-mode="vdom"/);
    assert.match(html, /VDOM only/);
    assert.match(html, /vapor-status-group/);
    assert.match(html, /aria-label="Why VDOM only\?"/);
    // Reason reaches assistive tech via the badge label; visually it lives
    // in the popover, not inline.
    assert.match(html, /Uses Transition/);
    assert.doesNotMatch(html, /vapor-status__reason/);
  }
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
  assert.match(html, /aria-label="为什么仅 VDOM？"/);
});
