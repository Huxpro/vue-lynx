<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported (title, tabs, activeTab, nextStepText, showToolbar, confirmButtonText, cancelButtonText)
  - Events: 3/3 supported (confirm, cancel, update:activeTab)
  - Slots: 5/5 supported (default, toolbar, title, confirm, cancel)
  - Notes: Toolbar follows Picker toolbar pattern; nextStepText switches confirm button
    to advance tabs until final tab
-->
<script setup lang="ts">
import { provide, ref, computed, watch, toRef } from 'vue-lynx';

export interface PickerGroupProps {
  title?: string;
  tabs?: string[];
  activeTab?: number;
  nextStepText?: string;
  showToolbar?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<PickerGroupProps>(), {
  tabs: () => [],
  activeTab: 0,
  showToolbar: true,
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  nextStepText: '',
});

const emit = defineEmits<{
  confirm: [values: any[]];
  cancel: [];
  'update:activeTab': [value: number];
}>();

const currentTab = ref(props.activeTab);

watch(
  () => props.activeTab,
  (val) => {
    if (val !== currentTab.value) {
      currentTab.value = val;
    }
  },
);

watch(currentTab, (val) => {
  emit('update:activeTab', val);
});

// Child picker registration for collecting selected values on confirm
const pickerGetters = ref<Array<() => any[]>>([]);

function registerPicker(getter: () => any[]) {
  pickerGetters.value.push(getter);
}

function unregisterPicker(getter: () => any[]) {
  const idx = pickerGetters.value.indexOf(getter);
  if (idx >= 0) pickerGetters.value.splice(idx, 1);
}

function collectValues(): any[] {
  return pickerGetters.value.map((getter) => getter());
}

provide('pickerGroup', {
  tabs: toRef(props, 'tabs'),
  activeTab: currentTab,
  registerPicker,
  unregisterPicker,
});

const isLastTab = computed(() => {
  return !props.tabs.length || currentTab.value >= props.tabs.length - 1;
});

const confirmText = computed(() => {
  if (props.nextStepText && !isLastTab.value) {
    return props.nextStepText;
  }
  return props.confirmButtonText;
});

function onConfirm() {
  if (props.nextStepText && !isLastTab.value) {
    // Advance to next tab
    currentTab.value = currentTab.value + 1;
  } else {
    emit('confirm', collectValues());
  }
}

function onCancel() {
  emit('cancel');
}

function onTabTap(index: number) {
  currentTab.value = index;
}

// -- Styles --
const toolbarStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between' as const,
  height: 44,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const titleTextStyle = {
  flex: 1,
  textAlign: 'center' as const,
  fontSize: 16,
  fontWeight: 'bold' as const,
  color: '#323233',
};

const cancelBtnStyle = {
  fontSize: 14,
  color: '#969799',
  padding: 4,
};

const confirmBtnStyle = {
  fontSize: 14,
  color: '#1989fa',
  padding: 4,
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
};

const tabsStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};
</script>

<template>
  <view :style="headerStyle">
    <!-- Toolbar -->
    <view v-if="showToolbar" :style="toolbarStyle">
      <slot name="toolbar">
        <slot name="cancel">
          <view @tap="onCancel"><text :style="cancelBtnStyle">{{ cancelButtonText }}</text></view>
        </slot>
        <slot name="title">
          <text v-if="title" :style="titleTextStyle">{{ title }}</text>
          <view v-else :style="{ flex: 1 }" />
        </slot>
        <slot name="confirm">
          <view @tap="onConfirm"><text :style="confirmBtnStyle">{{ confirmText }}</text></view>
        </slot>
      </slot>
    </view>

    <!-- Tabs -->
    <view v-if="tabs && tabs.length" :style="tabsStyle">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        :style="{
          flex: 1,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: currentTab === index ? 2 : 0,
          borderBottomStyle: 'solid' as const,
          borderBottomColor: '#1989fa',
        }"
        @tap="onTabTap(index)"
      >
        <text
          :style="{
            fontSize: 14,
            color: currentTab === index ? '#1989fa' : '#646566',
            fontWeight: currentTab === index ? ('bold' as const) : ('normal' as const),
          }"
        >{{ tab }}</text>
      </view>
    </view>

    <!-- Content -->
    <slot />
  </view>
</template>
