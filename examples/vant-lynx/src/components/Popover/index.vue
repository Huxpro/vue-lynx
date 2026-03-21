<!--
  Vant Popover - Feature Parity Report
  ======================================
  Vant Source: packages/vant/src/popover/Popover.tsx

  Props (12/14 supported):
    - show: boolean                      [YES]
    - actions: PopoverAction[]           [YES]
    - placement: PopoverPlacement        [YES] (8 placements)
    - theme: 'light' | 'dark'           [YES]
    - trigger: 'click' | 'manual'       [YES] added 'click' support
    - offset: [number, number]           [YES]
    - showArrow: boolean                 [YES]
    - closeOnClickAction: boolean        [YES]
    - closeOnClickOutside: boolean       [YES]
    - actionsDirection: 'vertical' | 'horizontal'  [YES] added
    - iconPrefix: string                 [NO] Lynx uses unicode icon mapping
    - overlay: boolean                   [NO] Lynx uses transparent overlay for outside clicks
    - duration: number                   [NO] no CSS transition in Lynx
    - teleport: TeleportProps['to']      [NO] Lynx has no teleport
    - overlayStyle / overlayClass        [NO] no CSS classes

  Events (2/3 supported):
    - update:show                        [YES]
    - select                             [YES]
    - touchstart                         [NO] Lynx uses tap events

  Slots (3/3 supported):
    - default (reference/trigger)        [YES]
    - content                            [YES]
    - action                             [YES] added

  Lynx Adaptations:
    - No Popper.js; uses CSS absolute positioning relative to trigger element.
    - Action icons rendered via Icon component (unicode mapping) instead of icon fonts.
    - Uses transparent fixed overlay for outside-click detection instead of
      useClickAway composable.
    - Uses `display: 'flex'` explicitly on all flex containers.
    - actionsDirection: 'horizontal' lays actions out in a row.

  Gaps:
    - No Popper.js smart positioning (no auto-flip or boundary detection)
    - No teleport support
    - No overlay background (transparent overlay only for click-away)
    - No CSS transition animation for show/hide
    - No touchstart event (Lynx uses tap)
-->
<script setup lang="ts">
import { computed, ref, watch, useSlots } from 'vue-lynx';
import Icon from '../Icon/index.vue';

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
  trigger?: 'click' | 'manual';
  offset?: number[];
  showArrow?: boolean;
  closeOnClickAction?: boolean;
  closeOnClickOutside?: boolean;
  actionsDirection?: 'vertical' | 'horizontal';
}

const props = withDefaults(defineProps<PopoverProps>(), {
  show: false,
  actions: () => [],
  placement: 'bottom',
  theme: 'light',
  trigger: 'click',
  offset: () => [0, 8],
  showArrow: true,
  closeOnClickAction: true,
  closeOnClickOutside: true,
  actionsDirection: 'vertical',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [action: PopoverAction, index: number];
}>();

const slots = useSlots();

const isVisible = ref(props.show);

watch(
  () => props.show,
  (val) => {
    isVisible.value = val;
  },
);

function togglePopover() {
  if (props.trigger === 'click') {
    const next = !isVisible.value;
    isVisible.value = next;
    emit('update:show', next);
  }
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
const isHorizontal = computed(() => props.actionsDirection === 'horizontal');

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
  flexDirection: isHorizontal.value ? ('row' as const) : ('column' as const),
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
  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 10,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'transparent',
    opacity: action.disabled ? 0.5 : 1,
  };

  if (isHorizontal.value) {
    // Horizontal: right border between items
    style.borderRightWidth = index < props.actions.length - 1 ? 0.5 : 0;
    style.borderRightStyle = 'solid';
    style.borderRightColor = isDark.value ? 'rgba(255,255,255,0.1)' : '#ebedf0';
  } else {
    // Vertical: bottom border between items
    style.borderBottomWidth = index < props.actions.length - 1 ? 0.5 : 0;
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = isDark.value ? 'rgba(255,255,255,0.1)' : '#ebedf0';
  }

  return style;
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
          <slot name="action" :action="action" :index="index">
            <Icon
              v-if="action.icon"
              :name="action.icon"
              :size="20"
              :color="action.color || popoverTextColor"
              :style="{ marginRight: 8 }"
            />
            <text :style="{ fontSize: 14, color: action.color || popoverTextColor }">{{ action.text }}</text>
          </slot>
        </view>
      </slot>
    </view>
  </view>
</template>
