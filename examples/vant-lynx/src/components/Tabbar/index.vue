<!--
  Lynx Limitations:
  - route: Lynx has no vue-router; prop accepted for API compatibility but ignored
  - safeAreaInsetBottom: Uses fixed 34px padding via CSS class instead of env(safe-area-inset-bottom)
  - placeholder: Uses fixed height via CSS class instead of getBoundingClientRect
  - role/tablist: Not applicable in Lynx
-->
<script setup lang="ts">
import { computed, provide, ref } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { TABBAR_KEY, type Numeric, type Interceptor } from './types';
import './index.less';

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
  placeholder: false,
  safeAreaInsetBottom: null,
  route: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Numeric];
  change: [value: Numeric];
}>();

const [, bem] = createNamespace('tabbar');

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

const tabbarClass = computed(() => [
  bem([{ fixed: props.fixed }]),
  {
    'van-hairline--top-bottom': props.border,
    'van-safe-area-bottom': enableSafeArea.value,
  },
]);

const tabbarStyle = computed(() => {
  if (props.zIndex !== undefined) {
    return { zIndex: typeof props.zIndex === 'string' ? parseInt(props.zIndex, 10) : props.zIndex };
  }
  return undefined;
});
</script>

<template>
  <view v-if="fixed && placeholder" :class="bem('placeholder')">
    <view :class="tabbarClass" :style="tabbarStyle">
      <slot />
    </view>
  </view>
  <view v-else :class="tabbarClass" :style="tabbarStyle">
    <slot />
  </view>
</template>
