export interface NativeInputTarget {
  invoke(options: {
    method: string;
    params?: Record<string, unknown>;
  }): { exec(): unknown };
}

export function setNativeInputValue(target: NativeInputTarget, value: string): void {
  target
    .invoke({
      method: 'setValue',
      params: { value },
    })
    .exec();
}

export function createNativeInputValueSync(
  target: Readonly<{ value: NativeInputTarget | null }>,
  getValue: () => string,
): () => void {
  let synced = false;
  return () => {
    if (synced || !target.value) return;
    setNativeInputValue(target.value, getValue());
    synced = true;
  };
}

export function useNativeInputValue(
  target: Readonly<{ value: NativeInputTarget | null }>,
  getValue: () => string,
): () => void {
  // A conditional input can mount before its create op reaches the native
  // tree. Its first layoutchange is the deterministic native-ready signal.
  return createNativeInputValueSync(target, getValue);
}
