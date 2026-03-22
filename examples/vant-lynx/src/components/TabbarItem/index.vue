<!--
  Lynx Limitations:
  - to/url/replace: Lynx has no vue-router or browser navigation; props accepted for API compat
  - route matching: No route-based active detection (Lynx has no router)
  - role/tabindex/aria-selected: Not applicable in Lynx
  - cursor:pointer: Not applicable (Lynx is touch-only)
-->
<script setup lang="ts">
import { computed, inject, ref } from 'vue-lynx';
import { createNamespace } from '../../utils';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import Icon from '../Icon/index.vue';
import { TABBAR_KEY, type Numeric } from '../Tabbar/types';
import './index.less';

export interface TabbarItemProps {
  name?: Numeric;
  icon?: string;
  iconPrefix?: string;
  dot?: boolean;
  badge?: Numeric;
  badgeProps?: Partial<BadgeProps>;
  to?: string | Record<string, any>;
  url?: string;
  replace?: boolean;
}

const props = withDefaults(defineProps<TabbarItemProps>(), {
  dot: false,
  replace: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const [, bem] = createNamespace('tabbar-item');

const tabbar = inject(TABBAR_KEY)!;

// Auto-index: assign an index if name prop is not provided (matches Vant behavior)
const index = ref(tabbar?.getNextIndex ? tabbar.getNextIndex() : 0);

const identifier = computed(() => {
  return props.name ?? index.value;
});

const isActive = computed(() => {
  return tabbar.props.modelValue === identifier.value;
});

const itemClass = computed(() => {
  return bem([{ active: isActive.value }]);
});

// Only apply inline color style when activeColor/inactiveColor is set (matching Vant)
const itemStyle = computed(() => {
  const { activeColor, inactiveColor } = tabbar.props;
  const color = isActive.value ? activeColor : inactiveColor;
  if (color) {
    return { color };
  }
  return undefined;
});

function onTap(event: any) {
  if (!isActive.value) {
    tabbar.setActive(identifier.value, () => {});
  }
  emit('click', event);
}
</script>

<template>
  <view :class="itemClass" :style="itemStyle" @tap="onTap">
    <Badge
      :dot="dot"
      :content="badge"
      :class="bem('icon')"
      v-bind="badgeProps || {}"
    >
      <slot name="icon" :active="isActive">
        <Icon
          v-if="icon"
          :name="icon"
          :class-prefix="iconPrefix"
        />
      </slot>
    </Badge>
    <view :class="bem('text')">
      <slot :active="isActive" />
    </view>
  </view>
</template>
