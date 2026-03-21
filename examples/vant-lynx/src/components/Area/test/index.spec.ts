import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Area from '../index.vue';

describe('Area', () => {
  const areaList = {
    province_list: { '110000': 'Beijing', '120000': 'Tianjin' },
    city_list: { '110100': 'Beijing City', '120100': 'Tianjin City' },
    county_list: {
      '110101': 'Dongcheng',
      '110102': 'Xicheng',
      '120101': 'Heping',
      '120102': 'Hedong',
    },
  };

  it('should render area picker', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, title: 'Select Area' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Select Area');
    expect(hasTitle).toBe(true);
  });

  it('should render with loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render province options', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, title: 'Select Area' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasBeijing = Array.from(textEls).some((t) => t.textContent === 'Beijing');
    const hasTianjin = Array.from(textEls).some((t) => t.textContent === 'Tianjin');
    expect(hasBeijing).toBe(true);
    expect(hasTianjin).toBe(true);
  });

  it('should render confirm and cancel buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasConfirm = Array.from(textEls).some((t) => t.textContent === 'Confirm');
    const hasCancel = Array.from(textEls).some((t) => t.textContent === 'Cancel');
    expect(hasConfirm).toBe(true);
    expect(hasCancel).toBe(true);
  });
});
