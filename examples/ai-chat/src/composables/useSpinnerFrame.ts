/**
 * SPDX-License-Identifier: MIT
 *
 * Adapted from Huxpro/lynx-agent-spinners at commit
 * 45a6881a71a8d2467c88019a2ffebaa9dc970e15:
 * https://github.com/Huxpro/lynx-agent-spinners/blob/45a6881a71a8d2467c88019a2ffebaa9dc970e15/src/vue/useSpinnerFrame.ts
 */
import { computed, onScopeDispose, ref, type ComputedRef } from 'vue-lynx';

interface MatchMediaResultLike {
  matches: boolean;
}

function prefersReducedMotion(): boolean {
  const matchMedia = (globalThis as {
    matchMedia?: (query: string) => MatchMediaResultLike;
  }).matchMedia;

  return matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function useSpinnerFrame(
  frames: readonly string[],
  interval: number,
  reducedMotion = prefersReducedMotion(),
): ComputedRef<string> {
  const index = ref(0);

  if (!reducedMotion && frames.length > 1) {
    const id = setInterval(() => {
      index.value = (index.value + 1) % frames.length;
    }, interval);

    onScopeDispose(() => clearInterval(id));
  }

  return computed(() => frames[index.value] ?? '');
}
