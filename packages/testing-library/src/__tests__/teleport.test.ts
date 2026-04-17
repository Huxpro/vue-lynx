/**
 * Teleport tests — verify that <Teleport> moves content to the target
 * element identified by `to="#id"` through the full dual-thread pipeline.
 */

import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref, nextTick, Teleport } from 'vue-lynx';
import { render } from '../index.js';

async function flush() {
  await nextTick();
  await nextTick();
}

function teleportSlot(children: () => unknown[]) {
  return { default: children };
}

describe('Teleport', () => {
  it('teleports content to target element by id', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h('view', { id: 'target' }),
          h(Teleport, { to: '#target' }, teleportSlot(() => [
            h('text', null, 'Hello'),
          ])),
        ]);
      },
    });

    const { container } = render(Comp);
    const target = container.querySelector('[id="target"]');
    expect(target).not.toBeNull();
    expect(target!.textContent).toBe('Hello');
  });

  it('updates teleported content reactively', async () => {
    const msg = ref('first');

    const Comp = defineComponent({
      setup() {
        return { msg };
      },
      render() {
        return h('view', null, [
          h('view', { id: 'target' }),
          h(Teleport, { to: '#target' }, teleportSlot(() => [
            h('text', null, this.msg),
          ])),
        ]);
      },
    });

    const { container } = render(Comp);
    const target = container.querySelector('[id="target"]');
    expect(target!.textContent).toBe('first');

    msg.value = 'second';
    await flush();
    expect(target!.textContent).toBe('second');
  });

  it('removes teleported content on unmount', async () => {
    const show = ref(true);

    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h('view', { id: 'target' }),
          show.value
            ? h(Teleport, { to: '#target' }, teleportSlot(() => [
                h('text', null, 'Content'),
              ]))
            : null,
        ]);
      },
    });

    const { container } = render(Comp);
    const target = container.querySelector('[id="target"]');
    expect(target!.textContent).toBe('Content');

    show.value = false;
    await flush();
    expect(target!.textContent).toBe('');
  });
});
