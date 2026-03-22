<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view
  - titleClass/valueClass/labelClass: accepted for API compat but no CSS class support in Lynx
  - iconPrefix: accepted for API compat but unused (no icon font prefix)
  - ::after hairline border: Lynx has no pseudo-elements, uses inline border
  - CSS height transition: Lynx does not support CSS transitions on height; content toggles instantly
  - role/aria attributes: not applicable in Lynx
-->
<script lang="ts">
// Module-level counter for auto-generated names (shared across all instances)
let globalUid = 0;
</script>

<script setup lang="ts">
import {
  computed,
  inject,
  ref,
  watch,
  onMounted,
  onUnmounted,
  type Ref,
} from 'vue-lynx';
import Cell from '../Cell/index.vue';
import { useLazyRender } from '../../composables/useLazyRender';
import './index.less';
import type { CellArrowDirection } from '../Cell/types';

export interface CollapseItemProps {
  name?: string | number;
  title?: string | number;
  value?: string | number;
  label?: string | number;
  icon?: string;
  size?: 'normal' | 'large';
  border?: boolean;
  isLink?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  lazyRender?: boolean;
  center?: boolean;
  clickable?: boolean | null;
  titleClass?: unknown;
  titleStyle?: string | Record<string, any>;
  valueClass?: unknown;
  labelClass?: unknown;
  arrowDirection?: CellArrowDirection;
  iconPrefix?: string;
  required?: boolean | 'auto' | null;
}

const props = withDefaults(defineProps<CollapseItemProps>(), {
  border: true,
  isLink: true,
  disabled: false,
  readonly: false,
  lazyRender: true,
  size: undefined,
  center: false,
  clickable: null,
  required: null,
});

const collapse = inject<{
  modelValue: Ref<(string | number)[] | string | number>;
  accordion: Ref<boolean>;
  toggle: (name: string | number, expanded: boolean) => void;
  isExpanded: (name: string | number) => boolean;
  registerChild: (child: {
    name: string | number;
    disabled: boolean;
    expanded: boolean;
  }) => void;
  unregisterChild: (name: string | number) => void;
  updateChild: (
    name: string | number,
    data: { disabled: boolean; expanded: boolean },
  ) => void;
}>('collapse');

if (!collapse) {
  console.error(
    '[Vant] <CollapseItem> must be a child component of <Collapse>.',
  );
}

// --- Auto name: use prop or fall back to a stable unique id ---
const instanceId = globalUid++;
const itemName = computed(() => props.name ?? instanceId);

// --- Expanded state ---
const expanded = computed(() => {
  if (!collapse) return false;
  return collapse.isExpanded(itemName.value);
});

// --- Lazy render ---
const shouldRender = useLazyRender(() => expanded.value || !props.lazyRender);

// --- Register with parent for toggleAll support ---
onMounted(() => {
  if (collapse) {
    collapse.registerChild({
      name: itemName.value,
      disabled: props.disabled,
      expanded: expanded.value,
    });
  }
});

onUnmounted(() => {
  if (collapse) {
    collapse.unregisterChild(itemName.value);
  }
});

// Keep parent child registry in sync
watch(
  [expanded, () => props.disabled],
  ([exp, disabled]) => {
    if (collapse) {
      collapse.updateChild(itemName.value, {
        disabled: disabled,
        expanded: exp,
      });
    }
  },
);

// --- Toggle ---
function toggle(newValue?: boolean) {
  if (!collapse) return;
  const value = newValue ?? !expanded.value;
  collapse.toggle(itemName.value, value);
}

function onClickTitle() {
  if (props.disabled || props.readonly) return;
  toggle();
}

// --- Expose (matches Vant) ---
defineExpose({ toggle, expanded, itemName });

// --- Cell props for title ---
const cellProps = computed(() => {
  const attrs: Record<string, any> = {
    icon: props.icon,
    size: props.size,
    title: props.title,
    value: props.value,
    label: props.label,
    center: props.center,
    border: false, // We handle border ourselves
    isLink: props.readonly ? false : props.isLink,
    clickable:
      props.disabled || props.readonly
        ? false
        : props.clickable !== null
          ? props.clickable
          : undefined,
    titleStyle: props.titleStyle,
    arrowDirection: props.arrowDirection,
    iconPrefix: props.iconPrefix,
    required: props.required,
  };
  return attrs;
});

// --- Inline styles for disabled title color ---
const titleWrapperStyle = computed(() => {
  if (props.disabled) {
    return {
      opacity: 1,
    };
  }
  return undefined;
});

// --- Item wrapper border (hairline top for non-first items) ---
const itemBorderStyle = computed(() => {
  if (props.border) {
    return {
      borderTopWidth: '0.5px',
      borderTopStyle: 'solid',
      borderTopColor: '#ebedf0',
    };
  }
  return undefined;
});

// --- Content styles ---
const contentWrapperStyle = computed(() => ({
  overflow: 'hidden',
}));
</script>

<template>
  <view class="van-collapse-item" :style="itemBorderStyle">
    <!-- Title / Header (Cell-based layout matching Vant) -->
    <Cell
      v-bind="cellProps"
      :style="titleWrapperStyle"
      @click="onClickTitle"
    >
      <template v-if="$slots.icon" #icon>
        <slot name="icon" />
      </template>
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.value" #value>
        <slot name="value" />
      </template>
      <template v-if="$slots.label" #label>
        <slot name="label" />
      </template>
      <template v-if="$slots['right-icon']" #right-icon>
        <slot name="right-icon" />
      </template>
    </Cell>

    <!-- Content -->
    <view
      v-if="shouldRender && expanded"
      class="van-collapse-item__wrapper"
      :style="contentWrapperStyle"
    >
      <view class="van-collapse-item__content">
        <slot />
      </view>
    </view>
  </view>
</template>
