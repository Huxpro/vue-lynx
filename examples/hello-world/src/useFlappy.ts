import { onUnmounted, ref } from 'vue-lynx';

import { createFlappy } from './lib/flappy.js';
import type { FlappyOptions } from './lib/flappy.js';

export function useFlappy(options?: FlappyOptions) {
  const y = ref(0);

  const engine = createFlappy((newY) => {
    y.value = newY;
  }, options);

  onUnmounted(() => {
    engine.destroy();
  });

  return { y, jump: () => engine.jump() };
}
