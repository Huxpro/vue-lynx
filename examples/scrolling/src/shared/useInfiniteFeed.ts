import { ref } from 'vue-lynx';
import { makeCards } from './data';

/**
 * Tiny infinite-scroll helper: append another page when the list
 * fires `@scrolltolower`. On Web you would usually wire this to a
 * virtualizer + IntersectionObserver; on Lynx the native `<list>`
 * already recycles items, so the composable only owns the data page.
 */
export function useInfiniteFeed(pageSize = 20) {
  const items = ref(makeCards(pageSize, 'Post'));
  const loading = ref(false);
  const done = ref(false);
  let page = 1;

  async function loadMore() {
    if (loading.value || done.value) return;
    loading.value = true;
    // Simulate network latency so the footer spinner is visible.
    await new Promise((resolve) => setTimeout(resolve, 400));
    const next = makeCards(pageSize, 'Post').map((card, i) => {
      const n = page * pageSize + i + 1;
      return {
        ...card,
        id: `Post-${n}`,
        title: `Post ${n}`,
        body: `A short description for post ${n}.`,
      };
    });
    page += 1;
    items.value = [...items.value, ...next];
    if (page >= 5) done.value = true;
    loading.value = false;
  }

  return { items, loading, done, loadMore };
}
