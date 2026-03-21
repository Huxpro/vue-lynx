<script setup lang="ts">
import { provide, ref } from 'vue-lynx';

export interface PickerGroupProps {
  title?: string;
  tabs?: string[];
}

const props = withDefaults(defineProps<PickerGroupProps>(), {
  tabs: () => [],
});

const activeTab = ref(0);

provide('pickerGroup', {
  tabs: props.tabs,
  activeTab,
});

const headerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
};

const titleStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const,
  color: '#323233',
  textAlign: 'center' as const,
  paddingTop: 12,
  paddingBottom: 8,
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
    <text v-if="title" :style="titleStyle">{{ title }}</text>
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
          borderBottomWidth: activeTab === index ? 2 : 0,
          borderBottomStyle: 'solid' as const,
          borderBottomColor: '#1989fa',
        }"
        @tap="activeTab = index"
      >
        <text
          :style="{
            fontSize: 14,
            color: activeTab === index ? '#1989fa' : '#646566',
            fontWeight: activeTab === index ? ('bold' as const) : ('normal' as const),
          }"
        >{{ tab }}</text>
      </view>
    </view>
    <slot />
  </view>
</template>
