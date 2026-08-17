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
  it('does not allocate class Sets for untouched elements or read hot paths', () => {
    const NativeSet = globalThis.Set;
    let allocations = 0;
    let untouchedAllocations = -1;
    let afterScopeAccess = -1;
    let afterRepeatedScopeAccess = -1;
    let afterTransitionAccess = -1;
    let resolvedClasses: string[] = [];
    let missingScopeResults: boolean[] = [];
    let missingTransitionResults: boolean[] = [];

    globalThis.Set = new Proxy(NativeSet, {
      construct(target, args) {
        allocations++;
        return Reflect.construct(target, args, target);
      },
    });

    try {
      const elements = Array.from(
        { length: 64 },
        () => new ShadowElement('view'),
      );
      resolvedClasses = elements.map((element) => resolveClass(element));
      missingScopeResults = elements.map((element) =>
        element._removeScopeClass('data-v-missing')
      );
      missingTransitionResults = elements.map((element) =>
        element._removeTransitionClass('v-missing')
      );
      untouchedAllocations = allocations;

      const scopeClasses = elements[0]!._scopeClasses;
      afterScopeAccess = allocations;
      void elements[0]!._scopeClasses;
      afterRepeatedScopeAccess = allocations;
      void elements[0]!._transitionClasses;
      afterTransitionAccess = allocations;
      expect(scopeClasses).toBeInstanceOf(NativeSet);
    } finally {
      globalThis.Set = NativeSet;
    }

    expect(resolvedClasses.every((value) => value === '')).toBe(true);
    expect(missingScopeResults.every((value) => value === false)).toBe(true);
    expect(missingTransitionResults.every((value) => value === false)).toBe(
      true,
    );
    expect(untouchedAllocations).toBe(0);
    expect(afterScopeAccess).toBe(1);
    expect(afterRepeatedScopeAccess).toBe(1);
    expect(afterTransitionAccess).toBe(2);
  });

  it('isolates direct scope Set poisoning and repeated mutation', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');
    const firstScopeClasses = first._scopeClasses;
    let secondScopeClasses: Set<string> | undefined;

    try {
      firstScopeClasses.add('data-v-direct');
      firstScopeClasses.add('data-v-direct');
      expect(resolveClass(first)).toBe('data-v-direct');
      expect(resolveClass(second)).toBe('');

      second.setAttribute('data-v-direct', '');
      secondScopeClasses = second._scopeClasses;
      expect(secondScopeClasses).not.toBe(firstScopeClasses);
      expect(resolveClass(second)).toBe('data-v-direct');
      expect(takeOps().filter((value) => value === OP.SET_CLASS)).toHaveLength(1);

      secondScopeClasses.add('data-v-second');
      expect(resolveClass(second)).toBe('data-v-direct data-v-second');

      expect(firstScopeClasses.delete('data-v-direct')).toBe(true);
      expect(firstScopeClasses.delete('data-v-direct')).toBe(false);
      firstScopeClasses.add('data-v-next');
      expect(resolveClass(first)).toBe('data-v-next');
      expect(resolveClass(second)).toBe('data-v-direct data-v-second');
      expect(resolveClass(new ShadowElement('view'))).toBe('');
    } finally {
      firstScopeClasses.clear();
      secondScopeClasses?.clear();
    }
  });

  it('isolates direct transition Set poisoning and repeated mutation', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');
    const firstTransitionClasses = first._transitionClasses;
    let secondTransitionClasses: Set<string> | undefined;

    try {
      firstTransitionClasses.add('v-enter-from');
      firstTransitionClasses.add('v-enter-from');
      expect(resolveClass(first)).toBe('v-enter-from');
      expect(resolveClass(second)).toBe('');

      addTransitionClass(second, 'v-enter-from');
      secondTransitionClasses = second._transitionClasses;
      expect(secondTransitionClasses).not.toBe(firstTransitionClasses);
      expect(resolveClass(second)).toBe('v-enter-from');

      secondTransitionClasses.add('v-second');
      removeTransitionClass(first, 'v-enter-from');
      expect(resolveClass(first)).toBe('');
      expect(resolveClass(second)).toBe('v-enter-from v-second');

      addTransitionClass(first, 'v-enter-active');
      removeTransitionClass(first, 'v-enter-active');
      addTransitionClass(first, 'v-enter-to');
      expect(resolveClass(first)).toBe('v-enter-to');
      expect(resolveClass(second)).toBe('v-enter-from v-second');
      expect(resolveClass(new ShadowElement('view'))).toBe('');
    } finally {
      firstTransitionClasses.clear();
      secondTransitionClasses?.clear();
    }
  });

  it('resolves base, scope, and transition classes in stable order', () => {
    const element = new ShadowElement('view');
    element._baseClass = 'base primary';
    element._scopeClasses.add('data-v-parent');
    element._scopeClasses.add('data-v-child');
    element._transitionClasses.add('v-enter-active');

    expect(resolveClass(element)).toBe(
      'base primary data-v-parent data-v-child v-enter-active',
    );

    element._scopeClasses.delete('data-v-parent');
    element._scopeClasses.add('data-v-parent');
    element._transitionClasses.delete('v-enter-active');
    element._transitionClasses.add('v-enter-to');

    expect(resolveClass(element)).toBe(
      'base primary data-v-child data-v-parent v-enter-to',
    );
  });

  it('lazily owns scope and transition state on internal mutation', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');

    first.setAttribute('data-v-first', '');
    first.setAttribute('data-v-first', '');
    addTransitionClass(first, 'v-enter-from');
    expect(takeOps().filter((value) => value === OP.SET_CLASS)).toHaveLength(2);
    expect(first._scopeClasses).not.toBe(second._scopeClasses);
    expect(first._transitionClasses).not.toBe(second._transitionClasses);
    expect(resolveClass(first)).toBe('data-v-first v-enter-from');
    expect(resolveClass(second)).toBe('');

    first.removeAttribute('data-v-first');
    removeTransitionClass(first, 'v-enter-from');
    expect(resolveClass(first)).toBe('');
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
