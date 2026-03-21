<!--
  Vant Feature Parity Report:
  - Props: 3/3 supported (modelValue, accordion, border)
  - Events: 2/2 supported (update:modelValue, change)
  - Exposed Methods: toggleAll (non-accordion mode)
  - Validation: warns on modelValue/accordion mismatch (dev only)
  - CSS Variables: Hardcoded - matches Vant defaults
  - Gaps:
    - No CSS class-based theming (Lynx inline styles only)
    - BORDER_TOP_BOTTOM uses inline border instead of CSS hairline mixin
-->
<script setup lang="ts">
import { provide, toRef, computed } from 'vue-lynx';

export interface CollapseProps {
  modelValue?: (string | number)[] | string | number;
  accordion?: boolean;
  border?: boolean;
}

const props = withDefaults(defineProps<CollapseProps>(), {
  modelValue: () => [],
  accordion: false,
  border: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[] | string | number];
  change: [value: (string | number)[] | string | number];
}>();

// --- Validation (matches Vant) ---
function validateModelValue(
  modelValue: (string | number)[] | string | number,
  accordion: boolean,
): boolean {
  if (accordion && Array.isArray(modelValue)) {
    console.error(
      '[Vant] Collapse: "v-model" should not be Array in accordion mode',
    );
    return false;
  }
  if (!accordion && !Array.isArray(modelValue)) {
    console.error(
      '[Vant] Collapse: "v-model" should be Array in non-accordion mode',
    );
    return false;
  }
  return true;
}

// --- Core: toggle (called by CollapseItem) ---
function updateName(name: (string | number)[] | string | number) {
  emit('change', name);
  emit('update:modelValue', name);
}

function toggle(name: string | number, expanded: boolean) {
  const { accordion, modelValue } = props;
  if (accordion) {
    updateName(name === modelValue ? '' : name);
  } else if (expanded) {
    updateName((modelValue as (string | number)[]).concat(name));
  } else {
    updateName(
      (modelValue as (string | number)[]).filter(
        (activeName) => activeName !== name,
      ),
    );
  }
}

// --- Core: isExpanded (called by CollapseItem) ---
function isExpanded(name: string | number): boolean {
  const { accordion, modelValue } = props;
  validateModelValue(modelValue, accordion);
  return accordion
    ? modelValue === name
    : (modelValue as (string | number)[]).includes(name);
}

// --- Exposed: toggleAll (matches Vant) ---
// Tracks registered children for toggleAll support
const children: Array<{
  name: string | number;
  disabled: boolean;
  expanded: boolean;
}> = [];

function registerChild(child: {
  name: string | number;
  disabled: boolean;
  expanded: boolean;
}) {
  children.push(child);
}

function unregisterChild(name: string | number) {
  const idx = children.findIndex((c) => c.name === name);
  if (idx > -1) children.splice(idx, 1);
}

function updateChild(
  name: string | number,
  data: { disabled: boolean; expanded: boolean },
) {
  const child = children.find((c) => c.name === name);
  if (child) {
    child.disabled = data.disabled;
    child.expanded = data.expanded;
  }
}

export type CollapseToggleAllOptions =
  | boolean
  | { expanded?: boolean; skipDisabled?: boolean };

function toggleAll(options: CollapseToggleAllOptions = {}) {
  if (props.accordion) return;

  if (typeof options === 'boolean') {
    options = { expanded: options };
  }

  const { expanded, skipDisabled } = options;
  const expandedChildren = children.filter((item) => {
    if (item.disabled && skipDisabled) {
      return item.expanded;
    }
    return expanded ?? !item.expanded;
  });

  const names = expandedChildren.map((item) => item.name);
  updateName(names);
}

// --- Provide to children ---
provide('collapse', {
  modelValue: toRef(props, 'modelValue'),
  accordion: toRef(props, 'accordion'),
  toggle,
  isExpanded,
  registerChild,
  unregisterChild,
  updateChild,
});

// --- Styles ---
const collapseStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'column' as const,
  borderTopWidth: props.border ? 0.5 : 0,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

defineExpose({ toggleAll });
</script>

<template>
  <view :style="collapseStyle">
    <slot />
  </view>
</template>
