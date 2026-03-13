import { useMainThreadRef } from 'vue-lynx';

export function useUpdateSwiperStyle() {
  const containerRef = useMainThreadRef<unknown>(null);

  function updateSwiperStyle(offset: number) {
    'main thread';
    (
      containerRef as unknown as {
        current?: { setStyleProperties?(s: Record<string, string>): void };
      }
    ).current?.setStyleProperties?.({
      transform: `translateX(${offset}px)`,
    });
  }

  return {
    containerRef,
    updateSwiperStyle,
  };
}
