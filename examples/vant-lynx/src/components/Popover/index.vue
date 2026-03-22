<!--
  Lynx Limitations:
  - teleport: No Teleport support in Lynx
  - overlay: Transparent overlay used for click-away detection (no Popup overlay)
  - Popper.js: No smart positioning / auto-flip; uses CSS absolute positioning
  - touchstart event: Lynx uses tap events; click-away uses transparent overlay tap
  - data-popper-placement: Lynx has no attribute selectors; uses BEM placement modifier classes
  - :active pseudo-class: Uses --active BEM class via touchstart/touchend
  - cursor: Not applicable in Lynx (touch-only)
  - role/tabindex/aria: Not applicable in Lynx
  - box-shadow: Omitted (Lynx may not support)
  - closeOnPopstate: No browser history in Lynx
  - Vue <Transition>: Uses CSS transitions directly (inline style toggle)
-->
<script setup lang="ts">
import { computed, ref, watch, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import Icon from '../Icon/index.vue';
import './index.less';

import type {
  PopoverTheme,
  PopoverActionsDirection,
  PopoverTrigger,
  PopoverPlacement,
  PopoverAction,
} from './types';

export type { PopoverAction, PopoverPlacement, PopoverTheme };

const [name, bem] = createNamespace('popover');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    theme?: PopoverTheme;
    overlay?: boolean;
    actions?: PopoverAction[];
    actionsDirection?: PopoverActionsDirection;
    trigger?: PopoverTrigger;
    duration?: number | string;
    showArrow?: boolean;
    placement?: PopoverPlacement;
    iconPrefix?: string;
    overlayClass?: string;
    overlayStyle?: Record<string, any>;
    closeOnClickAction?: boolean;
    closeOnClickOverlay?: boolean;
    closeOnClickOutside?: boolean;
    offset?: [number, number];
    teleport?: string;
  }>(),
  {
    show: false,
    theme: 'light',
    overlay: false,
    actions: () => [],
    actionsDirection: 'vertical',
    trigger: 'click',
    showArrow: true,
    placement: 'bottom',
    closeOnClickAction: true,
    closeOnClickOverlay: true,
    closeOnClickOutside: true,
    offset: () => [0, 8] as [number, number],
    teleport: 'body',
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [action: PopoverAction, index: number];
}>();

const slots = useSlots();

// Internal show state synced with prop
const isVisible = ref(props.show);
watch(
  () => props.show,
  (val) => {
    isVisible.value = val;
  },
);

// Zoom animation state
const animating = ref(false);
const displayed = ref(props.show);

watch(isVisible, (val) => {
  if (val) {
    displayed.value = true;
    // Start enter animation on next tick
    requestAnimationFrame(() => {
      animating.value = true;
    });
  } else {
    animating.value = false;
    // Wait for leave animation to complete
    const dur = typeof props.duration === 'number' ? props.duration * 1000 : 150;
    setTimeout(() => {
      if (!isVisible.value) {
        displayed.value = false;
      }
    }, dur);
  }
});

// Initialize displayed state
if (props.show) {
  displayed.value = true;
  animating.value = true;
}

const updateShow = (value: boolean) => {
  isVisible.value = value;
  emit('update:show', value);
};

const onClickWrapper = () => {
  if (props.trigger === 'click') {
    updateShow(!isVisible.value);
  }
};

const onClickAction = (action: PopoverAction, index: number) => {
  if (action.disabled) return;
  emit('select', action, index);
  if (props.closeOnClickAction) {
    updateShow(false);
  }
};

const onClickAway = () => {
  if (isVisible.value && props.closeOnClickOutside) {
    updateShow(false);
  }
};

// Active state tracking for action press feedback
const activeIndex = ref(-1);
const onActionTouchStart = (index: number, action: PopoverAction) => {
  if (!action.disabled) activeIndex.value = index;
};
const onActionTouchEnd = () => {
  activeIndex.value = -1;
};

// Popover position styles (CSS absolute positioning, no Popper.js)
const popoverPositionStyle = computed(() => {
  const pos: Record<string, any> = {
    position: 'absolute',
    zIndex: 2000,
  };

  const [offsetX, offsetY] = props.offset;

  const placement = props.placement;

  if (placement.startsWith('bottom')) {
    pos.top = '100%';
    pos.marginTop = addUnit(offsetY);
  } else if (placement.startsWith('top')) {
    pos.bottom = '100%';
    pos.marginBottom = addUnit(offsetY);
  } else if (placement.startsWith('left')) {
    pos.right = '100%';
    pos.marginRight = addUnit(offsetX || offsetY);
  } else if (placement.startsWith('right')) {
    pos.left = '100%';
    pos.marginLeft = addUnit(offsetX || offsetY);
  }

  // Horizontal alignment within placement
  if (placement.endsWith('-start')) {
    pos.left = addUnit(offsetX);
  } else if (placement.endsWith('-end')) {
    pos.right = addUnit(offsetX);
  } else if (placement === 'top' || placement === 'bottom') {
    // Center: no horizontal offset by default
    pos.left = addUnit(offsetX);
  } else if (placement === 'left' || placement === 'right') {
    pos.top = '0px';
  }

  return pos;
});

// Zoom animation style
const zoomStyle = computed(() => {
  if (!displayed.value) return { opacity: 0, transform: 'scale(0.8)' };
  if (animating.value) {
    return {
      opacity: 1,
      transform: 'scale(1)',
      transitionProperty: 'opacity, transform',
      transitionDuration: '0.15s',
      transitionTimingFunction: 'ease-out',
    };
  }
  return {
    opacity: 0,
    transform: 'scale(0.8)',
    transitionProperty: 'opacity, transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in',
  };
});

// Root class: van-popover van-popover--{theme} van-popover--placement-{placement}
const rootClass = computed(() =>
  bem([props.theme, `placement-${props.placement}`]),
);

// Action border: vertical uses bottom border, horizontal uses right border
const getActionBorderStyle = (index: number): Record<string, any> | undefined => {
  if (index >= props.actions.length - 1) return undefined;
  if (props.actionsDirection === 'horizontal') {
    return {
      borderRightWidth: '0.5px',
      borderRightStyle: 'solid',
      borderRightColor: props.theme === 'dark' ? 'var(--van-gray-7, #646566)' : 'var(--van-border-color, #ebedf0)',
    };
  }
  return undefined;
};

// Action text border (vertical: bottom border on action-text, matching Vant's ::after)
const getActionTextBorderStyle = (index: number): Record<string, any> | undefined => {
  if (props.actionsDirection !== 'vertical') return undefined;
  if (index >= props.actions.length - 1) return undefined;
  return {
    borderBottomWidth: '0.5px',
    borderBottomStyle: 'solid',
    borderBottomColor: props.theme === 'dark' ? 'var(--van-gray-7, #646566)' : 'var(--van-border-color, #ebedf0)',
  };
};

const hasCustomContent = computed(() => !!slots.default);
</script>

<template>
  <!-- Transparent overlay for click-away detection -->
  <view
    v-if="displayed && closeOnClickOutside"
    :style="{
      position: 'fixed',
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      zIndex: 1999,
      backgroundColor: 'transparent',
    }"
    @tap="onClickAway"
  />

  <view :style="{ position: 'relative' }">
    <!-- Wrapper / reference trigger -->
    <view :class="bem('wrapper')" @tap="onClickWrapper">
      <slot name="reference" />
    </view>

    <!-- Popover body -->
    <view
      v-if="displayed"
      :class="rootClass"
      :style="{ ...popoverPositionStyle, ...zoomStyle }"
    >
      <!-- Arrow -->
      <view v-if="showArrow" :class="bem('arrow')" />

      <!-- Content -->
      <view :class="bem('content', actionsDirection === 'horizontal' ? 'horizontal' : '')">
        <template v-if="hasCustomContent">
          <slot />
        </template>
        <template v-else>
          <view
            v-for="(action, index) in actions"
            :key="index"
            :class="[
              bem('action', {
                disabled: !!action.disabled,
                'with-icon': !!action.icon,
                active: activeIndex === index && !action.disabled,
              }),
              action.className,
            ]"
            :style="{ color: action.color, ...getActionBorderStyle(index) }"
            @tap="onClickAction(action, index)"
            @touchstart="onActionTouchStart(index, action)"
            @touchend="onActionTouchEnd"
            @touchcancel="onActionTouchEnd"
          >
            <slot name="action" :action="action" :index="index">
              <Icon
                v-if="action.icon"
                :name="action.icon"
                :class-prefix="iconPrefix"
                :class="bem('action-icon')"
              />
              <view
                :class="bem('action-text')"
                :style="getActionTextBorderStyle(index)"
              >
                <text>{{ action.text }}</text>
              </view>
            </slot>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>
