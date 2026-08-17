import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Area from '../index.vue';

describe('Area', () => {
  const areaList = {
    province_list: {
      '110000': 'Beijing',
      '120000': 'Tianjin',
    },
    city_list: {
      '110100': 'Beijing City',
      '120100': 'Tianjin City',
    },
    county_list: {
      '110101': 'Dongcheng',
      '110102': 'Xicheng',
      '120101': 'Heping',
    },
  };

  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, title: 'Select Area' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, title: 'Select Area' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Select Area');
  });

  it('should render province list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, title: 'Select Area' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Beijing');
    expect(textContents).toContain('Tianjin');
  });

  it('should render confirm and cancel buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Confirm');
    expect(textContents).toContain('Cancel');
  });

  it('should show loading overlay when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Area, { areaList, loading: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Loading...');
  });
});
