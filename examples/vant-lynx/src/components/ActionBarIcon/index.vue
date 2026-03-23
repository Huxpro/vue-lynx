<!--
  Lynx Limitations:
  - to/url/replace: No vue-router in Lynx; route props accepted for API compat but no-op
  - role/tabindex: No ARIA attributes in Lynx
  - :active pseudo-class: Lynx has no :active; active feedback not implemented
  - cursor: Not applicable in Lynx
-->
<script setup lang="ts">
import { inject } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Icon from '../Icon/index.vue';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/types';
import { ACTION_BAR_KEY } from '../ActionBar/types';
import './index.less';

export interface ActionBarIconProps {
  dot?: boolean;
  text?: string;
  icon?: string;
  color?: string;
  badge?: string | number;
  iconClass?: string | unknown;
  badgeProps?: Partial<BadgeProps>;
  iconPrefix?: string;
  disabled?: boolean;
  to?: string | Record<string, unknown>;
  url?: string;
  replace?: boolean;
}

const props = withDefaults(defineProps<ActionBarIconProps>(), {
  dot: false,
  disabled: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const [, bem] = createNamespace('action-bar-icon');

const parent = inject(ACTION_BAR_KEY, null);
if (parent) {
  parent.registerChild({ isButton: false });
}

function onTap(event: any) {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <view
    :class="bem([{ disabled }])"
    @tap="onTap"
  >
    <!-- Custom icon slot with Badge wrapper -->
    <Badge
      v-if="$slots.icon"
      :dot="dot"
      :content="badge"
      :class="bem('icon')"
      v-bind="badgeProps"
    >
      <template #default>
        <slot name="icon" />
      </template>
    </Badge>
    <!-- Default: use Icon component -->
    <Icon
      v-else
      :name="icon"
      :dot="dot"
      :badge="badge"
      :color="color"
      :class="[bem('icon'), iconClass]"
      :badge-props="badgeProps"
      :class-prefix="iconPrefix"
    />
    <text v-if="$slots.default || text" class="van-action-bar-icon__text">
      <slot>{{ text }}</slot>
    </text>
  </view>
</template>
