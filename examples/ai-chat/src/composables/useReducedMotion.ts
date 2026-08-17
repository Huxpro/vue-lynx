import { onScopeDispose, ref } from 'vue-lynx';

interface MediaQueryListLike {
  matches: boolean;
  addEventListener?(type: 'change', listener: (event: { matches: boolean }) => void): void;
  removeEventListener?(type: 'change', listener: (event: { matches: boolean }) => void): void;
}

/**
 * Lynx Web runs Vue in a worker, so an embedding host passes its matchMedia
 * result as globalProps.prefersReducedMotion. The direct matchMedia fallback
 * also covers same-realm renderers and tests. Native keeps the restrained
 * default until its host supplies the same global prop.
 */
export function useReducedMotion() {
  const globalProps =
    typeof lynx === 'undefined'
      ? undefined
      : (lynx.__globalProps as { prefersReducedMotion?: boolean } | undefined);
  const matchMedia = (globalThis as {
    matchMedia?: (query: string) => MediaQueryListLike;
  }).matchMedia;
  const query = matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced = ref(globalProps?.prefersReducedMotion ?? query?.matches ?? false);
  const onChange = (event: { matches: boolean }) => {
    reduced.value = event.matches;
  };

  query?.addEventListener?.('change', onChange);
  onScopeDispose(() => query?.removeEventListener?.('change', onChange));

  return reduced;
}
