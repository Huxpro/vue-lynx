<!--
  Lynx Limitations:
  - No CSS ::after pseudo-element hairline border; uses inline border fallback
-->
<script setup lang="ts">
import { provide, toRef, reactive } from 'vue-lynx';
import './index.less';

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

// --- Tracks registered children for toggleAll support ---
const children = reactive<
  Array<{
    name: string | number;
    disabled: boolean;
    expanded: boolean;
  }>
>([]);

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

// --- Exposed: toggleAll (matches Vant) ---
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

defineExpose({ toggleAll });
</script>

<template>
  <view
    class="van-collapse"
    :style="border ? {
      borderTopWidth: '0.5px',
      borderTopStyle: 'solid',
      borderTopColor: '#ebedf0',
      borderBottomWidth: '0.5px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#ebedf0',
    } : undefined"
  >
    <slot />
  </view>
</template>
