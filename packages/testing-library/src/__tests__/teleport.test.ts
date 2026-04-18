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

  it('renders content in-place when disabled', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h('view', { id: 'target' }),
          h(Teleport, { to: '#target', disabled: true }, teleportSlot(() => [
            h('text', null, 'InPlace'),
          ])),
        ]);
      },
    });

    const { container } = render(Comp);
    // When disabled, content should NOT be in target
    const target = container.querySelector('[id="target"]');
    expect(target!.textContent).toBe('');
    // Content should be rendered in-place (inside the root view)
    expect(container.textContent).toContain('InPlace');
  });

  it('multiple teleports to the same target', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h('view', { id: 'target' }),
          h(Teleport, { to: '#target' }, teleportSlot(() => [
            h('text', null, 'First'),
          ])),
          h(Teleport, { to: '#target' }, teleportSlot(() => [
            h('text', null, 'Second'),
          ])),
        ]);
      },
    });

    const { container } = render(Comp);
    const target = container.querySelector('[id="target"]');
    expect(target!.textContent).toContain('First');
    expect(target!.textContent).toContain('Second');
  });

  it('handles non-existent target gracefully', () => {
    // Vue emits its own warning for missing targets; content should not crash.
    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h(Teleport, { to: '#does-not-exist' }, teleportSlot(() => [
            h('text', null, 'Lost'),
          ])),
        ]);
      },
    });

    // Should not throw
    const { container } = render(Comp);
    expect(container).not.toBeNull();
  });
});
