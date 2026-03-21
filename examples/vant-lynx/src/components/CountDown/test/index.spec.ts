import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import CountDown from '../index.vue';

describe('CountDown', () => {
  it('should render countdown display', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, { time: 30 * 60 * 60 * 1000, autoStart: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
    // Default format is HH:mm:ss, should contain ':'
    const hasTime = Array.from(textEls).some(
      (t) => t.textContent!.includes(':'),
    );
    expect(hasTime).toBe(true);
  });
});
