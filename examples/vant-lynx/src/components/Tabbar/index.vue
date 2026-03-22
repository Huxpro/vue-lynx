<!--
  Lynx Limitations:
  - route: Lynx has no vue-router; prop accepted for API compatibility but ignored
  - safeAreaInsetBottom: Uses fixed 34px instead of env(safe-area-inset-bottom) (Lynx limitation)
  - BORDER_TOP_BOTTOM: Inline border style used instead of CSS class
  - placeholder: Uses fixed 50px height instead of getBoundingClientRect (Lynx limitation)
  - CSS variable theming: Lynx uses inline styles instead of CSS custom properties
-->
<script setup lang="ts">
import { computed, provide, ref } from 'vue-lynx';
import { TABBAR_KEY, type Numeric, type Interceptor } from './types';

export interface TabbarProps {
  modelValue?: Numeric;
  fixed?: boolean;
  border?: boolean;
  zIndex?: Numeric;
  activeColor?: string;
  inactiveColor?: string;
  placeholder?: boolean;
  safeAreaInsetBottom?: boolean | null;
  beforeChange?: Interceptor;
  route?: boolean;
}

const props = withDefaults(defineProps<TabbarProps>(), {
  modelValue: 0,
  fixed: true,
  border: true,
  zIndex: 1,
  placeholder: false,
  safeAreaInsetBottom: null,
  route: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Numeric];
  change: [value: Numeric];
}>();

// Matches Vant's callInterceptor pattern
function callInterceptor(
  interceptor: Interceptor | undefined,
  args: any[],
  done: () => void,
) {
  if (!interceptor) {
    done();
    return;
  }
  const returnVal = interceptor(...args);
  if (returnVal === false) {
    return;
  }
  if (returnVal && typeof (returnVal as Promise<boolean>).then === 'function') {
    (returnVal as Promise<boolean>)
      .then((result) => {
        if (result !== false) {
          done();
        }
      })
      .catch(() => {});
    return;
  }
  done();
}

// Matches Vant's setActive signature: (active, afterChange) => void
function setActive(active: Numeric, afterChange: () => void) {
  callInterceptor(props.beforeChange, [active], () => {
    emit('update:modelValue', active);
    emit('change', active);
    afterChange();
  });
}

// Enable safe area inset bottom by default when fixed (matching Vant behavior)
const enableSafeArea = computed(() => {
  return props.safeAreaInsetBottom ?? props.fixed;
});

// Lynx does not support env(safe-area-inset-bottom), so we use a fixed value.
const SAFE_AREA_BOTTOM = 34;

// Child index counter for auto-naming items without explicit name prop
const childCount = ref(0);
function getNextIndex(): number {
  return childCount.value++;
}

provide(TABBAR_KEY, {
  props,
  setActive,
  getNextIndex,
});

const tabbarHeight = 50;

const tabbarStyle = computed(() => {
  const zIndex = typeof props.zIndex === 'string' ? parseInt(props.zIndex, 10) : props.zIndex;
  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    boxSizing: 'content-box' as const,
    width: '100%',
    height: `${tabbarHeight}px`,
    backgroundColor: '#fff',
    position: props.fixed ? ('fixed' as const) : ('relative' as const),
    bottom: props.fixed ? '0px' : undefined,
    left: props.fixed ? '0px' : undefined,
    right: props.fixed ? '0px' : undefined,
    zIndex,
    borderTopWidth: props.border ? '0.5px' : '0px',
    borderTopStyle: 'solid' as const,
    borderTopColor: '#ebedf0',
    paddingBottom: enableSafeArea.value ? `${SAFE_AREA_BOTTOM}px` : '0px',
  };
});

const placeholderStyle = computed(() => ({
  height: `${tabbarHeight + (enableSafeArea.value ? SAFE_AREA_BOTTOM : 0)}px`,
}));
</script>

<template>
  <view v-if="fixed && placeholder" :style="placeholderStyle">
    <view :style="tabbarStyle">
      <slot />
    </view>
  </view>
  <view v-else :style="tabbarStyle">
    <slot />
  </view>
</template>
