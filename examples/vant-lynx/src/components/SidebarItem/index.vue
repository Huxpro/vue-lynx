<!--
  Lynx Limitations:
  - to: Lynx has no vue-router; prop accepted for API compatibility but ignored
  - url: Lynx has no browser navigation; prop accepted for API compatibility but ignored
  - replace: Lynx has no navigation; prop accepted for API compatibility but ignored
  - role/tabindex/aria-selected: Not applicable in Lynx
  - :active pseudo-class: Uses touchstart/touchend opacity feedback
  - ::before pseudo-element: Uses explicit view element for selected border
  - ::after pseudo-element border-bottom: Not applicable in Lynx
  - CSS variable theming: Lynx uses inline styles instead of CSS custom properties
-->
<script setup lang="ts">
import { computed, inject, ref } from 'vue-lynx';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import { SIDEBAR_KEY } from '../Sidebar/types';

export interface SidebarItemProps {
  title?: string;
  dot?: boolean;
  badge?: string | number;
  disabled?: boolean;
  badgeProps?: Partial<BadgeProps>;
  to?: string | Record<string, any>;
  url?: string;
  replace?: boolean;
}

const props = withDefaults(defineProps<SidebarItemProps>(), {
  title: '',
  dot: false,
  disabled: false,
  replace: false,
});

const emit = defineEmits<{
  click: [index: number];
}>();

const parent = inject(SIDEBAR_KEY);

if (!parent) {
  console.error('[Vant] <SidebarItem> must be a child of <Sidebar>');
}

const index = ref(parent?.getNextIndex() ?? 0);

const isActive = computed(() => {
  return parent ? parent.getActive() === index.value : false;
});

const pressed = ref(false);

function onTouchStart() {
  if (!props.disabled) {
    pressed.value = true;
  }
}

function onTouchEnd() {
  pressed.value = false;
}

function onTap() {
  if (props.disabled) return;
  emit('click', index.value);
  parent?.setActive(index.value);
}

const itemStyle = computed(() => {
  let backgroundColor: string;
  if (isActive.value) {
    backgroundColor = '#fff';
  } else if (pressed.value && !props.disabled) {
    backgroundColor = '#f2f3f5';
  } else {
    backgroundColor = '#f7f8fa';
  }

  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '12px',
    paddingRight: '12px',
    backgroundColor,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    overflow: 'hidden',
  };
});

const activeBarStyle = computed(() => ({
  position: 'absolute' as const,
  left: '0px',
  top: '50%',
  width: '4px',
  height: '16px',
  marginTop: '-8px',
  backgroundColor: '#1989fa',
  borderRadius: '0px',
}));

const textStyle = computed(() => ({
  fontSize: '14px',
  lineHeight: '20px',
  color: props.disabled ? '#c8c9cc' : '#323233',
  fontWeight: isActive.value ? 'bold' : ('normal' as const),
  wordBreak: 'break-all' as const,
}));
</script>

<template>
  <view
    :style="itemStyle"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
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
  </view>
</template>
