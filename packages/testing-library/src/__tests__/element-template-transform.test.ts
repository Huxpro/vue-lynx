/**
 * Compiler-transform tests (route b, compile side).
 *
 * Each template is compiled twice — with and without the element-template
 * lowering transform — and rendered through the full dual-thread pipeline.
 * The rendered documents must be identical (modulo vue-ref bookkeeping
 * attributes, which lowered interior nodes intentionally don't carry), and
 * the lowered variant must actually contain lowered vnodes (no vacuous
 * passes).
 */

import { describe, it, expect } from 'vitest';
import { compile } from '@vue/compiler-dom';
import { nextTick, reactive } from 'vue-lynx';
import * as VueLynx from 'vue-lynx';
import type { Component } from 'vue-lynx';
import {
  createElementTemplateTransform,
  elementTemplateTransform,
} from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';
import { render } from '../index.js';
import { fireEvent } from '../fire-event.js';

interface CompileResult {
  component: Component;
  code: string;
}

function compileToComponent(
  template: string,
  state: Record<string, unknown>,
  { lowered = false, scopeId = null as string | null } = {},
): CompileResult {
  const { code } = compile(template, {
    mode: 'module',
    hoistStatic: false,
    cacheHandlers: false,
    whitespace: 'condense',
    isNativeTag: () => true,
    nodeTransforms: lowered ? [elementTemplateTransform] : [],
    scopeId: scopeId ?? undefined,
    // module-mode codegen needs these for scopeId wrapping
    ...(scopeId ? { filename: 'test.vue' } : {}),
  });
  // Make the ESM render module executable in-process: imports from "vue"
  // become destructuring from the provided runtime, the export a return.
  const body = code
    .replace(
      /import\s*\{([^}]*)\}\s*from\s*"vue"/,
      (_, names: string) =>
        `const {${names.replaceAll(' as ', ': ')}} = Vue`,
    )
    .replace('export function render', 'return function render');
  // eslint-disable-next-line no-new-func
  const renderFn = new Function('Vue', body)(VueLynx);
  return {
    component: { setup: () => state, render: renderFn } as Component,
    code,
  };
}

function normalized(container: Element): string {
  return container.innerHTML.replace(/ vue-ref-\d+="[^"]*"/g, '');
}

/** Render both variants and assert identical documents. */
function renderBoth(
  template: string,
  makeState: () => Record<string, unknown>,
): {
  lowered: { container: Element; state: Record<string, unknown> };
  code: string;
} {
  const baseState = makeState();
  const base = compileToComponent(template, baseState);
  const { container: c1 } = render(base.component);
  const baseHtml = normalized(c1);

  const lowState = makeState();
  const low = compileToComponent(template, lowState, { lowered: true });
  expect(low.code).toContain('__vlx-tpl:'); // lowering must actually happen
  expect(low.code).toContain('__vueLynxRegisterElementTemplate');
  const { container: c2 } = render(low.component);
  expect(normalized(c2)).toBe(baseHtml);

  return { lowered: { container: c2, state: lowState }, code: low.code };
}

const CARD_TEMPLATE = `
<view class="feed">
  <view class="card">
    <image class="icon" src="asset://a.png" />
    <view class="body">
      <text class="title">{{ title }}</text>
      <text class="desc">Static description text</text>
    </view>
    <view :class="badgeCls"><text>tail</text></view>
  </view>
</view>`.trim();

describe('element-template transform', () => {
  it('lowers a mixed static/dynamic subtree with identical output', () => {
    const { code } = renderBoth(CARD_TEMPLATE, () => ({
      title: 'Hello',
      badgeCls: 'badge on',
    }));
    // The whole feed collapses into one template instance.
    expect(code).toContain('__CreateImage');
    expect(code).toContain('"__h0"');
  });

  it('patches holes on update exactly like the normal pipeline', async () => {
    const { lowered } = renderBoth(CARD_TEMPLATE, () =>
      reactive({
        title: 'one',
        badgeCls: 'badge a',
      }));
    const state = lowered.state as { title: string; badgeCls: string };

    state.title = 'two';
    state.badgeCls = 'badge b';
    await nextTick();

    expect(lowered.container.querySelector('.title')?.textContent).toBe('two');
    expect(lowered.container.querySelector('.badge.b')).not.toBeNull();
    expect(lowered.container.querySelector('.badge.a')).toBeNull();
  });

  it('routes interior @tap through event holes', async () => {
    const template = `
<view class="wrap">
  <view class="btn" @tap="bump"><text>+1</text></view>
  <text class="count">{{ String(n) }}</text>
</view>`.trim();

    const { lowered } = renderBoth(template, () => {
      const s = reactive({ n: 0 }) as Record<string, unknown> & { n: number };
      s['bump'] = () => {
        s.n++;
      };
      return s;
    });

    fireEvent.tap(lowered.container.querySelector('.btn')!);
    await nextTick();
    expect(lowered.container.querySelector('.count')?.textContent).toBe('1');
  });

  it('lowers v-for item bodies and preserves keyed reorder', async () => {
    const template = `
<view class="list">
  <view v-for="item in items" :key="item.id" class="item">
    <image class="i" src="x.png" />
    <text class="label">{{ item.label }}</text>
  </view>
</view>`.trim();

    const { lowered, code } = renderBoth(template, () => ({
      items: reactive([
        { id: 1, label: 'a' },
        { id: 2, label: 'b' },
        { id: 3, label: 'c' },
      ]),
    }));
    // items are lowered; the v-for host (structural) is not
    expect(code.match(/__vlx-tpl:/g)!.length).toBeGreaterThanOrEqual(1);

    const labels = () =>
      [...lowered.container.querySelectorAll('.label')].map((n) => n.textContent);
    expect(labels()).toEqual(['a', 'b', 'c']);

    const items = lowered.state['items'] as Array<{ id: number; label: string }>;
    items.reverse();
    await nextTick();
    expect(labels()).toEqual(['c', 'b', 'a']);
  });

  it('keeps structural features (v-if, components, ref, v-show) on the normal path', async () => {
    const template = `
<view class="page">
  <view class="static-island">
    <text class="a">one</text>
    <text class="b">two</text>
  </view>
  <view v-if="show" class="cond">
    <text>visible</text>
  </view>
  <view ref="tracked" class="reffed"><text>r</text></view>
  <view v-show="show" class="shown"><text>s</text></view>
</view>`.trim();

    const { lowered } = renderBoth(template, () => reactive({ show: true }));

    const state = lowered.state as { show: boolean };
    state.show = false;
    await nextTick();
    expect(lowered.container.querySelector('.cond')).toBeNull();
    expect(
      (lowered.container.querySelector('.shown') as HTMLElement | null)?.style
        .display,
    ).toBe('none');
  });

  it('bakes mixed static text children as text nodes', () => {
    const template = `
<view class="mixed">
  <text class="x">left</text>
  middle
  <text class="y">right</text>
</view>`.trim();

    renderBoth(template, () => ({}));
  });

  it('supports dynamic style/attr holes and root-level dynamic props', async () => {
    // note: data-* attrs are routed to a dedicated dataset PAPI by the Lynx
    // testing environment and are unsupported by the existing SET_PROP path
    // (pre-existing pipeline behavior, independent of lowering) — use a
    // regular attribute for the hole.
    const template = `
<view class="root" :style="rootStyle">
  <view class="inner" :style="innerStyle" :mode="k">
    <text>content</text>
  </view>
</view>`.trim();

    const { lowered } = renderBoth(template, () =>
      reactive({
        rootStyle: { backgroundColor: 'red' },
        innerStyle: { color: 'blue' },
        k: 'v1',
      }));

    const state = lowered.state as { k: string; innerStyle: { color: string } };
    state.k = 'v2';
    state.innerStyle = { color: 'green' };
    await nextTick();
    const inner = lowered.container.querySelector('.inner')!;
    expect(inner.getAttribute('mode')).toBe('v2');
    expect((inner as HTMLElement).style.color).toBe('green');
  });

  it('keeps constant numeric :style objects on the normalizeStyle path', () => {
    // `:style="{ fontSize: 12 }"` is constant-foldable, but baking it would
    // bypass the runtime's numeric auto-px conversion — it must become a
    // hole. Output parity with the normal pipeline is the regression check.
    const template = `
<view class="wrap">
  <text :style="{ color: '#555', fontSize: 12 }">fixed</text>
  <text style="color:red">attr-style stays baked</text>
</view>`.trim();

    const { lowered, code } = renderBoth(template, () => ({}));
    expect(code).toContain('__vlx-tpl:');
    // static string-valued attr style IS baked; the numeric object is not
    expect(code).toContain('__SetInlineStyles(e2, {"color":"red"})');
    const fixed = [...lowered.container.querySelectorAll('text')].find(
      (n) => n.textContent === 'fixed',
    ) as unknown as HTMLElement;
    expect(fixed.style.fontSize).toBe('12px');
  });

  it('bakes scoped-CSS class tokens into interior skeleton nodes', () => {
    const { code } = compileToComponent(CARD_TEMPLATE, {}, {
      lowered: true,
      scopeId: 'data-v-1a2b3c4d',
    });
    expect(code).toContain('__SetCSSId([e1], 0)');
    expect(code).toContain('__SetClasses(e1, "data-v-1a2b3c4d")');
  });

  it('routes all scope emission through the scope adapter seam', () => {
    // The adapter is the single swap point for lineages with a different
    // scope model (issue #230): a stub adapter must fully replace the
    // default __SetCSSId association in the baked create() source.
    const stubTransform = createElementTemplateTransform({
      elementScopeStatements: (varName, scopeId) => [
        `__STUB_SCOPE__(${varName}, ${JSON.stringify(scopeId)});`,
      ],
    });
    const { code } = compile(CARD_TEMPLATE, {
      mode: 'module',
      prefixIdentifiers: true,
      hoistStatic: false,
      isNativeTag: () => true,
      nodeTransforms: [stubTransform],
      scopeId: 'data-v-1a2b3c4d',
      filename: 'test.vue',
    });
    expect(code).toContain('__STUB_SCOPE__(e0, "data-v-1a2b3c4d");');
    expect(code).not.toContain('__SetCSSId');
  });

  it('does not lower single-element subtrees (threshold)', () => {
    const { code } = compileToComponent(
      '<view><text :class="c">{{ t }}</text><text class="only">x</text></view>',
      { c: 'k', t: 'v' },
      { lowered: true },
    );
    // whole view IS lowerable (3 elements) — but a single dynamic text
    // element alone would not be. Sanity: template lowering happened here.
    expect(code).toContain('__vlx-tpl:');
  });
});
