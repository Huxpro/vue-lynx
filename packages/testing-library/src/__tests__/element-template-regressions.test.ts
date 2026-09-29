/**
 * Element-template regressions (full BG → ops → MT pipeline).
 *
 * Each case compiles a real template with the lowering transform and
 * exercises a path where lowered output used to diverge from the normal
 * vdom path:
 *  - element-slot content after a KeepAlive move (REMOVE + INSERT)
 *  - scoped-CSS class tokens on lowered interior elements
 *  - main-thread element-registry release for template instances
 */

import { describe, it, expect } from 'vitest';
import { compile } from '@vue/compiler-dom';
import { KeepAlive, defineComponent, h, nextTick, ref } from 'vue-lynx';
import * as VueLynx from 'vue-lynx';
import type { Component } from 'vue-lynx';
import { elementTemplateTransform } from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';
import { render } from '../index.js';

function compileToComponent(
  template: string,
  state: Record<string, unknown>,
  { lowered = true, scopeId = null as string | null } = {},
): { component: Component; code: string } {
  const { code } = compile(template, {
    mode: 'module',
    hoistStatic: false,
    cacheHandlers: false,
    whitespace: 'condense',
    isNativeTag: () => true,
    nodeTransforms: lowered ? [elementTemplateTransform] : [],
    scopeId: scopeId ?? undefined,
    ...(scopeId ? { filename: 'test.vue' } : {}),
  });
  const body = code
    .replace(
      /import\s*\{([^}]*)\}\s*from\s*"vue"/,
      (_, names: string) => `const {${names.replaceAll(' as ', ': ')}} = Vue`,
    )
    .replace('export function render', 'return function render');
  // eslint-disable-next-line no-new-func
  const renderFn = new Function('Vue', body)(VueLynx);
  const component = { setup: () => state, render: renderFn } as Component;
  if (scopeId) (component as { __scopeId?: string }).__scopeId = scopeId;
  return { component, code };
}

/** Strip vue-ref bookkeeping attrs (lowered interiors don't carry them). */
function normalized(container: Element): string {
  return container.innerHTML.replace(/ vue-ref-\d+="[^"]*"/g, '');
}

describe('element templates: KeepAlive moves', () => {
  it('keeps element-slot bindings when a cached template root is moved', async () => {
    const show = ref(false);
    const inner = compileToComponent(
      '<view class="card"><text>head</text><view v-if="show"><text>SHOWN</text></view></view>',
      { show },
    );
    expect(inner.code).toContain('__vlx-tpl:');
    const Other = defineComponent({ render: () => h('text', null, 'other') });
    const which = ref<'a' | 'b'>('a');
    const Root = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, [
          which.value === 'a' ? h(inner.component) : h(Other),
        ]),
    });

    const { container } = render(Root);
    show.value = true;
    await nextTick();
    expect(container.textContent).toBe('headSHOWN');

    show.value = false;
    await nextTick();
    which.value = 'b'; // deactivate: template root moves into KeepAlive storage
    await nextTick();
    which.value = 'a'; // activate: moved back
    await nextTick();
    show.value = true; // slot insert must still resolve its wrapper parent
    await nextTick();
    expect(container.textContent).toBe('headSHOWN');
  });
});

describe('element templates: scoped CSS', () => {
  const SCOPE = 'data-v-1a2b3c4d';
  const TEMPLATE = `
<view class="card">
  <text class="title">Title</text>
  <view :class="badge"><text>tail</text></view>
  <text>plain</text>
</view>`.trim();

  it('keeps the scope token on interior elements with static and dynamic classes', async () => {
    const baseBadge = ref('badge a');
    const base = compileToComponent(TEMPLATE, { badge: baseBadge }, {
      lowered: false,
      scopeId: SCOPE,
    });
    const { container: c1 } = render(base.component);
    const baseHtml = normalized(c1);

    const badge = ref('badge a');
    const low = compileToComponent(TEMPLATE, { badge }, { scopeId: SCOPE });
    expect(low.code).toContain('__vlx-tpl:');
    const { container } = render(low.component);

    // Lowered output must match the normal path exactly.
    expect(normalized(container)).toBe(baseHtml);
    expect(container.querySelector(`.title.${SCOPE}`)).not.toBeNull();
    expect(container.querySelector(`.badge.a.${SCOPE}`)).not.toBeNull();

    badge.value = 'badge b';
    await nextTick();
    expect(container.querySelector(`.badge.b.${SCOPE}`)).not.toBeNull();
    expect(container.querySelector('.badge.a')).toBeNull();

    badge.value = '';
    await nextTick();
    const tail = [...container.querySelectorAll('text')].find(
      (n) => n.textContent === 'tail',
    )!;
    expect(tail.parentElement!.getAttribute('class')).toBe(SCOPE);
  });
});
