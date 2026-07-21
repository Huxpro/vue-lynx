/**
 * Control: without #302 recycling, cross-item uiSign reuse must fail.
 */

import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from '../index.js';
import { probeListRecycle } from '../../../vue-lynx/main-thread/src/list-apply.js';

function env() {
  return (globalThis as any).lynxTestingEnv;
}

describe('list recycle control (pre-#302)', () => {
  it('probeListRecycle: self-reuse ok, cross-item fails without pool', () => {
    const Comp = defineComponent({
      render() {
        return h('list', null, [
          h(
            'list-item',
            { key: 'a', 'item-key': 'a', 'reuse-identifier': 'row' },
            [h('text', null, 'A')],
          ),
          h(
            'list-item',
            { key: 'b', 'item-key': 'b', 'reuse-identifier': 'row' },
            [h('text', null, 'B')],
          ),
        ]);
      },
    });

    const { container } = render(Comp);
    env().switchToMainThread();
    const listEl = container.querySelector('list') as any;

    const result = probeListRecycle(listEl);
    // Eager create: same cell always has the same FiberElement uiSign.
    expect(result.selfOk).toBe(true);
    expect(result.sign0b).toBe(result.sign0);
    // No recycle pool → index 1 keeps its own uiSign.
    expect(result.crossOk).toBe(false);
    expect(result.sign1).not.toBe(result.sign0b);
    expect(result.poolAfterLeave).toBe(0);
  });
});
