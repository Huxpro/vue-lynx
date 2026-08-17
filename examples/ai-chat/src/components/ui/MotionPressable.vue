<script setup lang="ts">
/**
 * Touch feedback is intentionally handled on Lynx's main thread. The tap
 * still crosses to Vue's background thread for the actual application action,
 * but the pressed state appears synchronously on Native.
 */
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    accessibilityLabel?: string;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ tap: [] }>();

interface MainThreadTouchEvent {
  currentTarget?: {
    setStyleProperty?(name: string, value: string): void;
  };
}

const pressIn = (event: MainThreadTouchEvent) => {
  'main thread';
  const element = event.currentTarget;
  const prefersReducedMotion = Boolean(
    (lynx.__globalProps as { prefersReducedMotion?: boolean } | undefined)?.prefersReducedMotion,
  );
  if (prefersReducedMotion) {
    element?.setStyleProperty?.('transition', 'none');
    element?.setStyleProperty?.('transform', 'scale(1)');
    element?.setStyleProperty?.('opacity', '0.72');
    return;
  }
  element?.setStyleProperty?.(
    'transition',
    'transform 90ms cubic-bezier(0.25, 1, 0.5, 1), opacity 90ms linear',
  );
  element?.setStyleProperty?.('transform', 'scale(0.94)');
  element?.setStyleProperty?.('opacity', '0.72');
};

const pressOut = (event: MainThreadTouchEvent) => {
  'main thread';
  const element = event.currentTarget;
  const prefersReducedMotion = Boolean(
    (lynx.__globalProps as { prefersReducedMotion?: boolean } | undefined)?.prefersReducedMotion,
  );
  if (prefersReducedMotion) {
    element?.setStyleProperty?.('transition', 'none');
    element?.setStyleProperty?.('transform', 'scale(1)');
    element?.setStyleProperty?.('opacity', '1');
    return;
  }
  element?.setStyleProperty?.(
    'transition',
    'transform 140ms cubic-bezier(0.22, 1, 0.36, 1), opacity 140ms linear',
  );
  element?.setStyleProperty?.('transform', 'scale(1)');
  element?.setStyleProperty?.('opacity', '1');
};

function onTap() {
  if (!props.disabled) emit('tap');
}
</script>

<template>
  <view
    :main-thread-bindtouchstart="props.disabled ? undefined : pressIn"
    :main-thread-bindtouchend="props.disabled ? undefined : pressOut"
    :main-thread-bindtouchcancel="props.disabled ? undefined : pressOut"
    :accessibility-element="true"
    accessibility-trait="button"
    :accessibility-label="accessibilityLabel"
    @tap="onTap"
  >
    <slot />
  </view>
</template>
