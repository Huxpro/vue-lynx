/**
 * Compiler-lowered ListDataSource → legacy Element PAPI integration.
 */

import { compile } from '@vue/compiler-dom';
import { describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue-lynx';
import * as VueLynx from 'vue-lynx';
import type { Component } from 'vue-lynx';
import { listItemTemplateTransform } from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';
import { getListTemplateMetricsForTest } from '../../../vue-lynx/main-thread/src/list-data-source.js';
import { render } from '../index.js';
import { fireEvent } from '../fire-event.js';

function env() {
  return (globalThis as any).lynxTestingEnv;
}

function elementTree() {
  return (globalThis as any).elementTree;
}

function compileList(
  template: string,
  state: Record<string, unknown>,
): { component: Component; code: string } {
  const { code } = compile(template, {
    mode: 'module',
    hoistStatic: false,
    cacheHandlers: false,
    whitespace: 'condense',
    isNativeTag: () => true,
    nodeTransforms: [listItemTemplateTransform],
  });
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

describe('compiler-backed ListDataSource', () => {
  it('keeps 10k logical rows lazy and bounds native cells to the requested window', () => {
    const rows = reactive(
      Array.from({ length: 10_000 }, (_, index) => ({
        id: `row-${index}`,
        label: `Row ${index}`,
      })),
    );
    const { component, code } = compileList(
      `<list>
        <list-item
          v-for="row in rows"
          :key="row.id"
          :item-key="row.id"
          class="row"
        ><text class="label">{{ row.label }}</text></list-item>
      </list>`,
      { rows },
    );
    expect(code).toContain('__vlx-list-tpl:');

    const { container } = render(component);
    const list = container.querySelector('list') as any;
    expect(getListTemplateMetricsForTest()).toEqual({
      logicalItems: 10_000,
      materializedItems: 0,
      createdCells: 0,
      hydrationCount: 0,
    });

    env().switchToMainThread();
    const firstWindow = Array.from(
      { length: 24 },
      (_, index) => elementTree().enterListItemAtIndex(list, index),
    );
    expect(new Set(firstWindow).size).toBe(24);
    expect(getListTemplateMetricsForTest().createdCells).toBe(24);
    for (const sign of firstWindow) elementTree().leaveListItem(list, sign);

    const secondWindow = Array.from(
      { length: 24 },
      (_, offset) => elementTree().enterListItemAtIndex(list, 9_976 + offset),
    );
    expect(new Set(secondWindow)).toEqual(new Set(firstWindow));
    expect(getListTemplateMetricsForTest()).toEqual({
      logicalItems: 10_000,
      materializedItems: 24,
      createdCells: 24,
      hydrationCount: 48,
    });
    expect(list.textContent).toContain('Row 9999');
  });

  it('hydrates reactive values into an active recycled cell', async () => {
    const rows = reactive([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]);
    const { component } = compileList(
      `<list>
        <list-item v-for="row in rows" :key="row.id" :item-key="row.id">
          <text class="label">{{ row.label }}</text>
        </list-item>
      </list>`,
      { rows },
    );
    const { container } = render(component);
    env().switchToMainThread();
    const list = container.querySelector('list') as any;
    const signA = elementTree().enterListItemAtIndex(list, 0);
    elementTree().leaveListItem(list, signA);
    const signB = elementTree().enterListItemAtIndex(list, 1);
    expect(signB).toBe(signA);
    expect(list.textContent).toContain('B');

    env().switchToBackgroundThread();
    rows[1]!.label = 'B updated';
    await nextTick();
    await nextTick();
    env().switchToMainThread();
    expect(list.textContent).toContain('B updated');
  });

  it('never recycles across compiler-distinct structures', () => {
    const { component } = compileList(
      `<list>
        <list-item item-key="a" reuse-identifier="row">
          <text>A</text>
        </list-item>
        <list-item item-key="b" reuse-identifier="row">
          <text>B</text><text>EXTRA</text>
        </list-item>
      </list>`,
      {},
    );
    const { container } = render(component);
    env().switchToMainThread();
    const list = container.querySelector('list') as any;
    const signA = elementTree().enterListItemAtIndex(list, 0);
    elementTree().leaveListItem(list, signA);
    const signB = elementTree().enterListItemAtIndex(list, 1);
    expect(signB).not.toBe(signA);
    expect(list.textContent).toContain('EXTRA');
    expect(getListTemplateMetricsForTest().createdCells).toBe(2);
  });

  it('preserves keyed reorder, prepend, and removal through the legacy transaction shim', async () => {
    const rows = reactive([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]);
    const { component } = compileList(
      `<list>
        <list-item v-for="row in rows" :key="row.id" :item-key="row.id">
          <text>{{ row.label }}</text>
        </list-item>
      </list>`,
      { rows },
    );
    const { container } = render(component);
    env().switchToMainThread();
    const list = container.querySelector('list') as any;
    const firstSign = elementTree().enterListItemAtIndex(list, 0);
    elementTree().leaveListItem(list, firstSign);

    env().switchToBackgroundThread();
    rows.reverse();
    rows.unshift({ id: 'x', label: 'X' });
    rows.splice(2, 1); // X, C, A
    await nextTick();
    await nextTick();

    env().switchToMainThread();
    const nextSign = elementTree().enterListItemAtIndex(list, 0);
    expect(nextSign).toBe(firstSign);
    expect(list.textContent).toContain('X');
  });

  it('returns a removed active row lease to the structural pool', async () => {
    const rows = reactive([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]);
    const { component } = compileList(
      `<list>
        <list-item v-for="row in rows" :key="row.id" :item-key="row.id">
          <text>{{ row.label }}</text>
        </list-item>
      </list>`,
      { rows },
    );
    const { container } = render(component);
    env().switchToMainThread();
    const list = container.querySelector('list') as any;
    const removedSign = elementTree().enterListItemAtIndex(list, 1);

    env().switchToBackgroundThread();
    rows.splice(1, 1);
    await nextTick();
    await nextTick();

    env().switchToMainThread();
    // Native returns the lease after applying the removal transaction.
    elementTree().leaveListItem(list, removedSign);
    expect(elementTree().enterListItemAtIndex(list, 1)).toBe(removedSign);
    expect(list.textContent).toContain('C');
    expect(getListTemplateMetricsForTest().logicalItems).toBe(2);
  });

  it('rebinds event holes when a physical cell changes logical owner', async () => {
    const rows = reactive([
      { id: 'a', label: 'A', taps: 0 },
      { id: 'b', label: 'B', taps: 0 },
    ]);
    const onTap = (row: { taps: number }) => row.taps++;
    const { component } = compileList(
      `<list>
        <list-item v-for="row in rows" :key="row.id" :item-key="row.id">
          <view class="button" @tap="onTap(row)"><text>{{ row.label }}</text></view>
        </list-item>
      </list>`,
      { rows, onTap },
    );
    const { container } = render(component);
    env().switchToMainThread();
    const list = container.querySelector('list') as any;
    const signA = elementTree().enterListItemAtIndex(list, 0);
    elementTree().leaveListItem(list, signA);
    expect(elementTree().enterListItemAtIndex(list, 1)).toBe(signA);

    fireEvent.tap(list.querySelector('.button'));
    await nextTick();
    expect(rows[0]!.taps).toBe(0);
    expect(rows[1]!.taps).toBe(1);
  });
});
