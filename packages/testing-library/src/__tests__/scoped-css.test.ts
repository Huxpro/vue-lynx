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
import {
  h,
  defineComponent,
  nextTick,
  registerElementTemplate,
} from 'vue-lynx';
import { OP } from '../../../vue-lynx/internal/src/ops.js';
import { applyScopeId, nodeOps } from '../../../vue-lynx/runtime/src/node-ops.js';
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

  it('keeps the first scope when Vue applies several to one element', () => {
    const el = new ShadowElement('view', 10);

    // Vue calls setScopeId once per scope on the element: its own scope
    // first, then the scope of every ancestor component whose subtree root
    // it is. Lynx elements carry exactly one cssId, so only the first (the
    // owning component's) survives — otherwise the component's own scoped
    // rules stop matching its root element (issue #317).
    nodeOps.setScopeId!(el, 'data-v-aaa00001');
    nodeOps.setScopeId!(el, 'data-v-bbb00002');

    const ops = takeOps();
    expect(ops).toEqual([
      OP.SET_SCOPE_ID,
      10,
      scopeIdToCssId('data-v-aaa00001'),
    ]);
  });

  it('applyScopeId overrides an existing association', () => {
    const el = new ShadowElement('view', 11);

    nodeOps.setScopeId!(el, 'data-v-aaa00001');
    // The page root is claimed and released by <page> wrappers, so it must
    // stay re-scopable (see Page.ts).
    applyScopeId(el, 'data-v-bbb00002');
    applyScopeId(el, '');

    const ops = takeOps();
    expect(ops).toEqual([
      OP.SET_SCOPE_ID, 11, scopeIdToCssId('data-v-aaa00001'),
      OP.SET_SCOPE_ID, 11, scopeIdToCssId('data-v-bbb00002'),
      OP.SET_SCOPE_ID, 11, 0,
    ]);
  });

  it('applyScopeId skips a redundant re-application', () => {
    const el = new ShadowElement('view', 12);

    applyScopeId(el, 'data-v-aaa00001');
    applyScopeId(el, 'data-v-aaa00001');

    expect(takeOps()).toHaveLength(3);
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

// ---------------------------------------------------------------------------
// Regression: a component root must stay in its OWN CSS fragment (#317)
//
// The testing environment records the last `__SetCSSId` on the element as
// `cssId = "<entry>:<n>"`, which is exactly what Lynx's CSS engine matches
// scoped rules against.
// ---------------------------------------------------------------------------

/** cssId string the testing environment records for a Vue scope id. */
function cardCssId(scopeId: string): string {
  return `__Card__:${scopeIdToCssId(scopeId)}`;
}

const CHILD_SCOPE = 'data-v-11111111';
const PARENT_SCOPE = 'data-v-22222222';

describe('component root scope (#317)', () => {
  it('keeps the child scope on a scoped child root inside a scoped parent', () => {
    const Child = defineComponent({
      __scopeId: CHILD_SCOPE,
      render() {
        return h('view', { class: 'toast' }, [h('text', 'Toast')]);
      },
    });

    const Parent = defineComponent({
      __scopeId: PARENT_SCOPE,
      render() {
        return h('view', { class: 'parent' }, [h(Child)]);
      },
    });

    const { container } = render(Parent);
    // Static class still reaches the element…
    const toast = container.querySelector('.toast') as { cssId?: string };
    expect(toast).not.toBeNull();
    // …and the element stays in the child's fragment, so the child's own
    // `<style scoped>` rules for `.toast` still match it.
    expect(toast.cssId).toBe(cardCssId(CHILD_SCOPE));
    expect(
      (container.querySelector('.parent') as { cssId?: string }).cssId,
    ).toBe(cardCssId(PARENT_SCOPE));
  });

  it('scopes a nested component root to its own component, not its user', () => {
    const GRANDCHILD_SCOPE = 'data-v-33333333';

    const GrandChild = defineComponent({
      __scopeId: GRANDCHILD_SCOPE,
      render() {
        return h('view', { class: 'leaf' });
      },
    });

    const Child = defineComponent({
      __scopeId: CHILD_SCOPE,
      render() {
        return h(GrandChild);
      },
    });

    const Parent = defineComponent({
      __scopeId: PARENT_SCOPE,
      render() {
        return h('view', { class: 'parent' }, [h(Child)]);
      },
    });

    const { container } = render(Parent);
    expect((container.querySelector('.leaf') as { cssId?: string }).cssId)
      .toBe(cardCssId(GRANDCHILD_SCOPE));
  });

  it('keeps slot content in the scope of the component that authored it', () => {
    const Child = defineComponent({
      __scopeId: CHILD_SCOPE,
      render(this: { $slots: Record<string, () => unknown> }) {
        return h('view', { class: 'toast' }, [this.$slots.default?.()]);
      },
    });

    const Parent = defineComponent({
      __scopeId: PARENT_SCOPE,
      render() {
        return h(Child, null, {
          default: () => [h('view', { class: 'slotted' })],
        });
      },
    });

    const { container } = render(Parent);
    expect((container.querySelector('.toast') as { cssId?: string }).cssId)
      .toBe(cardCssId(CHILD_SCOPE));
    // Slot content is created by the parent's render, so it belongs to the
    // parent's fragment.
    expect((container.querySelector('.slotted') as { cssId?: string }).cssId)
      .toBe(cardCssId(PARENT_SCOPE));
  });

  it('keeps the child scope on a lowered element-template root', () => {
    // The compile-time lowering bakes `__SetCSSId` into the template's
    // create(); the runtime still emits SET_SCOPE_ID for the vnode, so the
    // lowered root must resolve its scope exactly like the vdom path.
    const tpl = registerElementTemplate('scoped-317', [], (P: number) => {
      const e0 = __CreateView(P);
      __SetCSSId([e0], scopeIdToCssId(CHILD_SCOPE));
      const e1 = __CreateText(P);
      __SetCSSId([e1], scopeIdToCssId(CHILD_SCOPE));
      __SetAttribute(e1, 'text', 'Toast');
      __AppendElement(e0, e1);
      return [e0];
    });

    const Child = defineComponent({
      __scopeId: CHILD_SCOPE,
      render() {
        return h(`__vlx-tpl:${tpl}`, { class: 'toast' });
      },
    });

    const Parent = defineComponent({
      __scopeId: PARENT_SCOPE,
      render() {
        return h('view', { class: 'parent' }, [h(Child)]);
      },
    });

    const { container } = render(Parent);
    expect((container.querySelector('.toast') as { cssId?: string }).cssId)
      .toBe(cardCssId(CHILD_SCOPE));
  });

  it('falls back to the user scope for an unscoped child root', () => {
    // No own scope to preserve — Vue applies the parent's, matching what the
    // DOM renderer does with `data-v-*` attributes.
    const Child = defineComponent({
      render() {
        return h('view', { class: 'plain-root' });
      },
    });

    const Parent = defineComponent({
      __scopeId: PARENT_SCOPE,
      render() {
        return h('view', { class: 'parent' }, [h(Child)]);
      },
    });

    const { container } = render(Parent);
    expect(
      (container.querySelector('.plain-root') as { cssId?: string }).cssId,
    ).toBe(cardCssId(PARENT_SCOPE));
  });
});
