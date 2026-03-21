<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface NavBarProps {
  title?: string;
  leftText?: string;
  rightText?: string;
  leftArrow?: boolean;
  border?: boolean;
  fixed?: boolean;
  placeholder?: boolean;
  zIndex?: number;
}

const props = withDefaults(defineProps<NavBarProps>(), {
  title: '',
  leftText: '',
  rightText: '',
  leftArrow: false,
  border: true,
  fixed: false,
  placeholder: false,
  zIndex: 1,
});

const emit = defineEmits<{
  'click-left': [event: any];
  'click-right': [event: any];
}>();

const navBarStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: 46,
  backgroundColor: '#fff',
  paddingLeft: 16,
  paddingRight: 16,
  position: props.fixed ? ('fixed' as const) : ('relative' as const),
  top: props.fixed ? 0 : undefined,
  left: props.fixed ? 0 : undefined,
  right: props.fixed ? 0 : undefined,
  zIndex: props.zIndex,
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

const leftStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minWidth: 60,
}));

const titleStyle = computed(() => ({
  flex: 1,
  fontSize: 16,
  fontWeight: 'bold' as const,
  color: '#323233',
  textAlign: 'center' as const,
  overflow: 'hidden' as const,
}));

const rightStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minWidth: 60,
  justifyContent: 'flex-end' as const,
}));

function onClickLeft(event: any) {
  emit('click-left', event);
}

function onClickRight(event: any) {
  emit('click-right', event);
}
</script>

<template>
  <!-- Placeholder when fixed -->
  <view v-if="fixed && placeholder" :style="{ height: 46 }" />

  <view :style="navBarStyle">
    <!-- Left area -->
    <view :style="leftStyle" @tap="onClickLeft">
      <slot name="left">
        <text v-if="leftArrow" :style="{ fontSize: 16, color: '#1989fa', marginRight: 4 }">&#8249;</text>
        <text v-if="leftText" :style="{ fontSize: 14, color: '#1989fa' }">{{ leftText }}</text>
      </slot>
    </view>

    <!-- Title -->
    <view :style="{ flex: 1 }">
      <slot name="title">
        <text :style="titleStyle">{{ title }}</text>
      </slot>
    </view>

    <!-- Right area -->
    <view :style="rightStyle" @tap="onClickRight">
      <slot name="right">
        <text v-if="rightText" :style="{ fontSize: 14, color: '#1989fa' }">{{ rightText }}</text>
      </slot>
    </view>
  </view>
</template>
