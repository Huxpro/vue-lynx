import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NoticeBar from '../index.vue';

describe('NoticeBar', () => {
  it('should render notice bar with text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, { text: 'Important notice' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasText = Array.from(textEls).some(
      (t) => t.textContent === 'Important notice',
    );
    expect(hasText).toBe(true);
  });
});
