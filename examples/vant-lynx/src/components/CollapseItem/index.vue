<!--
  Vant Feature Parity Report:
  - Props: 10/11 supported (name, title, value, label, icon, size, border, isLink, disabled, readonly)
    - Missing: lazyRender (Lynx has no v-show with height animation; we use conditional render)
    - titleClass: N/A in Lynx (no CSS class support, inline styles only)
  - Events: click on title header
  - Slots: 6/6 supported (default, title, value, label, icon, right-icon)
  - Arrow rotation: Icon component with arrow/arrow-up based on expanded state
  - Cell-based layout: Reuses Cell-like structure (icon, title, label, value, right-icon)
  - Click feedback: Active background color on touchstart/touchend
  - Auto name: Falls back to a provided index when name prop is omitted
  - Exposed: toggle method
  - Gaps:
    - No CSS height transition animation (Lynx does not support CSS transitions on height)
    - lazyRender prop accepted for API compat but content uses v-if (no v-show + height anim)
    - titleClass prop not applicable (Lynx inline styles only)
-->
<script lang="ts">
// Module-level counter for auto-generated names (shared across all instances)
let globalUid = 0;
</script>

<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onUnmounted, type Ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';

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
}

const props = withDefaults(defineProps<CollapseItemProps>(), {
  border: true,
  isLink: true,
  disabled: false,
  readonly: false,
  lazyRender: true,
  size: 'normal',
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
// In Vant, useParent provides a stable index. Here we generate a unique id once per instance.
const instanceId = globalUid++;
const itemName = computed(() => props.name ?? instanceId);

// --- Expanded state ---
const isExpanded = computed(() => {
  if (!collapse) return false;
  return collapse.isExpanded(itemName.value);
});

// Track whether content has ever been shown (for lazyRender)
const hasBeenExpanded = ref(isExpanded.value);

watch(isExpanded, (val) => {
  if (val) hasBeenExpanded.value = true;
});

// --- Register with parent for toggleAll support ---
onMounted(() => {
  if (collapse) {
    collapse.registerChild({
      name: itemName.value,
      disabled: props.disabled,
      expanded: isExpanded.value,
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
  [isExpanded, () => props.disabled],
  ([expanded, disabled]) => {
    if (collapse) {
      collapse.updateChild(itemName.value, {
        disabled: disabled,
        expanded: expanded,
      });
    }
  },
);

// --- Click feedback ---
const isActive = ref(false);

function onTouchStart() {
  if (!props.disabled && !props.readonly) {
    isActive.value = true;
  }
}

function onTouchEnd() {
  isActive.value = false;
}

// --- Toggle ---
function toggle(newValue?: boolean) {
  if (!collapse) return;
  const value = newValue ?? !isExpanded.value;
  collapse.toggle(itemName.value, value);
}

function onClickTitle() {
  if (props.disabled || props.readonly) return;
  toggle();
}

// --- Expose toggle for programmatic control (matches Vant) ---
defineExpose({ toggle, expanded: isExpanded, itemName });

// --- Styles ---
const isLarge = computed(() => props.size === 'large');

const wrapperStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'column' as const,
  borderTopWidth: props.border ? 0.5 : 0,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
}));

const headerStyle = computed(() => {
  const clickable = !props.disabled && !props.readonly;
  return {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingTop: isLarge.value ? 12 : 10,
    paddingBottom: isLarge.value ? 12 : 10,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor:
      isActive.value && clickable ? '#f2f3f5' : '#fff',
    // Bottom border under header when expanded (matches Vant hairline)
    borderBottomWidth: isExpanded.value && props.border ? 0.5 : 0,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: '#ebedf0',
  };
});

const titleContainerStyle = computed(() => ({
  flex: 1,
  display: 'flex' as const,
  flexDirection: 'column' as const,
}));

const titleRowStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
}));

const titleTextStyle = computed(() => ({
  fontSize: isLarge.value ? 16 : 14,
  color: props.disabled ? '#c8c9cc' : '#323233',
  lineHeight: 24,
}));

const valueTextStyle = computed(() => ({
  fontSize: isLarge.value ? 16 : 14,
  color: props.disabled ? '#c8c9cc' : '#969799',
  lineHeight: 24,
  textAlign: 'right' as const,
}));

const labelTextStyle = computed(() => ({
  fontSize: isLarge.value ? 14 : 12,
  color: props.disabled ? '#c8c9cc' : '#969799',
  marginTop: 4,
  lineHeight: 18,
}));

const iconContainerStyle = {
  marginRight: 4,
  display: 'flex' as const,
  alignItems: 'center' as const,
  height: 24,
};

const rightIconContainerStyle = {
  marginLeft: 4,
  display: 'flex' as const,
  alignItems: 'center' as const,
  height: 24,
};

const contentStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'column' as const,
  padding: 16,
  backgroundColor: '#fff',
  fontSize: 14,
  lineHeight: 1.5,
  color: '#969799',
}));

// Should render content? (lazyRender support)
const shouldRender = computed(() => {
  if (!props.lazyRender) return true;
  return hasBeenExpanded.value;
});
</script>

<template>
  <view :style="wrapperStyle">
    <!-- Title / Header (Cell-like layout) -->
    <view
      :style="headerStyle"
      @tap="onClickTitle"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <!-- Left icon -->
      <slot name="icon">
        <view v-if="icon" :style="iconContainerStyle">
          <Icon
            :name="icon"
            :size="16"
            :color="disabled ? '#c8c9cc' : '#323233'"
          />
        </view>
      </slot>

      <!-- Title + Label section -->
      <view :style="titleContainerStyle">
        <view :style="titleRowStyle">
          <slot name="title">
            <text v-if="title !== undefined" :style="titleTextStyle">{{ title }}</text>
          </slot>
        </view>
        <slot name="label">
          <text v-if="label !== undefined" :style="labelTextStyle">{{ label }}</text>
        </slot>
      </view>

      <!-- Value section -->
      <slot name="value">
        <text v-if="value !== undefined" :style="valueTextStyle">{{ value }}</text>
      </slot>

      <!-- Right icon (arrow) -->
      <slot name="right-icon">
        <view
          v-if="isLink && !readonly"
          :style="rightIconContainerStyle"
        >
          <Icon
            :name="isExpanded ? 'arrow-up' : 'arrow-down'"
            :size="16"
            :color="disabled ? '#c8c9cc' : '#969799'"
          />
        </view>
      </slot>
    </view>

    <!-- Content -->
    <view v-if="shouldRender && isExpanded" :style="contentStyle">
      <slot />
    </view>
  </view>
</template>
