export type FetchLike = (...args: any[]) => any;

export function resolveFetch(
  globalFetch: unknown,
  wrapperFetch: unknown,
): FetchLike | undefined {
  if (typeof wrapperFetch === 'function')
    return wrapperFetch as FetchLike;
  if (typeof globalFetch === 'function')
    return globalFetch as FetchLike;
  return undefined;
}
