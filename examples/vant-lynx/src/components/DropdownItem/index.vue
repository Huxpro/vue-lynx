<script lang="ts">
// Module-level counter to assign a stable unique index to each DropdownItem instance
let _itemCounter = 0;
</script>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue-lynx';

export interface DropdownOption {
  text: string;
  value: string | number;
  icon?: string;
}

export interface DropdownItemProps {
  modelValue?: string | number;
  title?: string;
  options?: DropdownOption[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<DropdownItemProps>(), {
  options: () => [],
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
  open: [];
  close: [];
}>();

const menu = inject<{
  activeColor: Ref<string>;
  direction: Ref<'up' | 'down'>;
  overlay: Ref<boolean>;
  openedIndex: Ref<number | null>;
  openItem: (index: number) => void;
  closeAll: () => void;
}>('dropdownMenu')!;

// Each instance gets a stable unique index assigned at setup time
const selfIndex = ref<number>(_itemCounter++);

const isOpen = computed(() => menu.openedIndex.value === selfIndex.value);

const displayTitle = computed(() => {
  if (props.title) return props.title;
  const matched = props.options.find((o) => o.value === props.modelValue);
  return matched ? matched.text : '';
});

function onTitleTap() {
  if (props.disabled) return;
  if (isOpen.value) {
    menu.openedIndex.value = null;
    emit('close');
  } else {
    menu.openItem(selfIndex.value);
    emit('open');
  }
}

function onSelect(option: DropdownOption) {
  emit('update:modelValue', option.value);
  emit('change', option.value);
  menu.openedIndex.value = null;
  emit('close');
}

function onOverlayTap() {
  menu.openedIndex.value = null;
  emit('close');
}

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
    ? menu.activeColor.value
    : props.disabled
      ? '#c8c9cc'
      : '#323233',
  marginRight: 4,
}));

const arrowStyle = computed(() => ({
  fontSize: 12,
  color: isOpen.value
    ? menu.activeColor.value
    : props.disabled
      ? '#c8c9cc'
      : '#969799',
}));

const dropdownStyle = computed(() => {
  const isDown = menu.direction.value === 'down';
  return {
    display: isOpen.value ? 'flex' : 'none',
    position: 'absolute' as const,
    left: 0,
    right: 0,
    ...(isDown ? { top: '100%' } : { bottom: '100%' }),
    zIndex: 10,
    backgroundColor: '#fff',
    flexDirection: 'column' as const,
    maxHeight: 320,
    borderBottomWidth: isDown ? 0.5 : 0,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: '#ebedf0',
    borderTopWidth: isDown ? 0 : 0.5,
    borderTopStyle: 'solid' as const,
    borderTopColor: '#ebedf0',
  };
});

const overlayStyle = computed(() => ({
  display: isOpen.value && menu.overlay.value ? 'flex' : 'none',
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}));

const arrowChar = computed(() => {
  const down = '\u2304';
  const up = '\u2303';
  if (menu.direction.value === 'down') {
    return isOpen.value ? up : down;
  }
  return isOpen.value ? down : up;
});
</script>

<template>
  <!-- Title bar rendered inside DropdownMenu's bar slot -->
  <view :style="titleStyle" @tap="onTitleTap">
    <text :style="titleTextStyle">{{ displayTitle }}</text>
    <text :style="arrowStyle">{{ arrowChar }}</text>
  </view>

  <!-- Overlay -->
  <view :style="overlayStyle" @tap="onOverlayTap" />

  <!-- Dropdown list -->
  <view :style="dropdownStyle">
    <view
      v-for="option in options"
      :key="option.value"
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
      }"
      @tap="onSelect(option)"
    >
      <text
        v-if="option.icon"
        :style="{
          fontSize: 16,
          marginRight: 8,
          color: option.value === modelValue ? menu.activeColor.value : '#323233',
        }"
      >{{ option.icon }}</text>
      <text
        :style="{
          flex: 1,
          fontSize: 14,
          color: option.value === modelValue ? menu.activeColor.value : '#323233',
        }"
      >{{ option.text }}</text>
      <text
        v-if="option.value === modelValue"
        :style="{ fontSize: 16, color: menu.activeColor.value }"
      >&#10003;</text>
    </view>
  </view>
</template>
