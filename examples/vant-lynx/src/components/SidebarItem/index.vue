<!--
  Vant Feature Parity Report (SidebarItem):
  - Props: 5/6 supported (title, dot, badge, disabled, badgeProps, index)
    - title: string - item title text
    - dot: boolean - show red dot indicator
    - badge: string|number - badge content
    - disabled: boolean - disable interaction
    - badgeProps: Partial<BadgeProps> - extra badge config
    - index: number - item index (Vant auto-detects via useParent; here must be passed manually)
    - Missing: route-related props (to, url, replace) - no router in Lynx
  - Events: 1/1 supported (click)
  - Slots: 2/2 supported (default, title)
    - default: extra content after title
    - title: custom title content (replaces title prop text)
  - Lynx Adaptations:
    - Uses Badge component for dot/badge display (aligned with Vant source)
    - Active bar indicator via absolute-positioned view
    - No router navigation
  - Gaps:
    - No route navigation (to, url, replace props)
    - index must be manually provided (no auto-indexing)
    - No role/tabindex/aria attributes (Lynx limitation)
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';

export interface SidebarItemProps {
  title?: string;
  dot?: boolean;
  badge?: string | number;
  disabled?: boolean;
  badgeProps?: Partial<BadgeProps>;
  index?: number;
}

const props = withDefaults(defineProps<SidebarItemProps>(), {
  title: '',
  dot: false,
  disabled: false,
  index: 0,
});

const emit = defineEmits<{
  click: [index: number];
}>();

const sidebar = inject<{
  modelValue: Ref<number>;
  setActive: (index: number) => void;
}>('sidebar')!;

const isActive = computed(() => {
  return sidebar.modelValue.value === props.index;
});

function onTap() {
  if (props.disabled) return;
  sidebar.setActive(props.index);
  emit('click', props.index);
}

const itemStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  position: 'relative' as const,
  paddingTop: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: isActive.value ? '#fff' : 'transparent',
  opacity: props.disabled ? 0.5 : 1,
}));

const activeBarStyle = computed(() => ({
  position: 'absolute' as const,
  left: 0,
  top: '50%',
  width: 3,
  height: 16,
  marginTop: -8,
  backgroundColor: '#ee0a24',
  borderRadius: 2,
}));

const textStyle = computed(() => ({
  fontSize: 14,
  color: '#323233',
  fontWeight: isActive.value ? 'bold' : ('normal' as any),
}));
</script>

<template>
  <view :style="itemStyle" @tap="onTap">
    <view v-if="isActive" :style="activeBarStyle" />
    <Badge
      :dot="dot"
      :content="badge"
      v-bind="badgeProps"
    >
      <slot name="title">
        <text :style="textStyle">{{ title }}</text>
      </slot>
    </Badge>
    <slot />
  </view>
</template>
