/**
 * Unified-bench row template through the compiled ET pipeline (#325).
 *
 * Regression pin for the #308 wrapper discovery: lowering the bench table
 * page turns the v-for host into an element slot, so rows mount inside a
 * layout-transparent <wrapper> placeholder. The runtime path is correct —
 * the unified harness's DOM queries must descend through wrappers (see
 * benchmark/harness/cross.mjs rowEls). This test keeps the compiled bench
 * row rendering working in both lowered and unlowered forms.
 */
import { describe, it, expect } from 'vitest';
import { compile } from '@vue/compiler-dom';
import { shallowRef, triggerRef, nextTick } from 'vue-lynx';
import * as VueLynx from 'vue-lynx';
import type { Component } from 'vue-lynx';
import { elementTemplateTransform } from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';
import { render } from '../index.js';

const TEMPLATE = `
  <view class="page">
    <view class="rows">
      <view v-for="row of rows" :key="row.id" class="row"
        :class="selected === row.id ? 'danger' : ''">
        <text class="col-id">{{ row.id }}</text>
        <text class="col-label" @tap="select(row.id)">{{ row.label.value }}</text>
        <text class="col-remove" @tap="remove(row.id)">x</text>
      </view>
    </view>
  </view>`;

function compileToComponent(template: string, state: Record<string, unknown>, lowered: boolean): Component {
  const { code } = compile(template, {
    mode: 'module', hoistStatic: true, cacheHandlers: true,
    whitespace: 'condense', isNativeTag: () => true,
    nodeTransforms: lowered ? [elementTemplateTransform] : [],
  });
  const body = code
    .replace(/import\s*\{([^}]*)\}\s*from\s*"vue"/, (_, n: string) => `const {${n.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export function render', 'return function render');
  const renderFn = new Function('Vue', body)(VueLynx);
  return { setup: () => state, render: renderFn } as Component;
}

describe('bench row create repro', () => {
  for (const lowered of [false, true]) {
    it(`renders 5 rows after rows.value set (lowered=${lowered})`, async () => {
      const rows = shallowRef<any[]>([]);
      const state = {
        rows,
        selected: shallowRef(undefined),
        select: () => {},
        remove: () => {},
      };
      const comp = compileToComponent(TEMPLATE, state, lowered);
      const { container } = render(comp);
      rows.value = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, label: { value: `l${i}` } }));
      triggerRef(rows);
      await nextTick();
      const rowEls = container.querySelectorAll('.row');
      expect(rowEls.length).toBe(5);
      expect(container.querySelectorAll('.col-label')[0]?.textContent).toBe('l0');
    });
  }
});
