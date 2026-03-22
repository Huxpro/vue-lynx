import { ref, watch } from 'vue-lynx';
import type { WatchSource } from 'vue-lynx';

export function useLazyRender(show: WatchSource<boolean | undefined>) {
  const inited = ref(false);

  watch(
    show,
    (value) => {
      if (value) {
        inited.value = true;
      }
    },
    { immediate: true },
  );

  return inited;
}
