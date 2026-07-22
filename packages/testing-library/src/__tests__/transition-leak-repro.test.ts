/**
 * REGRESSION TEST: Transition without explicit `duration` used to leak
 * event-registry entries when the enter/leave was cancelled before the
 * transitionend/animationend event arrived (e.g. rapid v-if toggle on the
 * same element).
 *
 * whenTransitionEnds() registers a handler in the global event-registry and
 * used to only unregister() it inside finish(), which ran when the DOM event
 * fired. Vue core's cancel path calls el[leaveCbKey](true) / el[enterCbKey](true)
 * directly — the `done` closure that vue-lynx passed in never reached finish(),
 * so the registered sign stayed in the global Map forever.
 *
 * Fix (transition-shared.ts): whenTransitionEnds() now also arms a fixed
 * fallback `setTimeout` (4000ms) that force-finishes — and, critically,
 * finish() always unregisters its sign even when it's stale (superseded by
 * a newer transition on the same element), so an interrupted transition's
 * registry entry is freed once the fallback fires instead of leaking
 * forever. A per-element generation guard (`el._transitionEndId`) still
 * prevents a stale finish() from tearing out a newer transition's live
 * MT event binding.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  nextTick,
  Transition,
} from 'vue-lynx';
import { render } from '../index.js';

const REGISTRY_KEY = '__VUE_LYNX_EVENT_REGISTRY__';
// Keep in sync with FALLBACK_TIMEOUT_MS in transition-shared.ts.
const FALLBACK_TIMEOUT_MS = 4000;

function registrySize(): number {
  const state = (globalThis as any)[REGISTRY_KEY];
  return state ? (state.handlers as Map<string, unknown>).size : 0;
}

async function flush() {
  await nextTick();
  await nextTick();
}

/** Advance vitest's fake clock and let any resulting microtasks settle. */
async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Transition event-registry leak (fixed)', () => {
  it('does not leak registry entries when leave is cancelled before transitionend', async () => {
    const show = ref(true);

    const App = defineComponent({
      setup() {
        // NOTE: no `duration` prop → whenTransitionEnds() event path is used.
        return () =>
          h(Transition, null, {
            default: () => (show.value ? h('view', { class: 'box' }) : null),
          });
      },
    });

    render(App);
    await flush();

    const baseline = registrySize();

    // Drive several rapid leave→enter cancel cycles. Each leave registers a
    // transitionend listener; re-showing before the (never-fired) event
    // cancels the leave via el[leaveCbKey](true), which used to strand the
    // sign forever. Now each stranded sign is still bounded by its own
    // fallback timer.
    for (let i = 0; i < 5; i++) {
      show.value = false;
      await flush();
      await advance(40); // let nextFrame()'s rAF/setTimeout chain run, registering the sign
      show.value = true;
      await flush();
      await advance(40);
    }

    // Immediately after the hammering loop, interrupted signs are still
    // pending their fallback timers — this is expected, not a leak, as long
    // as they eventually clear.
    expect(registrySize()).toBeGreaterThan(baseline);

    // Advance past the fallback ceiling so every stranded fallback timer
    // fires and unregisters its sign. finish()'s unregister() itself runs
    // synchronously once the timer callback executes, but nextFrame()'s own
    // rAF/setTimeout(16) chain (armed by the *next* pending re-render, if
    // any) needs a settle pass too, so flush + re-advance once more.
    await advance(FALLBACK_TIMEOUT_MS + 100);
    await flush();
    await advance(FALLBACK_TIMEOUT_MS + 100);

    expect(registrySize()).toBe(baseline);
  });

  it('does not leak when the same element is hammered continuously', async () => {
    const show = ref(true);

    const App = defineComponent({
      setup() {
        return () =>
          h(Transition, null, {
            default: () => (show.value ? h('view', { class: 'box' }) : null),
          });
      },
    });

    render(App);
    await flush();
    const baseline = registrySize();

    // Toggle much faster than the fallback timeout for a while.
    for (let i = 0; i < 20; i++) {
      show.value = !show.value;
      await flush();
      await advance(10);
    }

    // Let every fallback timer armed during the hammering settle.
    await advance(FALLBACK_TIMEOUT_MS + 100);
    await flush();
    await advance(FALLBACK_TIMEOUT_MS + 100);

    expect(registrySize()).toBe(baseline);
  });
});
