// Ported from elk: app/composables/paginator.ts.
// The masto.js Paginator iteration, buffering and state machine are Elk's.
// Rewritten: Elk triggers loadNext() by watching a DOM end-anchor's
// bounding box (useElementBounding + window.innerHeight); Lynx <list>
// exposes native `scrolltolower` instead, so the consumer wires that event
// straight to loadNext(). Streaming prepend is dropped (no WebSocket).
import type { mastodon } from 'masto';
import type { Ref } from 'vue-lynx';
import { ref } from 'vue-lynx';

export type PaginatorState = 'idle' | 'loading' | 'done' | 'error';

export function usePaginator<T, P, U = T>(
  paginator: mastodon.Paginator<T[], P>,
  preprocess: (items: (T | U)[]) => U[] = items => items as unknown as U[],
  buffer = 10,
) {
  const paginatorValues = paginator.values();
  const state = ref<PaginatorState>('idle') as Ref<PaginatorState>;
  const items = ref<U[]>([]) as Ref<U[]>;
  const nextItems = ref<U[]>([]) as Ref<U[]>;
  const error = ref<unknown | undefined>();

  async function loadNext() {
    if (state.value !== 'idle')
      return;

    state.value = 'loading';
    try {
      const result = await paginatorValues.next();

      if (!result.done && result.value.length) {
        const preprocessedItems = preprocess([...nextItems.value, ...result.value] as (U | T)[]);
        // Keep a buffer of items hidden so the reorder pass (which needs
        // lookahead) stays stable across pages — same trick as Elk.
        const itemsToShowCount = preprocessedItems.length <= buffer
          ? preprocessedItems.length
          : preprocessedItems.length - buffer;
        nextItems.value = preprocessedItems.slice(itemsToShowCount);
        items.value.push(...preprocessedItems.slice(0, itemsToShowCount));
        state.value = 'idle';
      }
      else {
        items.value.push(...nextItems.value);
        nextItems.value = [];
        state.value = 'done';
      }
    }
    catch (e) {
      console.error(e);
      error.value = e;
      state.value = 'error';
    }
  }

  return {
    items,
    state,
    error,
    loadNext,
  };
}
