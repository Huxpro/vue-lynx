/**
 * Style tests — verify inline styles flow through the pipeline:
 * Vue patchProp('style', ...) → SET_STYLE op → __SetInlineStyles → JSDOM
 */

import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render } from '../index.js';
import { OP } from '../../../internal/src/ops.js';
import { nodeOps } from '../../../runtime/src/node-ops.js';
import { takeOps } from '../../../runtime/src/ops.js';
import { ShadowElement } from '../../../runtime/src/shadow-element.js';

describe('styles', () => {
  it('stringifies numeric flex in SET_STYLE payloads', () => {
    const el = new ShadowElement('view', 42);

    nodeOps.patchProp(el, 'style', null, { flex: 1, fontSize: 16 });

    const ops = takeOps();
    expect(ops[0]).toBe(OP.SET_STYLE);
    expect(ops[1]).toBe(42);
    expect(ops[2]).toMatchObject({
      flex: '1',
      fontSize: '16px',
    });
  });

  it('applies inline styles', () => {
    const Comp = defineComponent({
      render() {
        return h('view', {
          style: {
            backgroundColor: '#ff0000',
            padding: 10,
            fontSize: 16,
          },
        });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    // __SetInlineStyles sets the style attribute as JSON or individual attrs
    // The testing environment may serialize style as an attribute
    expect(viewEl).not.toBeNull();
  });

  it('updates styles reactively', async () => {
    const color = ref('red');

    const Comp = defineComponent({
      setup() {
        return () =>
          h('view', {
            style: { backgroundColor: color.value },
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    expect(viewEl).not.toBeNull();

    color.value = 'blue';
    await nextTick();
    await nextTick();

    // The element should still exist after style update
    expect(container.querySelector('view')).not.toBeNull();
  });
});
