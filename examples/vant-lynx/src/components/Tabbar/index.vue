<!--
  Vant Feature Parity Report:
  - Props: 8/9 supported (modelValue, fixed, border, zIndex, activeColor, inactiveColor,
    placeholder, safeAreaInsetBottom, beforeChange)
    - Missing: route (Lynx has no browser router; prop accepted but ignored)
  - Events: 2/2 supported (update:modelValue, change)
  - Provide/inject: Provides tabbar context to TabbarItem children
  - Placeholder: Supported (renders a spacer view matching tabbar height when fixed+placeholder)
  - Safe area inset bottom: Supported via safeAreaInsetBottom prop (adds 34px padding,
    Lynx does not support env(safe-area-inset-bottom) CSS function)
  - beforeChange: Supported (interceptor called before value change; supports sync/async/Promise)
  - Gaps:
    - route prop accepted but non-functional (Lynx has no vue-router)
    - Safe area uses fixed 34px instead of env(safe-area-inset-bottom) (Lynx limitation)
    - No CSS variable theming (Lynx uses inline styles)
    - No BORDER_TOP_BOTTOM class (inline border style used instead)
-->
<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue-lynx';

// --- Types ---
type Numeric = number | string;
type Interceptor = (...args: any[]) => Promise<boolean> | boolean | undefined | void;

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
  route?: boolean; // accepted for API compat, not functional in Lynx
}

const props = withDefaults(defineProps<TabbarProps>(), {
  modelValue: 0,
  fixed: true,
  border: true,
  zIndex: 1,
  activeColor: '#1989fa',
  inactiveColor: '#7d7e80',
  placeholder: false,
  safeAreaInsetBottom: null,
  route: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Numeric];
  change: [value: Numeric];
}>();

// --- beforeChange interceptor ---
// Matches Vant's callInterceptor pattern: supports sync boolean, Promise, or void return.
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
    // Sync rejection
    return;
  }

  if (returnVal && typeof (returnVal as Promise<boolean>).then === 'function') {
    (returnVal as Promise<boolean>)
      .then((result) => {
        if (result !== false) {
          done();
        }
      })
      .catch(() => {
        // Rejected promise = cancel
      });
    return;
  }

  // Sync truthy or void
  done();
}

function setActive(active: Numeric, afterChange?: () => void) {
  if (active !== props.modelValue) {
    callInterceptor(props.beforeChange, [active], () => {
      emit('update:modelValue', active);
      emit('change', active);
      afterChange?.();
    });
  } else {
    afterChange?.();
  }
}

// --- Safe area ---
// Enable safe area inset bottom by default when fixed (matching Vant behavior)
const enableSafeArea = computed(() => {
  return props.safeAreaInsetBottom ?? props.fixed;
});

// Lynx does not support env(safe-area-inset-bottom), so we use a fixed value.
// 34px is a common safe area bottom height for modern iPhones.
const SAFE_AREA_BOTTOM = 34;

// --- Provide to children ---
// The child index counter for auto-naming items without explicit name prop
const childCount = ref(0);
function getNextIndex(): number {
  return childCount.value++;
}

provide('tabbar', {
  props,
  modelValue: toRef(props, 'modelValue'),
  activeColor: toRef(props, 'activeColor'),
  inactiveColor: toRef(props, 'inactiveColor'),
  setActive,
  getNextIndex,
});

// --- Styles ---
const tabbarHeight = 50;

const tabbarStyle = computed(() => {
  const zIndex = typeof props.zIndex === 'string' ? parseInt(props.zIndex, 10) : props.zIndex;

  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    boxSizing: 'content-box' as const,
    width: '100%',
    height: tabbarHeight,
    backgroundColor: '#fff',
    position: props.fixed ? ('fixed' as const) : ('relative' as const),
    bottom: props.fixed ? 0 : undefined,
    left: props.fixed ? 0 : undefined,
    right: props.fixed ? 0 : undefined,
    zIndex,
    borderTopWidth: props.border ? 0.5 : 0,
    borderTopStyle: 'solid' as const,
    borderTopColor: '#ebedf0',
    paddingBottom: enableSafeArea.value ? SAFE_AREA_BOTTOM : 0,
  };
});

// Placeholder: a transparent spacer that occupies the same space as the fixed tabbar
// so content below the tabbar is not occluded
const placeholderStyle = computed(() => ({
  height: tabbarHeight + (enableSafeArea.value ? SAFE_AREA_BOTTOM : 0),
}));
</script>

<template>
  <!-- Placeholder mode: render a spacer + the fixed tabbar -->
  <view v-if="fixed && placeholder" :style="placeholderStyle">
    <view :style="tabbarStyle">
      <slot />
    </view>
  </view>

  <!-- Normal mode: just the tabbar -->
  <view v-else :style="tabbarStyle">
    <slot />
  </view>
</template>
