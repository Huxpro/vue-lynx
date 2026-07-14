import { nextTick, onMounted } from 'vue-lynx';

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

export function useNativeInputValue(
  target: Readonly<{ value: NativeInputTarget | null }>,
  getValue: () => string,
): void {
  onMounted(async () => {
    // Wait until the input creation op has reached the native tree before
    // invoking its UI method. v-model continues to own subsequent updates.
    await nextTick();
    if (target.value) setNativeInputValue(target.value, getValue());
  });
}
