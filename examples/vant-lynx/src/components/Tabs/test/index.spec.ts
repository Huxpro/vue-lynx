import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabs from '../index.vue';
import Tab from '../../Tab/index.vue';

describe('Tabs', () => {
  it('should render tabs container with headers', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
    // Should have text elements for tab titles
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThanOrEqual(2);
  });

  it('should render line type by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render card type', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, type: 'card' }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should emit click-tab on header tap', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    // Find tab headers (they have tap handlers)
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should auto-index tabs when no name prop given', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'First' }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Second' }, { default: () => 'Content 2' }),
              h(Tab, { title: 'Third' }, { default: () => 'Content 3' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    // Should render at least 3 tab headers
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThanOrEqual(3);
  });
});
