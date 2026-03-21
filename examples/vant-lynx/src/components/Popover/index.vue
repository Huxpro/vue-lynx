<!--
  Vant Feature Parity Report:
  - Props: 8/14 supported (show, actions, placement, theme, trigger, offset, showArrow, closeOnClickAction, closeOnClickOutside; missing: overlay, duration, teleport, overlayStyle, overlayClass, closeOnClickOverlay, iconPrefix, actionsDirection)
  - Events: 2/3 supported (update:show, select; missing: touchstart)
  - Slots: 2/3 supported (default, content; missing: action)
  - Gaps: no Popper.js positioning (uses CSS absolute), no teleport, no overlay, no actionsDirection, no iconPrefix, no action slot
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';

export interface PopoverAction {
  text: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
  className?: string;
}

export interface PopoverProps {
  show?: boolean;
  actions?: PopoverAction[];
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right';
  theme?: 'light' | 'dark';
  trigger?: 'manual';
  offset?: number[];
  showArrow?: boolean;
  closeOnClickAction?: boolean;
  closeOnClickOutside?: boolean;
}

const props = withDefaults(defineProps<PopoverProps>(), {
  show: false,
  actions: () => [],
  placement: 'bottom',
  theme: 'light',
  trigger: 'manual',
  offset: () => [0, 8],
  showArrow: true,
  closeOnClickAction: true,
  closeOnClickOutside: true,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [action: PopoverAction, index: number];
}>();

const isVisible = ref(props.show);

watch(
  () => props.show,
  (val) => {
    isVisible.value = val;
  },
);

function togglePopover() {
  const next = !isVisible.value;
  isVisible.value = next;
  emit('update:show', next);
}

function onSelectAction(action: PopoverAction, index: number) {
  if (action.disabled) return;
  emit('select', action, index);
  if (props.closeOnClickAction) {
    isVisible.value = false;
    emit('update:show', false);
  }
}

function onTapOutside() {
  if (props.closeOnClickOutside && isVisible.value) {
    isVisible.value = false;
    emit('update:show', false);
  }
}

const isDark = computed(() => props.theme === 'dark');

const popoverBgColor = computed(() => (isDark.value ? '#4a4a4a' : '#fff'));
const popoverTextColor = computed(() => (isDark.value ? '#fff' : '#323233'));

const popoverPosition = computed(() => {
  const pos: Record<string, any> = {
    position: 'absolute',
    zIndex: 100,
  };

  const offsetX = props.offset[0] || 0;
  const offsetY = props.offset[1] || 8;

  const placement = props.placement;

  if (placement.startsWith('bottom')) {
    pos.top = '100%';
    pos.marginTop = offsetY;
  } else if (placement.startsWith('top')) {
    pos.bottom = '100%';
    pos.marginBottom = offsetY;
  } else if (placement === 'left') {
    pos.right = '100%';
    pos.marginRight = offsetX || 8;
    pos.top = 0;
  } else if (placement === 'right') {
    pos.left = '100%';
    pos.marginLeft = offsetX || 8;
    pos.top = 0;
  }

  if (placement.endsWith('-start')) {
    pos.left = offsetX;
  } else if (placement.endsWith('-end')) {
    pos.right = offsetX;
  } else if (placement === 'top' || placement === 'bottom') {
    pos.left = offsetX;
  }

  return pos;
});

const popoverStyle = computed(() => ({
  ...popoverPosition.value,
  backgroundColor: popoverBgColor.value,
  borderRadius: 8,
  minWidth: 130,
  overflow: 'hidden',
  borderWidth: isDark.value ? 0 : 0.5,
  borderStyle: 'solid' as const,
  borderColor: '#ebedf0',
  display: 'flex',
  flexDirection: 'column' as const,
}));

const arrowStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 101,
  };

  const placement = props.placement;

  if (placement.startsWith('bottom')) {
    base.top = '100%';
    base.marginTop = (props.offset[1] || 8) - 6;
    base.borderLeftWidth = 6;
    base.borderRightWidth = 6;
    base.borderBottomWidth = 6;
    base.borderTopWidth = 0;
    base.borderLeftColor = 'transparent';
    base.borderRightColor = 'transparent';
    base.borderBottomColor = popoverBgColor.value;
    base.borderStyle = 'solid';
    if (placement === 'bottom') base.left = 20;
    else if (placement === 'bottom-end') base.right = 20;
    else base.left = 20;
  } else if (placement.startsWith('top')) {
    base.bottom = '100%';
    base.marginBottom = (props.offset[1] || 8) - 6;
    base.borderLeftWidth = 6;
    base.borderRightWidth = 6;
    base.borderTopWidth = 6;
    base.borderBottomWidth = 0;
    base.borderLeftColor = 'transparent';
    base.borderRightColor = 'transparent';
    base.borderTopColor = popoverBgColor.value;
    base.borderStyle = 'solid';
    if (placement === 'top') base.left = 20;
    else if (placement === 'top-end') base.right = 20;
    else base.left = 20;
  }

  return base;
});

function getActionStyle(action: PopoverAction, index: number) {
  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 10,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: index < props.actions.length - 1 ? 0.5 : 0,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: isDark.value ? 'rgba(255,255,255,0.1)' : '#ebedf0',
    opacity: action.disabled ? 0.5 : 1,
  };
}
</script>

<template>
  <!-- Overlay for outside clicks -->
  <view
    v-if="isVisible && closeOnClickOutside"
    :style="{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 98,
      backgroundColor: 'transparent',
    }"
    @tap="onTapOutside"
  />

  <view :style="{ position: 'relative', display: 'flex', flexDirection: 'column' }">
    <!-- Reference element (trigger) -->
    <view @tap="togglePopover">
      <slot />
    </view>

    <!-- Arrow -->
    <view v-if="isVisible && showArrow" :style="arrowStyle" />

    <!-- Popover content -->
    <view v-if="isVisible" :style="popoverStyle">
      <slot name="content">
        <view
          v-for="(action, index) in actions"
          :key="index"
          :style="getActionStyle(action, index)"
          @tap.stop="onSelectAction(action, index)"
        >
          <text
            v-if="action.icon"
            :style="{ fontSize: 16, marginRight: 8, color: action.color || popoverTextColor }"
          >{{ action.icon }}</text>
          <text :style="{ fontSize: 14, color: action.color || popoverTextColor }">{{ action.text }}</text>
        </view>
      </slot>
    </view>
  </view>
</template>
