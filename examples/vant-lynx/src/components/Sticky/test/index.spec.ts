import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Sticky from '../index.vue';

async function later() {
  await nextTick();
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
}

describe('Sticky', () => {
  it('should render sticky wrapper with two views', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {}, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // root view + inner van-sticky view
    expect(views.length).toBe(2);
  });

  it('should apply van-sticky class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {}, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // The inner view should have van-sticky class
    const innerView = views[1];
    expect(innerView.getAttribute('class')).toContain('van-sticky');
    expect(innerView.getAttribute('class')).not.toContain('van-sticky--fixed');
  });

  it('should become fixed when scrollTop exceeds offsetTop', async () => {
    const stickyRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    const views = container.querySelectorAll('view');
    const innerView = views[1];
    expect(innerView.getAttribute('class')).toContain('van-sticky--fixed');
  });

  it('should not be fixed when scrollTop is below offsetTop', async () => {
    const stickyRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            offsetTop: 50,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 30 } });
    await later();

    const views = container.querySelectorAll('view');
    const innerView = views[1];
    expect(innerView.getAttribute('class')).not.toContain('van-sticky--fixed');
  });

  it('should apply custom z-index when fixed', async () => {
    const stickyRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            zIndex: 200,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    const views = container.querySelectorAll('view');
    const innerView = views[1];
    const style = innerView.getAttribute('style') || '';
    expect(style).toContain('z-index');
    expect(style).toContain('200');
  });

  it('should apply offset-top style when fixed', async () => {
    const stickyRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            offsetTop: 10,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    const views = container.querySelectorAll('view');
    const innerView = views[1];
    const style = innerView.getAttribute('style') || '';
    expect(style).toContain('top');
    expect(style).toContain('10px');
  });

  it('should support bottom position', async () => {
    const stickyRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            position: 'bottom',
            offsetBottom: 20,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    const views = container.querySelectorAll('view');
    const innerView = views[1];
    const style = innerView.getAttribute('style') || '';
    expect(style).toContain('bottom');
    expect(style).toContain('20px');
    expect(innerView.getAttribute('class')).toContain('van-sticky--fixed');
  });

  it('should emit scroll event', async () => {
    const onScroll = vi.fn();
    const stickyRef = ref<any>(null);
    render(
      defineComponent({
        render() {
          return h(Sticky, {
            onScroll,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    expect(onScroll).toHaveBeenCalledWith({
      scrollTop: 100,
      isFixed: true,
    });
  });

  it('should emit change event when fixed state changes', async () => {
    const onChange = vi.fn();
    const stickyRef = ref<any>(null);
    render(
      defineComponent({
        render() {
          return h(Sticky, {
            onChange,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    expect(onChange).toHaveBeenCalledWith(true);

    stickyRef.value?.handleScroll({ detail: { scrollTop: 0 } });
    await later();

    expect(onChange).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('should not emit change event when state does not change', async () => {
    const onChange = vi.fn();
    const stickyRef = ref<any>(null);
    render(
      defineComponent({
        render() {
          return h(Sticky, {
            onChange,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();
    stickyRef.value?.handleScroll({ detail: { scrollTop: 200 } });
    await later();

    // change should only fire once (false -> true), not again for 200
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should accept numeric string for offsetTop', async () => {
    const stickyRef = ref<any>(null);
    const onScroll = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            offsetTop: '30',
            onScroll,
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    stickyRef.value?.handleScroll({ detail: { scrollTop: 50 } });
    await later();

    const views = container.querySelectorAll('view');
    const innerView = views[1];
    expect(innerView.getAttribute('class')).toContain('van-sticky--fixed');
    const style = innerView.getAttribute('style') || '';
    expect(style).toContain('30px');
  });

  it('should expose handleScroll and isFixed', async () => {
    const stickyRef = ref<any>(null);
    render(
      defineComponent({
        render() {
          return h(Sticky, {
            ref: (el: any) => { stickyRef.value = el; },
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );

    await later();

    expect(typeof stickyRef.value?.handleScroll).toBe('function');
    expect(stickyRef.value?.isFixed).toBe(false);

    stickyRef.value?.handleScroll({ detail: { scrollTop: 100 } });
    await later();

    expect(stickyRef.value?.isFixed).toBe(true);
  });

  it('should accept container prop for API compatibility', () => {
    const containerObj = {};
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {
            container: containerObj,
          }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(2);
  });
});
