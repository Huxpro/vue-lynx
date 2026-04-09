/**
 * Event tests — verify the sign-based event pipeline:
 * Vue onTap handler → register(sign) → __AddEvent(el, bindEvent, tap, sign)
 * → JSDOM addEventListener(bindEvent:tap) → publishEvent(sign, data) → handler
 */

import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick, withModifiers } from 'vue-lynx';
import { render, fireEvent } from '../index.js';

describe('events', () => {
  it('fires bindtap handler via fireEvent.tap', async () => {
    const clicked = ref(false);

    const Comp = defineComponent({
      setup() {
        const handleTap = () => {
          clicked.value = true;
        };
        return () =>
          h('view', { bindtap: handleTap }, [
            h('text', null, clicked.value ? 'tapped' : 'not tapped'),
          ]);
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('text')!.textContent).toBe('not tapped');

    // Find the view element and fire tap
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);

    await nextTick();
    await nextTick();

    expect(container.querySelector('text')!.textContent).toBe('tapped');
  });

  it('fires onTap handler (Vue-style naming)', async () => {
    const count = ref(0);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            'view',
            {
              onTap: () => {
                count.value++;
              },
            },
            [h('text', null, `${count.value}`)],
          );
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('text')!.textContent).toBe('0');

    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();

    expect(container.querySelector('text')!.textContent).toBe('1');
  });

  it('handles handler updates on re-render', async () => {
    const results: string[] = [];
    const toggle = ref(false);

    const Comp = defineComponent({
      setup() {
        return () =>
          h('view', {
            bindtap: () => {
              results.push(toggle.value ? 'B' : 'A');
            },
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;

    fireEvent.tap(viewEl);
    await nextTick();
    expect(results).toEqual(['A']);

    toggle.value = true;
    await nextTick();
    await nextTick();

    fireEvent.tap(viewEl);
    await nextTick();
    expect(results).toEqual(['A', 'B']);
  });
});

describe('withModifiers', () => {
  it('.once — handler fires only the first time', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['once']);
    const evt = new Event('tap');

    wrapped(evt);
    wrapped(evt);
    wrapped(evt);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('.once — cached wrapper preserves called state across calls with same fn', () => {
    const fn = vi.fn();
    const wrapped1 = withModifiers(fn, ['once']);
    const wrapped2 = withModifiers(fn, ['once']); // same fn → same wrapper from cache

    expect(wrapped1).toBe(wrapped2);

    wrapped1(new Event('tap'));
    wrapped2(new Event('tap')); // should no-op — same wrapper, already called

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('.stop — calls stopPropagation on the event', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['stop']);
    const evt = new Event('tap', { bubbles: true });
    const stopSpy = vi.spyOn(evt, 'stopPropagation');

    wrapped(evt);

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('.prevent — calls preventDefault on the event', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['prevent']);
    const evt = new Event('tap', { cancelable: true });
    const preventSpy = vi.spyOn(evt, 'preventDefault');

    wrapped(evt);

    expect(preventSpy).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('.self — only fires when tapped directly, not via child bubble', async () => {
    const count = ref(0);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            'view',
            { onTap: withModifiers(() => { count.value++; }, ['self']) },
            [h('view')],
          );
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const parent = views[0]!;
    const child = views[1]!;

    // Tap on child with bubbles:true — event reaches parent's listener,
    // but target !== currentTarget so .self must block it.
    fireEvent.tap(child, { bubbles: true });
    await nextTick();
    await nextTick();
    expect(count.value).toBe(0);

    // Tap directly on parent — target === currentTarget, .self allows it.
    fireEvent.tap(parent);
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1);
  });

  it('.self — uid comparison: blocks when target.uid !== currentTarget.uid', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['self']);

    // Simulates a Lynx native event where target and currentTarget are
    // distinct plain objects but share the same uid (direct tap).
    wrapped({ target: { uid: 7 }, currentTarget: { uid: 7 } });
    expect(fn).toHaveBeenCalledTimes(1);

    // Different uid — event originated on a child element.
    wrapped({ target: { uid: 8 }, currentTarget: { uid: 7 } });
    expect(fn).toHaveBeenCalledTimes(1); // still 1 — blocked
  });

  it('.self — falls back to reference equality when uid is absent on currentTarget', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['self']);
    const obj = {};

    // Same reference, no uid — should allow (direct tap in DOM).
    wrapped({ target: obj, currentTarget: obj });
    expect(fn).toHaveBeenCalledTimes(1);

    // Different reference, no uid — should block (child bubble in DOM).
    wrapped({ target: {}, currentTarget: {} });
    expect(fn).toHaveBeenCalledTimes(1); // still 1
  });

  it('.stop.prevent — both side effects applied, handler still fires', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['stop', 'prevent']);
    const evt = new Event('tap', { bubbles: true, cancelable: true });
    const stopSpy = vi.spyOn(evt, 'stopPropagation');
    const preventSpy = vi.spyOn(evt, 'preventDefault');

    wrapped(evt);

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(preventSpy).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('.once.self — guard runs before called is set; child event does not consume the once slot', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['once', 'self']);

    const parent = {};
    const child = {};

    // First call: event originated on a child — .self should block, and
    // the once slot must NOT be consumed (called must stay false).
    wrapped({ target: child, currentTarget: parent });
    expect(fn).toHaveBeenCalledTimes(0);

    // Second call: direct tap on parent — .self allows it, handler fires once.
    wrapped({ target: parent, currentTarget: parent });
    expect(fn).toHaveBeenCalledTimes(1);

    // Third call: once already consumed — no-op.
    wrapped({ target: parent, currentTarget: parent });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('.once.stop — fires once and stops propagation', () => {
    const fn = vi.fn();
    const wrapped = withModifiers(fn, ['once', 'stop']);
    const evt = new Event('tap', { bubbles: true });
    const stopSpy = vi.spyOn(evt, 'stopPropagation');

    wrapped(evt);
    wrapped(evt);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1); // only on the first call
  });
});

describe('onTapOnce + _lynxCatch (once combined with stop)', () => {
  it('onTapOnce with a _lynxCatch handler registers as catchEvent and fires only once', async () => {
    // Simulates what the Vue compiler emits for @tap.once.stop:
    //   { onTapOnce: withModifiers(handler, ['stop']) }
    // The fix in patchProp ensures _lynxCatch is respected for once-events,
    // registering the listener as catchEvent:tap instead of bindEvent:tap.
    // The test therefore dispatches catchEvent:tap to match the registration.
    const count = ref(0);

    const Comp = defineComponent({
      setup() {
        return () =>
          h('view', {
            onTapOnce: withModifiers(() => { count.value++; }, ['stop']),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;

    // First tap: handler fires (catchEvent:tap matches the catchEvent registration).
    fireEvent.tap(viewEl, { eventType: 'catchEvent' });
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1);

    // Second tap: once already consumed — handler must not fire again.
    fireEvent.tap(viewEl, { eventType: 'catchEvent' });
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1); // still 1
  });
});

describe('onTapOnce prop key (parseEventProp once support)', () => {
  it('fires handler only once via onTapOnce prop', async () => {
    const count = ref(0);

    const Comp = defineComponent({
      setup() {
        return () =>
          h('view', { onTapOnce: () => { count.value++; } });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;

    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1);

    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1); // still 1 — once-event already consumed
  });

  it('preserves once-state across re-renders of onTapOnce handler', async () => {
    const count = ref(0);
    const extra = ref(0); // used to force a re-render via a child text node

    const Comp = defineComponent({
      setup() {
        return () =>
          h('view', { onTapOnce: () => { count.value++; } }, [
            h('text', null, `${extra.value}`),
          ]);
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;

    // Fire once — handler should run
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1);

    // Trigger a re-render via an unrelated reactive value
    extra.value = 1;
    await nextTick();
    await nextTick();

    // Fire again — once-state must survive the re-render
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(count.value).toBe(1);
  });
});
