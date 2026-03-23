<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - ::after arrow: Lynx has no pseudo-elements; uses a <view> with border chevron
  - van-ellipsis: text-overflow not fully supported; class applied for compat
  - closeOnClickOutside: handled via overlay tap, no document-level events
-->
<script setup lang="ts">
import {
  computed,
  inject,
  reactive,
  onMounted,
  onBeforeUnmount,
  useSlots,
} from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Cell from '../Cell/index.vue';
import Icon from '../Icon/index.vue';
import type {
  DropdownMenuProvide,
  DropdownChildExpose,
} from '../DropdownMenu/types';
import { DROPDOWN_KEY } from '../DropdownMenu/types';
import type { DropdownItemOption } from './types';
import './index.less';

const [, bem] = createNamespace('dropdown-item');
const [, menuBem] = createNamespace('dropdown-menu');

const props = withDefaults(
  defineProps<{
    title?: string;
    options?: DropdownItemOption[];
    disabled?: boolean;
    teleport?: string | object;
    lazyRender?: boolean;
    modelValue?: string | number | boolean;
    titleClass?: unknown;
  }>(),
  {
    options: () => [],
    disabled: false,
    lazyRender: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean];
  change: [value: string | number | boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
}>();

const slots = useSlots();

const parent = inject<DropdownMenuProvide>(DROPDOWN_KEY);

if (!parent && process.env.NODE_ENV !== 'production') {
  console.error(
    '[Vant] <DropdownItem> must be a child component of <DropdownMenu>.',
  );
}

const state = reactive({
  showPopup: false,
  transition: true,
  showWrapper: false,
});

// --- Duration ---
const duration = computed(() => Number(parent?.props.duration ?? 0.2));
const durationMs = computed(() => Math.round(duration.value * 1000));
const direction = computed(() => parent?.props.direction ?? 'down');
const activeColor = computed(() => parent?.props.activeColor);
const zIndex = computed(() => Number(parent?.props.zIndex ?? 10));

// --- Toggle ---
const toggle = (
  show: boolean = !state.showPopup,
  options: { immediate?: boolean } = {},
) => {
  if (show === state.showPopup) return;

  state.showPopup = show;
  state.transition = !options.immediate;

  if (show) {
    state.showWrapper = true;
    emit('open');
    const dur = options.immediate ? 0 : durationMs.value;
    if (dur > 0) {
      setTimeout(() => emit('opened'), dur);
    } else {
      emit('opened');
    }
  } else {
    emit('close');
    const dur = options.immediate ? 0 : durationMs.value;
    if (dur > 0) {
      setTimeout(() => {
        state.showWrapper = false;
        emit('closed');
      }, dur);
    } else {
      state.showWrapper = false;
      emit('closed');
    }
  }
};

// --- Child expose for parent registration ---
const childExpose: DropdownChildExpose = {
  state,
  toggle,
};

onMounted(() => {
  parent?.registerChild(childExpose);
});

onBeforeUnmount(() => {
  if (state.showPopup) {
    toggle(false, { immediate: true });
  }
  parent?.unregisterChild(childExpose);
});

// --- Display title ---
const displayTitle = computed(() => {
  if (props.title) return props.title;
  const match = props.options.find((o) => o.value === props.modelValue);
  return match ? match.text : '';
});

const hasTitleSlot = computed(() => !!slots.title);

// --- Expose ---
defineExpose({
  toggle,
  state,
  renderTitle: () => displayTitle.value,
});

// --- Title bar item classes ---
const itemClass = computed(() =>
  menuBem('item', { disabled: props.disabled }),
);

const titleClasses = computed(() => [
  menuBem('title', {
    active: state.showPopup,
    down: state.showPopup === (direction.value === 'down'),
  }),
  props.titleClass,
]);

const titleColorStyle = computed(() => {
  if (state.showPopup && activeColor.value) {
    return { color: activeColor.value };
  }
  return undefined;
});

// --- Arrow ---
const arrowClass = computed(() => [
  'van-dropdown-menu__title-arrow',
  {
    'van-dropdown-menu__title-arrow--expand':
      state.showPopup === (direction.value === 'down'),
    'van-dropdown-menu__title-arrow--active': state.showPopup,
  },
]);

const arrowStyle = computed(() => {
  if (state.showPopup && activeColor.value) {
    return {
      borderBottomColor: activeColor.value,
      borderLeftColor: activeColor.value,
    };
  }
  return undefined;
});

// --- Wrapper & Content ---
const wrapperClass = computed(() => bem([direction.value]));

const wrapperStyle = computed(() => ({
  zIndex: zIndex.value,
}));

const contentStyle = computed(() => {
  const style: Record<string, any> = {};

  if (direction.value === 'down') {
    if (!state.showPopup) {
      style.transform = 'translateY(-100%)';
    }
  } else {
    if (!state.showPopup) {
      style.transform = 'translateY(100%)';
    }
  }

  style.transitionProperty = 'transform';
  style.transitionDuration = state.transition ? `${duration.value}s` : '0s';

  return style;
});

// --- Overlay ---
const showOverlay = computed(
  () => state.showWrapper && parent?.props.overlay !== false,
);

const overlayStyle = computed(() => ({
  position: 'fixed' as const,
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  zIndex: zIndex.value,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  opacity: state.showPopup ? 1 : 0,
  transitionProperty: 'opacity',
  transitionDuration: state.transition ? `${duration.value}s` : '0s',
  pointerEvents: state.showPopup ? ('auto' as const) : ('none' as const),
}));

// --- Event handlers ---
function onTitleTap() {
  if (props.disabled) return;
  parent?.toggleItem(childExpose);
}

function onOverlayClick() {
  if (parent?.props.closeOnClickOverlay !== false) {
    parent?.close();
  }
}

function onOptionClick(option: DropdownItemOption) {
  if (option.disabled) return;

  // Close the popup
  state.showPopup = false;
  state.transition = true;
  emit('close');
  setTimeout(() => {
    state.showWrapper = false;
    emit('closed');
  }, durationMs.value);

  if (option.value !== props.modelValue) {
    emit('update:modelValue', option.value);
    emit('change', option.value);
  }
}

function optionClass(option: DropdownItemOption) {
  const active = option.value === props.modelValue;
  return bem('option', { active, disabled: !!option.disabled });
}

function optionStyle(option: DropdownItemOption) {
  const active = option.value === props.modelValue;
  if (active && activeColor.value) {
    return { color: activeColor.value };
  }
  return undefined;
}
</script>

<template>
  <!-- Title bar item (rendered inside DropdownMenu bar) -->
  <view :class="itemClass" @tap="onTitleTap">
    <view :class="titleClasses" :style="titleColorStyle">
      <slot name="title">
        <view class="van-ellipsis">
          <text>{{ displayTitle }}</text>
        </view>
      </slot>
    </view>
    <view :class="arrowClass" :style="arrowStyle" />
  </view>

  <!-- Overlay (fixed, full screen) -->
  <view
    v-if="showOverlay"
    :style="overlayStyle"
    @tap="onOverlayClick"
  />

  <!-- Dropdown content wrapper -->
  <view
    v-if="state.showWrapper"
    :class="wrapperClass"
    :style="wrapperStyle"
  >
    <view :class="bem('content')" :style="contentStyle">
      <Cell
        v-for="option in options"
        :key="String(option.value)"
        :title="option.text"
        :icon="option.icon"
        :class="optionClass(option)"
        :style="optionStyle(option)"
        :clickable="!option.disabled"
        @click="onOptionClick(option)"
      >
        <template #value>
          <Icon
            v-if="option.value === modelValue"
            :class="bem('icon')"
            name="success"
            :color="option.disabled ? undefined : activeColor"
          />
        </template>
      </Cell>
      <slot />
    </view>
  </view>
</template>
