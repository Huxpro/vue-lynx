<!--
  Vant Feature Parity Report (ActionBarIcon):
  - Props: 8/9 supported (icon, text, dot, badge, color, iconClass, iconPrefix, badgeProps, disabled)
    - icon: string - icon name (supports Icon component unicode/image mapping)
    - text: string - text below icon
    - dot: boolean - show red dot on icon
    - badge: string|number - badge content on icon
    - color: string - icon color
    - iconClass: accepted but unused (no CSS class in Lynx)
    - iconPrefix: accepted but unused (no icon font in Lynx)
    - badgeProps: Partial<BadgeProps> - extra badge config
    - disabled: boolean - disable click
    - Missing: route-related props (to, url, replace) - no router in Lynx
  - Events: 1/1 supported (click)
  - Slots: 2/2 supported (default for text, icon for custom icon)
  - Lynx Adaptations:
    - Uses Icon component with Badge integration for dot/badge display
    - No router navigation (Lynx has no vue-router)
  - Gaps:
    - No route navigation (to, url, replace props)
    - iconClass/iconPrefix accepted for API compat but no-op
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';

export interface ActionBarIconProps {
  icon?: string;
  text?: string;
  dot?: boolean;
  badge?: string | number;
  color?: string;
  iconClass?: string;
  iconPrefix?: string;
  badgeProps?: Partial<BadgeProps>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<ActionBarIconProps>(), {
  icon: '',
  text: '',
  dot: false,
  color: '#323233',
  disabled: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const slots = useSlots();

function onTap(event: any) {
  if (props.disabled) return;
  emit('click', event);
}

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minWidth: 48,
  height: 50,
  paddingLeft: 4,
  paddingRight: 4,
  opacity: props.disabled ? 0.5 : 1,
}));

const textStyle = computed(() => ({
  fontSize: 10,
  color: props.color,
  marginTop: 4,
}));
</script>

<template>
  <view :style="containerStyle" @tap="onTap">
    <!-- Custom icon slot with Badge wrapper -->
    <Badge
      v-if="$slots.icon"
      :dot="dot"
      :content="badge"
      v-bind="badgeProps"
    >
      <slot name="icon" />
    </Badge>
    <!-- Default: use Icon component -->
    <Icon
      v-else
      :name="icon"
      :size="18"
      :color="color"
      :dot="dot"
      :badge="badge"
      :badge-props="badgeProps"
    />
    <text v-if="$slots.default || text" :style="textStyle">
      <slot>{{ text }}</slot>
    </text>
  </view>
</template>
