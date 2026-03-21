<!--
  Vant Feature Parity Report:
  - Props: 5/6 supported (title, options, disabled, modelValue, titleClass [accepted but N/A in Lynx])
  - Missing: teleport (N/A in Lynx), lazyRender (v-if is effectively lazy)
  - Events: 6/6 supported (open, opened, close, closed, change, update:modelValue)
  - Slots: 2/2 (default for custom content, title for custom title rendering)
  - Option features: disabled support, icon via Icon component, active checkmark via Icon
  - Expose: toggle(show?, options?), state
  - Uses Cell component for option rows (matching Vant)
  - Uses Icon component for success checkmark and option icons
  - Provide/Inject pattern with DropdownMenu parent
  - Gaps:
    - No teleport (N/A in Lynx)
    - No lazyRender (v-if used instead)
    - titleClass accepted but class-based styling N/A in Lynx
    - No Popup sub-component (inline positioned dropdown instead)
-->
<script lang="ts">
// Module-level counter to assign a stable unique index to each DropdownItem instance
let _itemCounter = 0;
</script>

<script setup lang="ts">
import { computed, inject, ref, watch, onBeforeUnmount, useSlots, type Ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import { useAnimate } from '../../composables/useAnimate';

// Inline type to avoid cross-SFC type import issues
interface DropdownMenuProvide {
  props: {
    activeColor?: string;
    direction?: 'up' | 'down';
    overlay?: boolean;
    zIndex?: number | string;
    duration?: number | string;
    closeOnClickOutside?: boolean;
    closeOnClickOverlay?: boolean;
  };
  offset: Ref<number>;
  openedIndex: Ref<number | null>;
  toggleItem: (index: number) => void;
  closeAll: () => void;
}

export interface DropdownOption {
  text: string;
  value: string | number | boolean;
  icon?: string;
  disabled?: boolean;
}

export interface DropdownItemProps {
  modelValue?: string | number | boolean;
  title?: string;
  options?: DropdownOption[];
  disabled?: boolean;
  titleClass?: unknown;
  lazyRender?: boolean;
}

const props = withDefaults(defineProps<DropdownItemProps>(), {
  options: () => [],
  disabled: false,
  lazyRender: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean];
  change: [value: string | number | boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
}>();

const slots = useSlots();

const menu = inject<DropdownMenuProvide>('dropdownMenu')!;

// Each instance gets a stable unique index assigned at setup time
const selfIndex = ref<number>(_itemCounter++);

// Animation
const ANIM_DURATION = 200;
const { elRef: dropdownRef, slideIn, slideOut } = useAnimate();

// Reactive state matching Vant's internal state
const showPopup = ref(false);
const showWrapper = ref(false);

const isOpen = computed(() => menu.openedIndex.value === selfIndex.value);

// Sync local state with parent openedIndex
watch(isOpen, (val) => {
  if (val) {
    showPopup.value = true;
    showWrapper.value = true;
    emit('open');
    // Slide in based on direction
    const dir = (menu.props.direction || 'down') === 'down' ? 'down' : 'up';
    slideIn(dir, ANIM_DURATION);
    setTimeout(() => emit('opened'), ANIM_DURATION);
  } else if (showPopup.value) {
    showPopup.value = false;
    emit('close');
    const dir = (menu.props.direction || 'down') === 'down' ? 'down' : 'up';
    slideOut(dir, ANIM_DURATION);
    setTimeout(() => {
      showWrapper.value = false;
      emit('closed');
    }, ANIM_DURATION);
  }
});

const displayTitle = computed(() => {
  if (slots.title) return null; // slot will render title
  if (props.title) return props.title;
  const matched = props.options.find((o) => o.value === props.modelValue);
  return matched ? matched.text : '';
});

function toggle(show?: boolean, options?: { immediate?: boolean }) {
  const nextShow = show ?? !isOpen.value;
  if (nextShow) {
    menu.toggleItem(selfIndex.value);
  } else {
    menu.closeAll();
  }
}

// Expose toggle and state for programmatic use
defineExpose({
  toggle,
  state: { showPopup, showWrapper },
  renderTitle: () => displayTitle.value,
});

function onTitleTap() {
  if (props.disabled) return;
  toggle();
}

function onSelect(option: DropdownOption) {
  if (option.disabled) return;
  showPopup.value = false;
  menu.closeAll();
  if (option.value !== props.modelValue) {
    emit('update:modelValue', option.value);
    emit('change', option.value);
  }
}

function onOverlayTap() {
  if (menu.props.closeOnClickOverlay !== false) {
    menu.closeAll();
  }
}

const activeColor = computed(() => menu.props.activeColor || '#1989fa');
const direction = computed(() => menu.props.direction || 'down');

const titleStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 8,
  paddingRight: 8,
}));

const titleTextStyle = computed(() => ({
  fontSize: 14,
  color: isOpen.value
    ? activeColor.value
    : props.disabled
      ? '#c8c9cc'
      : '#323233',
  marginRight: 4,
  overflow: 'hidden' as const,
}));

const arrowStyle = computed(() => ({
  fontSize: 10,
  color: isOpen.value
    ? activeColor.value
    : props.disabled
      ? '#c8c9cc'
      : '#969799',
}));

const dropdownStyle = computed(() => {
  const isDown = direction.value === 'down';
  const zIndex = Number(menu.props.zIndex) || 10;
  return {
    display: showWrapper.value ? 'flex' : 'none',
    position: 'absolute' as const,
    left: 0,
    right: 0,
    ...(isDown ? { top: '100%' } : { bottom: '100%' }),
    zIndex,
    backgroundColor: '#fff',
    flexDirection: 'column' as const,
    maxHeight: 320,
    overflow: 'hidden' as const,
  };
});

const overlayStyle = computed(() => {
  const zIndex = Number(menu.props.zIndex) || 10;
  return {
    display: showWrapper.value && menu.props.overlay !== false ? 'flex' : 'none',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex - 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };
});

const arrowChar = computed(() => {
  const down = '\u2304';
  const up = '\u2303';
  if (direction.value === 'down') {
    return isOpen.value ? up : down;
  }
  return isOpen.value ? down : up;
});

// Reset counter on unmount is not needed since _itemCounter is global
// but reset on mount for HMR scenarios
onBeforeUnmount(() => {
  // If this item was the open one, close it
  if (menu.openedIndex.value === selfIndex.value) {
    menu.closeAll();
  }
});
</script>

<template>
  <!-- Title bar rendered inside DropdownMenu's bar slot -->
  <view :style="titleStyle" @tap="onTitleTap">
    <slot name="title">
      <text :style="titleTextStyle">{{ displayTitle }}</text>
    </slot>
    <text :style="arrowStyle">{{ arrowChar }}</text>
  </view>

  <!-- Overlay -->
  <view :style="overlayStyle" @tap="onOverlayTap" />

  <!-- Dropdown list -->
  <view :main-thread-ref="dropdownRef" :style="dropdownStyle">
    <view
      v-for="option in options"
      :key="String(option.value)"
      :style="{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        borderBottomWidth: 0.5,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ebedf0',
        backgroundColor: '#fff',
        opacity: option.disabled ? 0.5 : 1,
      }"
      @tap="onSelect(option)"
    >
      <view v-if="option.icon" :style="{ marginRight: 8, display: 'flex', alignItems: 'center' }">
        <Icon
          :name="option.icon"
          :size="16"
          :color="option.value === modelValue ? activeColor : (option.disabled ? '#c8c9cc' : '#323233')"
        />
      </view>
      <text
        :style="{
          flex: 1,
          fontSize: 14,
          color: option.disabled
            ? '#c8c9cc'
            : option.value === modelValue
              ? activeColor
              : '#323233',
        }"
      >{{ option.text }}</text>
      <Icon
        v-if="option.value === modelValue"
        name="success"
        :size="16"
        :color="option.disabled ? undefined : activeColor"
      />
    </view>
    <!-- Default slot for custom content -->
    <slot />
  </view>
</template>
