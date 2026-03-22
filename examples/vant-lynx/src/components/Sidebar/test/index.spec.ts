import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Sidebar from '../index.vue';
import SidebarItem from '../../SidebarItem/index.vue';

function findSidebarItems(container: any): any[] {
  const allViews = Array.from(container.querySelectorAll('view'));
  return allViews.filter((v: any) => {
    const style = v.getAttribute('style') || '';
    return style.includes('cursor: pointer') || style.includes('cursor: not-allowed');
  });
}

describe('Sidebar', () => {
  it('should emit change event when active item changed', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { onChange }, {
            default: () => [
              h(SidebarItem, { title: 'Text' }),
              h(SidebarItem, { title: 'Text' }),
            ],
          });
        },
      }),
    );

    const items = findSidebarItems(container);

    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(0);

    await fireEvent.tap(items[1]);
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should emit click event when SidebarItem is clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => h(SidebarItem, { title: 'Text', onClick }),
          });
        },
      }),
    );

    const items = findSidebarItems(container);
    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onClick).toHaveBeenCalledWith(0);
  });

  it('should update v-model when active item changed', async () => {
    const onChange = vi.fn();
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Sidebar, {
              modelValue: active.value,
              'onUpdate:modelValue': (v: number) => { active.value = v; },
              onChange,
            }, {
              default: () => [
                h(SidebarItem, { title: 'Text' }),
                h(SidebarItem, { title: 'Text' }),
              ],
            });
        },
      }),
    );

    const items = findSidebarItems(container);
    await fireEvent.tap(items[1]);
    await nextTick();
    expect(active.value).toEqual(1);
    expect(onChange).toHaveBeenCalledWith(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should not update v-model when disabled SidebarItem is clicked', async () => {
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Sidebar, {
              modelValue: active.value,
              'onUpdate:modelValue': (v: number) => { active.value = v; },
            }, {
              default: () => [
                h(SidebarItem, { title: 'Text' }),
                h(SidebarItem, { title: 'Text', disabled: true }),
              ],
            });
        },
      }),
    );

    const items = findSidebarItems(container);
    await fireEvent.tap(items[1]);
    await nextTick();
    expect(active.value).toEqual(0);
  });

  it('should render title slot correctly', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Sidebar, { modelValue: 0 }, {
              default: () =>
                h(SidebarItem, null, {
                  title: () => h('text', null, 'Custom Title'),
                }),
            });
        },
      }),
    );

    const textEls = Array.from(container.querySelectorAll('text'));
    const hasCustomTitle = textEls.some(
      (el: any) => el.textContent === 'Custom Title',
    );
    expect(hasCustomTitle).toBe(true);
  });

  it('should render badge-props correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () =>
              h(SidebarItem, {
                title: 'Text',
                badge: 1,
                badgeProps: { color: 'blue' },
              }),
          });
        },
      }),
    );

    const allViews = Array.from(container.querySelectorAll('view'));
    const badgeView = allViews.find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background') && style.includes('blue');
    });
    expect(badgeView).toBeTruthy();
  });
});
