import { beforeEach, describe, expect, it } from 'vitest';

import { OP, type VaporTreeAddressing } from 'vue-lynx/internal/ops';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import {
  addTransitionClass,
  removeTransitionClass,
} from '../../../vue-lynx/runtime/src/transition-shared.js';
import { resolveClass } from '../../../vue-lynx/runtime/src/tree-ops.js';

function proto(): ShadowElement {
  const root = new ShadowElement('view');
  root._inert = true;
  root._addScopeClass('data-v-proto');
  const text = new ShadowElement('text');
  text._inert = true;
  const value = new ShadowElement('#text');
  value._inert = true;
  value._text = 'x';
  text._link(value, null);
  root._link(text, null);
  return root;
}

function clone(
  meta?: VaporTreeAddressing,
): [ShadowElement, ShadowElement, ShadowElement] {
  const source = proto();
  setPendingVaporAddressing(meta);
  const first = source.cloneNode(true);
  setPendingVaporAddressing(meta);
  const second = source.cloneNode(true);
  return [source, first, second];
}

function expectScopeIsolation(
  source: ShadowElement,
  first: ShadowElement,
  second: ShadowElement,
): void {
  expect(first._scopeClasses).toEqual(new Set(['data-v-proto']));
  expect(first._scopeClasses).not.toBe(source._scopeClasses);
  expect(first._scopeClasses).not.toBe(second._scopeClasses);
  first.removeAttribute('data-v-proto');
  expect(first._scopeClasses.size).toBe(0);
  expect(source._scopeClasses).toContain('data-v-proto');
  expect(second._scopeClasses).toContain('data-v-proto');
}

beforeEach(() => {
  resetTemplateState();
  ShadowElement.nextUid = 2;
  takeOps();
});

describe('ShadowElement lazy class state', () => {
  it('copy-on-writes scoped CSS and preserves removal isolation', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');
    const shared = first._scopeClasses;

    first.setAttribute('data-v-first', '');
    first.setAttribute('data-v-first', '');
    expect(first._scopeClasses).not.toBe(shared);
    expect(second._scopeClasses).toBe(shared);
    expect(resolveClass(first)).toBe('data-v-first');
    expect(takeOps().filter((value) => value === OP.SET_CLASS)).toHaveLength(1);

    first.removeAttribute('data-v-first');
    expect(first._scopeClasses.size).toBe(0);
    expect(second._scopeClasses).toBe(shared);
  });

  it('copy-on-writes transition classes and removes from owned state', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');
    const shared = first._transitionClasses;

    removeTransitionClass(first, 'v-enter-from');
    expect(first._transitionClasses).toBe(shared);
    addTransitionClass(first, 'v-enter-from');
    expect(first._transitionClasses).not.toBe(shared);
    expect(second._transitionClasses).toBe(shared);
    expect(resolveClass(first)).toBe('v-enter-from');
    removeTransitionClass(first, 'v-enter-from');
    expect(first._transitionClasses.size).toBe(0);
  });

  it('isolates granular clone scope state', () => {
    const source = proto();
    const first = source._cloneNodeGranular();
    const second = source._cloneNodeGranular();
    expectScopeIsolation(source, first, second);
  });

  it('isolates dense template clone scope state', () => {
    expectScopeIsolation(...clone());
  });

  it('isolates sparse template clone scope state', () => {
    const meta = {
      holes: [1],
      addressed: [0, 1],
      slotCount: 2,
      tags: ['view', 'text'],
    };
    expectScopeIsolation(...clone(meta));
  });
});
