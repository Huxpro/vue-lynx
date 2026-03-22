<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - closeOnPopstate: accepted for API compat but no browser history API in Lynx
  - lockScroll: accepted for API compat but no document.body scroll in Lynx
  - <button> tag: uses <view> instead (Lynx has no HTML tags)
  - ::after hairline: uses border-bottom 0.5px instead
  - :active pseudo-class: uses touchstart/touchend + --active BEM class
  - cursor: not applicable in Lynx
  - overflow-y: auto: uses scroll-view for scrollable content
  - HAPTICS_FEEDBACK: not available in Lynx
-->
<script setup lang="ts">
import { computed, nextTick } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Popup from '../Popup/index.vue';
import Icon from '../Icon/index.vue';
import Loading from '../Loading/index.vue';
import type { ActionSheetAction } from './types';
import './index.less';

const [, bem] = createNamespace('action-sheet');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    title?: string;
    round?: boolean;
    actions?: ActionSheetAction[];
    closeIcon?: string;
    closeable?: boolean;
    cancelText?: string;
    description?: string;
    closeOnPopstate?: boolean;
    closeOnClickAction?: boolean;
    safeAreaInsetBottom?: boolean;
    // Popup shared props
    zIndex?: number | string;
    overlay?: boolean;
    duration?: number | string;
    lockScroll?: boolean;
    lazyRender?: boolean;
    beforeClose?: (...args: any[]) => boolean | Promise<boolean>;
    overlayProps?: Record<string, any>;
    overlayStyle?: Record<string, any>;
    overlayClass?: string | string[] | Record<string, boolean>;
    transitionAppear?: boolean;
    closeOnClickOverlay?: boolean;
    teleport?: string | object;
  }>(),
  {
    show: false,
    round: true,
    actions: () => [],
    closeIcon: 'cross',
    closeable: true,
    closeOnClickAction: false,
    safeAreaInsetBottom: true,
    overlay: true,
    closeOnClickOverlay: true,
    lockScroll: true,
    lazyRender: true,
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [action: ActionSheetAction, index: number];
  cancel: [];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [event: any];
}>();

const slots = defineSlots<{
  default?: () => any;
  description?: () => any;
  cancel?: () => any;
  action?: (props: { action: ActionSheetAction; index: number }) => any;
}>();

const updateShow = (show: boolean) => emit('update:show', show);

const onCancel = () => {
  updateShow(false);
  emit('cancel');
};

const onClickAction = (action: ActionSheetAction, index: number) => {
  if (action.disabled || action.loading) return;

  if (action.callback) {
    action.callback(action);
  }

  if (props.closeOnClickAction) {
    updateShow(false);
  }

  nextTick(() => emit('select', action, index));
};

const popupProps = computed(() => ({
  show: props.show,
  position: 'bottom' as const,
  round: props.round,
  closeable: false, // ActionSheet handles its own close icon
  closeOnPopstate: props.closeOnPopstate,
  safeAreaInsetBottom: props.safeAreaInsetBottom,
  zIndex: props.zIndex,
  overlay: props.overlay,
  duration: props.duration,
  lockScroll: props.lockScroll,
  lazyRender: props.lazyRender,
  beforeClose: props.beforeClose,
  overlayProps: props.overlayProps,
  overlayStyle: props.overlayStyle,
  overlayClass: props.overlayClass,
  transitionAppear: props.transitionAppear,
  closeOnClickOverlay: props.closeOnClickOverlay,
  teleport: props.teleport,
}));
</script>

<template>
  <Popup
    v-bind="popupProps"
    @update:show="updateShow"
    @open="emit('open')"
    @close="emit('close')"
    @opened="emit('opened')"
    @closed="emit('closed')"
    @click-overlay="(e: any) => emit('click-overlay', e)"
  >
    <view :class="bem()">
      <!-- Header -->
      <view v-if="title" :class="bem('header')">
        <text>{{ title }}</text>
        <view
          v-if="closeable"
          :class="bem('close')"
          @tap="onCancel"
        >
          <Icon :name="closeIcon" />
        </view>
      </view>

      <!-- Description -->
      <view v-if="description || $slots.description" :class="bem('description')">
        <template v-if="$slots.description">
          <slot name="description" />
        </template>
        <text v-else>{{ description }}</text>
      </view>

      <!-- Content (actions + default slot) -->
      <scroll-view scroll-orientation="vertical" :class="bem('content')">
        <view
          v-for="(action, index) in actions"
          :key="index"
          :class="[
            bem('item', { loading: !!action.loading, disabled: !!action.disabled }),
            action.className,
          ]"
          :style="action.color ? { color: action.color } : undefined"
          @tap="() => onClickAction(action, index)"
        >
          <!-- Action icon -->
          <Icon
            v-if="action.icon"
            :name="action.icon"
            :class="bem('item-icon')"
          />
          <!-- Loading state -->
          <Loading v-if="action.loading" :class="bem('loading-icon')" />
          <!-- Scoped action slot -->
          <template v-else-if="$slots.action">
            <slot name="action" :action="action" :index="index" />
          </template>
          <!-- Default action content -->
          <template v-else>
            <text :class="bem('name')">{{ action.name }}</text>
            <text v-if="action.subname" :class="bem('subname')">{{ action.subname }}</text>
          </template>
        </view>
        <slot />
      </scroll-view>

      <!-- Cancel button -->
      <template v-if="cancelText || $slots.cancel">
        <view :class="bem('gap')" />
        <view :class="bem('cancel')" @tap="onCancel">
          <template v-if="$slots.cancel">
            <slot name="cancel" />
          </template>
          <text v-else>{{ cancelText }}</text>
        </view>
      </template>
    </view>
  </Popup>
</template>
