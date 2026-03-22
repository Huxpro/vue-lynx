<!--
  Lynx Limitations:
  - to: Lynx has no vue-router; prop accepted for API compatibility but ignored
  - url: Lynx has no browser navigation; prop accepted for API compatibility but ignored
  - replace: Lynx has no navigation; prop accepted for API compatibility but ignored
  - route matching: No route-based active detection (Lynx has no router)
  - role/tabindex/aria-selected: Not applicable in Lynx
  - CSS variable theming: Lynx uses inline styles instead of CSS custom properties
-->
<script setup lang="ts">
import { computed, inject, ref } from 'vue-lynx';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import Icon from '../Icon/index.vue';
import { TABBAR_KEY, type Numeric } from '../Tabbar/types';

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

const tabbar = inject(TABBAR_KEY)!;

// Auto-index: assign an index if name prop is not provided (matches Vant behavior)
const index = ref(tabbar?.getNextIndex ? tabbar.getNextIndex() : 0);

const identifier = computed(() => {
  return props.name ?? index.value;
});

const isActive = computed(() => {
  return tabbar.props.modelValue === identifier.value;
});

const itemColor = computed(() => {
  const { activeColor, inactiveColor } = tabbar.props;
  if (isActive.value) {
    return activeColor || '#1989fa';
  }
  return inactiveColor || '#323233';
});

function onTap(event: any) {
  if (!isActive.value) {
    tabbar.setActive(identifier.value, () => {});
  }
  emit('click', event);
}

const mergedBadgeProps = computed(() => ({
  dot: props.dot,
  content: props.badge,
  ...(props.badgeProps || {}),
}));

const itemStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  height: '50px',
  cursor: 'pointer',
  backgroundColor: isActive.value ? '#fff' : 'transparent',
}));

const iconWrapperStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginBottom: '4px',
}));

const textStyle = computed(() => ({
  fontSize: '12px',
  color: itemColor.value,
  lineHeight: '1',
}));
</script>

<template>
  <view :style="itemStyle" @tap="onTap">
    <Badge
      :dot="mergedBadgeProps.dot"
      :content="mergedBadgeProps.content"
      :color="mergedBadgeProps.color"
      :max="mergedBadgeProps.max"
      :show-zero="mergedBadgeProps.showZero"
      :offset="mergedBadgeProps.offset"
      :position="mergedBadgeProps.position"
    >
      <view :style="iconWrapperStyle">
        <slot name="icon" :active="isActive">
          <Icon
            v-if="icon"
            :name="icon"
            :class-prefix="iconPrefix"
            :size="22"
            :color="itemColor"
          />
        </slot>
      </view>
    </Badge>
    <text :style="textStyle">
      <slot :active="isActive" />
    </text>
  </view>
</template>
