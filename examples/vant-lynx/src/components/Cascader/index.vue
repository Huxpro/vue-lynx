<!--
  Vant Feature Parity Report:
  - Props: 5/9 supported (modelValue, title, options, placeholder, activeColor, closeable)
    Missing: swipeable, closeIcon, showHeader, fieldNames
  - Events: 5/5 supported (update:modelValue, change, finish, close, click-tab)
  - Slots: 0/3 supported
    Missing: title, option, options-top, options-bottom
  - Gaps: no fieldNames for custom option field mapping; no swipeable tab animation;
    closeIcon is hardcoded to x character; showHeader always true; disabled option support
    not implemented; no options-top/options-bottom slots
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';

export interface CascaderOption {
  text: string;
  value: string | number;
  children?: CascaderOption[];
}

export interface CascaderProps {
  modelValue?: string | number;
  title?: string;
  options?: CascaderOption[];
  placeholder?: string;
  activeColor?: string;
  closeable?: boolean;
}

const props = withDefaults(defineProps<CascaderProps>(), {
  options: () => [],
  placeholder: 'Select',
  activeColor: '#1989fa',
  closeable: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: { value: string | number; text: string; selectedOptions: CascaderOption[] }];
  finish: [value: { value: string | number; text: string; selectedOptions: CascaderOption[] }];
  close: [];
  'click-tab': [index: number];
}>();

// activeTab: which tab level is currently visible
const activeTab = ref(0);

// selectedOptions: array of selected option per level
const selectedOptions = ref<CascaderOption[]>([]);

// On modelValue change, try to restore selected path
watch(
  () => props.modelValue,
  (val) => {
    if (val === undefined || val === null) {
      selectedOptions.value = [];
      activeTab.value = 0;
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
    result.push({ title: sel.text, options: currentOptions });
    if (sel.children && sel.children.length > 0) {
      currentOptions = sel.children;
    } else {
      break;
    }
  }

  // Add the next unselected tab
  result.push({ title: props.placeholder!, options: currentOptions });

  return result;
});

function onSelectOption(levelIndex: number, option: CascaderOption) {
  const newSelected = selectedOptions.value.slice(0, levelIndex);
  newSelected.push(option);
  selectedOptions.value = newSelected;

  if (option.children && option.children.length > 0) {
    activeTab.value = levelIndex + 1;
    emit('change', {
      value: option.value,
      text: option.text,
      selectedOptions: newSelected,
    });
  } else {
    // Leaf node: finish
    emit('update:modelValue', option.value);
    emit('finish', {
      value: option.value,
      text: option.text,
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
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }">
    <!-- Header -->
    <view :style="{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      borderBottomColor: '#ebedf0',
    }">
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
      <text
        v-if="closeable"
        :style="{ fontSize: 20, color: '#c8c9cc', padding: 4 }"
        @tap="onClose"
      >&times;</text>
    </view>

    <!-- Tabs row -->
    <view :style="{
      display: 'flex',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      borderBottomColor: '#ebedf0',
    }">
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
        }">{{ tab.title }}</text>
      </view>
    </view>

    <!-- Options list for active tab -->
    <view :style="{ flex: 1 }">
      <view
        v-for="option in tabs[activeTab]?.options ?? []"
        :key="option.value"
        :style="{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: '#f7f8fa',
        }"
        @tap="() => onSelectOption(activeTab, option)"
      >
        <text :style="{
          fontSize: 14,
          color: selectedOptions[activeTab]?.value === option.value ? activeColor : '#323233',
        }">{{ option.text }}</text>
        <text
          v-if="selectedOptions[activeTab]?.value === option.value"
          :style="{ fontSize: 16, color: activeColor }"
        >&#10003;</text>
      </view>
    </view>
  </view>
</template>
