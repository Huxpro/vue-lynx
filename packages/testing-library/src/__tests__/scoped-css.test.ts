/**
 * Scoped CSS tests — verify the cssId pipeline:
 *
 * 1. nodeOps.setScopeId() → SET_SCOPE_ID op with correct numeric cssId
 * 2. Full component render with __scopeId → ops reach main thread
 *
 * These tests capture the integration points between:
 * - scope-bridge.ts (scopeIdToCssId conversion)
 * - node-ops.ts (setScopeId → pushOp)
 * - ops-apply.ts (SET_SCOPE_ID → __SetCSSId)
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
import { scopeIdToCssId } from '../../../vue-lynx/runtime/src/scope-bridge.js';
import { render } from '../index.js';

// ---------------------------------------------------------------------------
// Low-level: nodeOps.setScopeId → ops buffer
// ---------------------------------------------------------------------------

describe('SET_SCOPE_ID (nodeOps)', () => {
  it('pushes SET_SCOPE_ID op with numeric cssId', () => {
    const el = new ShadowElement('view', 99);

    nodeOps.setScopeId!(el,'data-v-8f634878');

    const ops = takeOps();
    expect(ops[0]).toBe(OP.SET_SCOPE_ID);
    expect(ops[1]).toBe(99); // element id
    // 0x8f634878 & 0x7fffffff = 258164856
    expect(ops[2]).toBe(258164856);
  });

  it('cssId conversion matches between scope-bridge and plugin formula', () => {
    // The build-time plugin uses the same formula:
    //   Number.parseInt(hash, 16) & 0x7fffffff
    // This test ensures the runtime conversion stays in sync.
    const cases = [
      ['data-v-8f634878', Number.parseInt('8f634878', 16) & 0x7fffffff],
      ['data-v-00000001', 1],
      ['data-v-7fffffff', 0x7fffffff],
      // High bit set — mask must clamp to positive int32
      ['data-v-ffffffff', Number.parseInt('ffffffff', 16) & 0x7fffffff],
    ] as const;

    for (const [scopeId, expected] of cases) {
      expect(scopeIdToCssId(scopeId)).toBe(expected);
    }
  });

  it('multiple setScopeId calls produce separate ops', () => {
    const el = new ShadowElement('view', 10);

    // Vue calls setScopeId once per scope on the element
    // (own scope, then parent scope for root elements)
    nodeOps.setScopeId!(el,'data-v-aaa00001');
    nodeOps.setScopeId!(el,'data-v-bbb00002');

    const ops = takeOps();
    // Two SET_SCOPE_ID ops, each with 3 values
    expect(ops).toHaveLength(6);
    expect(ops[0]).toBe(OP.SET_SCOPE_ID);
    expect(ops[3]).toBe(OP.SET_SCOPE_ID);
    // Same element, different cssIds
    expect(ops[1]).toBe(10);
    expect(ops[4]).toBe(10);
    expect(ops[2]).not.toBe(ops[5]);
  });
});

// ---------------------------------------------------------------------------
// Full pipeline: component with __scopeId → dual-thread render
// ---------------------------------------------------------------------------

describe('SET_SCOPE_ID (full pipeline)', () => {
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
    // The SET_SCOPE_ID op was flushed to main thread during render.
    // If __SetCSSId threw, the render would have failed.
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
