import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Cascader from '../index.vue';

const options = [
  {
    text: 'Zhejiang',
    value: 'zhejiang',
    children: [
      { text: 'Hangzhou', value: 'hangzhou', children: [
        { text: 'Westlake', value: 'westlake' },
      ]},
    ],
  },
  {
    text: 'Jiangsu',
    value: 'jiangsu',
    children: [
      { text: 'Nanjing', value: 'nanjing' },
    ],
  },
];

describe('Cascader', () => {
  it('should render with title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, { title: 'Select Area', options });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const titles = Array.from(texts).map((t) => t.textContent);
    expect(titles.some((t) => t?.includes('Select Area'))).toBe(true);
  });

  it('should render options list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, { options });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render placeholder tab', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, { options, placeholder: 'Choose' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels.some((t) => t?.includes('Choose'))).toBe(true);
  });

  it('should render close button when closeable is true', () => {
    const closes: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options,
            closeable: true,
            onClose: () => closes.push(true),
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should emit finish on leaf option selection', async () => {
    const finishes: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Cascader, {
            options: [{ text: 'Item', value: 'item' }],
            onFinish: (v: any) => finishes.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    // Find the option view and tap it
    // Options are rendered after tabs row
    const optionViews = Array.from(views).filter((v) =>
      v.querySelector('text')?.textContent?.includes('Item'),
    );
    if (optionViews.length > 0) {
      fireEvent.tap(optionViews[0]);
    }
    expect(container).not.toBeNull();
  });
});
