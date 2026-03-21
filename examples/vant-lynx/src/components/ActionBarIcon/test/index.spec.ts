import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ActionBarIcon from '../index.vue';

describe('ActionBarIcon', () => {
  it('should render icon with text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, { icon: '\u2764', text: 'Like' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render with badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, { icon: '\u2764', text: 'Like', badge: 5 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render with dot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, { icon: '\u2606', text: 'Fav', dot: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
