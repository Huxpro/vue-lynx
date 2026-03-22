import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import CountDown from '../index.vue';
import { parseFormat } from '../utils';
import type { CurrentTime } from '../../../composables/useCountDown';

function later(ms: number = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('CountDown', () => {
  it('should emit finish event when finished', async () => {
    const onFinish = vi.fn();
    render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 1,
            onFinish,
          });
        },
      }),
    );

    expect(onFinish).not.toHaveBeenCalled();
    await later(50);
    expect(onFinish).toHaveBeenCalled();
  });

  it('should emit finish event when finished and millisecond is true', async () => {
    const onFinish = vi.fn();
    render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 1,
            millisecond: true,
            onFinish,
          });
        },
      }),
    );

    expect(onFinish).not.toHaveBeenCalled();
    await later(50);
    expect(onFinish).toHaveBeenCalled();
  });

  it('should re-render after some time', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 1000,
            format: 'SSS',
          });
        },
      }),
    );

    const getContent = () => {
      const texts = container.querySelectorAll('text');
      return Array.from(texts).map((t: any) => t.textContent).join('');
    };

    const prevSnapshot = getContent();
    await later(50);
    const laterSnapshot = getContent();

    expect(prevSnapshot).not.toEqual(laterSnapshot);
  });

  it('should re-render after some time when millisecond is true', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 100,
            format: 'SSS',
            millisecond: true,
          });
        },
      }),
    );

    const getContent = () => {
      const texts = container.querySelectorAll('text');
      return Array.from(texts).map((t: any) => t.textContent).join('');
    };

    const prevSnapshot = getContent();
    await later(50);
    const laterSnapshot = getContent();

    expect(prevSnapshot).not.toEqual(laterSnapshot);
  });

  it('should not start counting when auto-start prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 100,
            format: 'SSS',
            autoStart: false,
          });
        },
      }),
    );

    const getContent = () => {
      const texts = container.querySelectorAll('text');
      return Array.from(texts).map((t: any) => t.textContent).join('');
    };

    const prevSnapshot = getContent();
    await later(50);
    const laterSnapshot = getContent();

    expect(prevSnapshot).toEqual(laterSnapshot);
  });

  it('should start counting after calling the start method', async () => {
    const countDownRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 100,
            format: 'SSS',
            autoStart: false,
            millisecond: true,
            ref: (el: any) => { countDownRef.value = el; },
          });
        },
      }),
    );

    const getContent = () => {
      const texts = container.querySelectorAll('text');
      return Array.from(texts).map((t: any) => t.textContent).join('');
    };

    const prevSnapshot = getContent();
    countDownRef.value?.start();
    await later(50);
    const laterSnapshot = getContent();

    expect(prevSnapshot).not.toEqual(laterSnapshot);
  });

  it('should pause counting after calling the pause method', async () => {
    const countDownRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 100,
            format: 'SSS',
            millisecond: true,
            ref: (el: any) => { countDownRef.value = el; },
          });
        },
      }),
    );

    const getContent = () => {
      const texts = container.querySelectorAll('text');
      return Array.from(texts).map((t: any) => t.textContent).join('');
    };

    countDownRef.value?.pause();
    const prevSnapshot = getContent();
    await later(50);
    const laterSnapshot = getContent();

    expect(prevSnapshot).toEqual(laterSnapshot);
  });

  it('should reset time after calling the reset method', async () => {
    const countDownRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 100,
            format: 'SSS',
            autoStart: false,
            millisecond: true,
            ref: (el: any) => { countDownRef.value = el; },
          });
        },
      }),
    );

    const getContent = () => {
      const texts = container.querySelectorAll('text');
      return Array.from(texts).map((t: any) => t.textContent).join('');
    };

    const prevSnapshot = getContent();
    countDownRef.value?.start();
    await later(50);
    countDownRef.value?.reset();
    await nextTick();
    const laterSnapshot = getContent();

    expect(prevSnapshot).toEqual(laterSnapshot);
  });

  it('should emit change event when counting', async () => {
    const onChange = vi.fn();
    render(
      defineComponent({
        render() {
          return h(CountDown, {
            time: 1,
            onChange,
          });
        },
      }),
    );

    expect(onChange).not.toHaveBeenCalled();
    await later(50);
    expect(onChange).toHaveBeenCalledWith({
      days: 0,
      hours: 0,
      milliseconds: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
    });
  });
});

describe('parseFormat', () => {
  it('should format complete time correctly', () => {
    const time: CurrentTime = {
      total: 30 * 60 * 60 * 1000 - 1,
      days: 1,
      hours: 5,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    };
    const result = parseFormat('DD-HH-mm-ss-SSS', time);
    expect(result).toBe('01-05-59-59-999');
  });

  it('should format incomplete time correctly (no DD token)', () => {
    const time: CurrentTime = {
      total: 30 * 60 * 60 * 1000 - 1,
      days: 1,
      hours: 5,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    };
    // When DD is absent, days*24 is added to hours
    const result = parseFormat('HH-mm-ss-SSS', time);
    expect(result).toBe('29-59-59-999');
  });

  it('should format SS milliseconds correctly', () => {
    const time: CurrentTime = {
      total: 1500,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      milliseconds: 500,
    };
    const result = parseFormat('ss-SS', time);
    expect(result).toBe('01-50');
  });

  it('should format S milliseconds correctly', () => {
    const time: CurrentTime = {
      total: 1500,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      milliseconds: 500,
    };
    const result = parseFormat('ss-S', time);
    expect(result).toBe('01-5');
  });

  it('should roll hours into minutes when HH is absent', () => {
    const time: CurrentTime = {
      total: 2 * 60 * 60 * 1000,
      days: 0,
      hours: 2,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    };
    const result = parseFormat('mm:ss', time);
    expect(result).toBe('120:00');
  });
});
