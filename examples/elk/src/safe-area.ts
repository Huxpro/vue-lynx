export interface SafeAreaInsets {
  top: number;
  bottom: number;
}

type SparklingGlobalProps = Record<string, unknown>;

declare const lynx: {
  __globalProps?: SparklingGlobalProps;
} | undefined;

const EMPTY_INSETS: SafeAreaInsets = { top: 0, bottom: 0 };

function toInset(value: unknown): number {
  const inset = typeof value === 'string' ? Number.parseFloat(value) : value;
  return typeof inset === 'number' && Number.isFinite(inset) && inset > 0
    ? inset
    : 0;
}

/** Normalize the iOS safe-area values injected by a Sparkling container. */
export function getSafeAreaInsetsFromGlobalProps(
  globalProps?: SparklingGlobalProps,
): SafeAreaInsets {
  const os = String(globalProps?.os ?? '').toLowerCase();
  const hasExplorerInsets = globalProps?.safeAreaTop !== undefined
    || globalProps?.safeAreaBottom !== undefined;

  if (os === 'android' || (os !== 'ios' && !hasExplorerInsets))
    return EMPTY_INSETS;

  return {
    top: toInset(globalProps?.topHeight ?? globalProps?.safeAreaTop),
    bottom: toInset(globalProps?.bottomHeight ?? globalProps?.safeAreaBottom),
  };
}

/** Snapshot Sparkling global props before the root Vue component mounts. */
export function getSparklingSafeAreaInsets(): SafeAreaInsets {
  try {
    return getSafeAreaInsetsFromGlobalProps(
      typeof lynx !== 'undefined' ? lynx?.__globalProps : undefined,
    );
  }
  catch {
    return EMPTY_INSETS;
  }
}
