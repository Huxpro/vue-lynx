<!--
  Lynx Limitations:
  - to/url/replace: Lynx has no vue-router or browser navigation; props accepted for API compat
  - role/tabindex/aria-selected: Not applicable in Lynx (no ARIA)
  - :active pseudo-class: Uses touchstart/touchend with --active BEM class
  - ::before pseudo-element: Uses explicit <view> element for selected border
  - ::after hairline border: Uses border-bottom 0.5px in CSS
-->
<script setup lang="ts">
import { computed, inject, ref } from 'vue-lynx';
import { createNamespace } from '../../utils';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import { SIDEBAR_KEY } from '../Sidebar/types';
import './index.less';

const [, bem] = createNamespace('sidebar-item');

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

const itemClass = computed(() =>
  bem([
    { select: isActive.value, disabled: props.disabled, active: pressed.value },
  ]),
);
</script>

<template>
  <view
    :class="itemClass"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <view v-if="isActive" :class="bem('selected-bar')" />
    <Badge
      :dot="dot"
      :content="badge"
      v-bind="badgeProps"
    >
      <view :class="bem('text')">
        <slot name="title">
          <text>{{ title }}</text>
        </slot>
      </view>
    </Badge>
  </view>
</template>
