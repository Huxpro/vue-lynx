/**
 * Scoped CSS tests — verify the cssId pipeline:
 *
 * 1. nodeOps.setScopeId() → composable scope classes
 * 2. Full component render with __scopeId → class ops reach main thread
 *
 * These tests capture the integration points between:
 * - node-ops.ts (setScopeId → resolved class state)
 * - tree-ops.ts (base + scope + transition class composition)
 *
 * Build-time CSS wrapping (@cssId in extracted CSS) is verified by the
 * examples/css-features pipeline build in CI, not here.
 */

import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { OP } from '../../../vue-lynx/internal/src/ops.js';
import { nodeOps } from '../../../vue-lynx/runtime/src/node-ops.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import { ShadowElement } from '../../../vue-lynx/runtime/src/shadow-element.js';
import { resolveClass } from '../../../vue-lynx/runtime/src/tree-ops.js';
import { render } from '../index.js';

// ---------------------------------------------------------------------------
// Low-level: nodeOps.setScopeId → composable class state
// ---------------------------------------------------------------------------

describe('scoped CSS classes (nodeOps)', () => {
  it('adds a scope token to the resolved class', () => {
    const el = new ShadowElement('view', 99);

    nodeOps.setScopeId!(el,'data-v-8f634878');

    const ops = takeOps();
    expect(ops[0]).toBe(OP.SET_CLASS);
    expect(ops[1]).toBe(99); // element id
    expect(ops[2]).toBe('data-v-8f634878');
    expect(el._scopeClasses).toEqual(new Set(['data-v-8f634878']));
  });

  it('composes and deduplicates multiple scope tokens', () => {
    const el = new ShadowElement('view', 10);
    el._baseClass = 'box';

    nodeOps.setScopeId!(el,'data-v-aaa00001');
    nodeOps.setScopeId!(el,'data-v-bbb00002');
    nodeOps.setScopeId!(el,'data-v-aaa00001');

    const ops = takeOps();
    expect(ops).toHaveLength(6);
    expect(el._scopeClasses).toEqual(
      new Set(['data-v-aaa00001', 'data-v-bbb00002']),
    );
    expect(resolveClass(el)).toBe(
      'box data-v-aaa00001 data-v-bbb00002',
    );
  });
});

// ---------------------------------------------------------------------------
// Full pipeline: component with __scopeId → dual-thread render
// ---------------------------------------------------------------------------

describe('scoped CSS classes (full pipeline)', () => {
  it('component with __scopeId renders and applies cssId', () => {
    const Scoped = defineComponent({
      __scopeId: 'data-v-8f634878',
      render() {
        return h('view', { class: 'scoped-box' }, [
          h('text', 'scoped content'),
        ]);
      },
    });

    const { container } = render(Scoped);

    // Element should be rendered through the full pipeline
    const view = container.querySelector('.scoped-box');
    expect(view).not.toBeNull();
    expect(view!.classList).toContain('data-v-8f634878');
  });

  it('child component inside scoped parent renders correctly', () => {
    const Child = defineComponent({
      render() {
        return h('text', 'child text');
      },
    });

    const Parent = defineComponent({
      __scopeId: 'data-v-abcd1234',
      render() {
        return h('view', { class: 'parent' }, [h(Child)]);
      },
    });

    const { container } = render(Parent);
    expect(container.querySelector('.parent')).not.toBeNull();
    expect(container.querySelector('text')).not.toBeNull();
  });

  it('scoped + non-scoped components coexist', () => {
    const Scoped = defineComponent({
      __scopeId: 'data-v-11111111',
      render() {
        return h('view', { class: 'scoped' });
      },
    });

    const Plain = defineComponent({
      render() {
        return h('view', { class: 'plain' });
      },
    });

    const App = defineComponent({
      render() {
        return h('view', [h(Scoped), h(Plain)]);
      },
    });

    const { container } = render(App);
    expect(container.querySelector('.scoped')).not.toBeNull();
    expect(container.querySelector('.plain')).not.toBeNull();
  });
});
