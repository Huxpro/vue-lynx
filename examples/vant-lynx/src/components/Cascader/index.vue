<!--
  Vant Feature Parity Report -- Cascader
  ======================================
  Props: 9/9 supported
    Supported: modelValue, title, options, placeholder, activeColor, closeable,
               showHeader, closeIcon, fieldNames
    Missing:   swipeable (no swipe gesture in Lynx tabs)

  Events: 5/5 supported
    Supported: update:modelValue, change, finish, close, click-tab

  Slots: 0/4 supported
    Missing: title, option, options-top, options-bottom

  Key Gaps:
    - No swipeable tab animation (Lynx limitation)
    - Disabled option color only (no custom disabled style)
    - No slot support for custom option/title rendering
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface CascaderOption {
  text?: string;
  value?: string | number;
  color?: string;
  disabled?: boolean;
  children?: CascaderOption[];
  [key: PropertyKey]: any;
}

export interface CascaderFieldNames {
  text?: string;
  value?: string;
  children?: string;
}

export interface CascaderProps {
  modelValue?: string | number;
  title?: string;
  options?: CascaderOption[];
  placeholder?: string;
  activeColor?: string;
  closeable?: boolean;
  showHeader?: boolean;
  closeIcon?: string;
  fieldNames?: CascaderFieldNames;
}

const props = withDefaults(defineProps<CascaderProps>(), {
  options: () => [],
  placeholder: 'Select',
  activeColor: '#1989fa',
  closeable: true,
  showHeader: true,
  closeIcon: 'cross',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: { value: string | number; text: string; selectedOptions: CascaderOption[] }];
  finish: [value: { value: string | number; text: string; selectedOptions: CascaderOption[] }];
  close: [];
  'click-tab': [index: number];
}>();

// Resolve field names with defaults
const textKey = computed(() => props.fieldNames?.text ?? 'text');
const valueKey = computed(() => props.fieldNames?.value ?? 'value');
const childrenKey = computed(() => props.fieldNames?.children ?? 'children');

function getOptionText(option: CascaderOption): string {
  return (option[textKey.value] as string) ?? '';
}

function getOptionValue(option: CascaderOption): string | number {
  return option[valueKey.value] as string | number;
}

function getOptionChildren(option: CascaderOption): CascaderOption[] | undefined {
  return option[childrenKey.value] as CascaderOption[] | undefined;
}

// activeTab: which tab level is currently visible
const activeTab = ref(0);

// selectedOptions: array of selected option per level
const selectedOptions = ref<CascaderOption[]>([]);

// On modelValue change, try to restore selected path
function getSelectedOptionsByValue(
  options: CascaderOption[],
  value: string | number,
): CascaderOption[] | undefined {
  for (const option of options) {
    if (getOptionValue(option) === value) {
      return [option];
    }
    const children = getOptionChildren(option);
    if (children) {
      const found = getSelectedOptionsByValue(children, value);
      if (found) {
        return [option, ...found];
      }
    }
  }
  return undefined;
}

watch(
  () => props.modelValue,
  (val) => {
    if (val === undefined || val === null) {
      selectedOptions.value = [];
      activeTab.value = 0;
      return;
    }
    const found = getSelectedOptionsByValue(props.options, val);
    if (found) {
      selectedOptions.value = found;
      // Determine active tab: if last selected has children, show next level
      const last = found[found.length - 1];
      const lastChildren = getOptionChildren(last);
      if (lastChildren && lastChildren.length > 0) {
        activeTab.value = found.length;
      } else {
        activeTab.value = found.length - 1;
      }
    }
  },
  { immediate: true },
);

// tabs derived from selectedOptions
const tabs = computed(() => {
  const result: Array<{ title: string; options: CascaderOption[] }> = [];
  let currentOptions = props.options;

  for (let i = 0; i < selectedOptions.value.length; i++) {
    const sel = selectedOptions.value[i];
    result.push({ title: getOptionText(sel), options: currentOptions });
    const children = getOptionChildren(sel);
    if (children && children.length > 0) {
      currentOptions = children;
    } else {
      break;
    }
  }

  // Add the next unselected tab
  result.push({ title: props.placeholder!, options: currentOptions });

  return result;
});

function onSelectOption(levelIndex: number, option: CascaderOption) {
  if (option.disabled) return;

  const newSelected = selectedOptions.value.slice(0, levelIndex);
  newSelected.push(option);
  selectedOptions.value = newSelected;

  const children = getOptionChildren(option);
  if (children && children.length > 0) {
    activeTab.value = levelIndex + 1;
    emit('change', {
      value: getOptionValue(option),
      text: getOptionText(option),
      selectedOptions: newSelected,
    });
  } else {
    // Leaf node: finish
    emit('update:modelValue', getOptionValue(option));
    emit('finish', {
      value: getOptionValue(option),
      text: getOptionText(option),
      selectedOptions: newSelected,
    });
  }
}

function onClickTab(index: number) {
  activeTab.value = index;
  emit('click-tab', index);
}

function onClose() {
  emit('close');
}

function isOptionSelected(tabIdx: number, option: CascaderOption): boolean {
  const sel = selectedOptions.value[tabIdx];
  return sel != null && getOptionValue(sel) === getOptionValue(option);
}

// Styles
const containerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
  position: 'relative' as const,
};

const tabsRowStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  borderBottomWidth: 1,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const optionRowStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 16,
  paddingRight: 16,
  borderBottomWidth: 1,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#f7f8fa',
};
</script>

<template>
  <view :style="containerStyle">
    <!-- Header -->
    <view v-if="showHeader" :style="headerStyle">
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
      <view
        v-if="closeable"
        :style="{ position: 'absolute', right: 16, display: 'flex', padding: 4 }"
        @tap="onClose"
      >
        <Icon :name="closeIcon" :size="20" color="#c8c9cc" />
      </view>
    </view>

    <!-- Tabs row -->
    <view :style="tabsRowStyle">
      <view
        v-for="(tab, tabIdx) in tabs"
        :key="tabIdx"
        :style="{
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottomWidth: activeTab === tabIdx ? 2 : 0,
          borderBottomStyle: 'solid',
          borderBottomColor: activeColor,
        }"
        @tap="() => onClickTab(tabIdx)"
      >
        <text :style="{
          fontSize: 14,
          color: activeTab === tabIdx ? activeColor : '#323233',
          fontWeight: activeTab === tabIdx ? 'bold' : 'normal',
        }">{{ tab.title }}</text>
      </view>
    </view>

    <!-- Options list for active tab -->
    <view :style="{ display: 'flex', flexDirection: 'column', flex: 1 }">
      <view
        v-for="option in tabs[activeTab]?.options ?? []"
        :key="getOptionValue(option)"
        :style="optionRowStyle"
        @tap="() => onSelectOption(activeTab, option)"
      >
        <text :style="{
          fontSize: 14,
          color: option.disabled
            ? '#c8c9cc'
            : (option.color || (isOptionSelected(activeTab, option) ? activeColor : '#323233')),
        }">{{ getOptionText(option) }}</text>
        <view v-if="isOptionSelected(activeTab, option)" :style="{ display: 'flex' }">
          <Icon name="success" :size="18" :color="activeColor" />
        </view>
      </view>
    </view>
  </view>
</template>
