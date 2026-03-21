<!--
  Vant Feature Parity Report:
  - Props: 10/12 supported (title, leftText, rightText, leftArrow, border, fixed,
    placeholder, zIndex, leftDisabled, rightDisabled, clickable)
  - Events: 2/2 (click-left, click-right)
  - Slots: 3/3 (left, title, right)
  - Gaps:
    - No safeAreaInsetTop support
    - Uses text arrow instead of Icon component for leftArrow
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface NavBarProps {
  title?: string;
  leftText?: string;
  rightText?: string;
  leftArrow?: boolean;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  border?: boolean;
  fixed?: boolean;
  placeholder?: boolean;
  zIndex?: number;
  clickable?: boolean;
}

const props = withDefaults(defineProps<NavBarProps>(), {
  title: '',
  leftText: '',
  rightText: '',
  leftArrow: false,
  leftDisabled: false,
  rightDisabled: false,
  border: true,
  fixed: false,
  placeholder: false,
  zIndex: 1,
  clickable: true,
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
  if (!props.leftDisabled) {
    emit('click-left', event);
  }
}

function onClickRight(event: any) {
  if (!props.rightDisabled) {
    emit('click-right', event);
  }
}
</script>

<template>
  <!-- Placeholder when fixed -->
  <view v-if="fixed && placeholder" :style="{ height: 46 }" />

  <view :style="navBarStyle">
    <!-- Left area -->
    <view :style="leftStyle" @tap="onClickLeft">
      <slot name="left">
        <Icon v-if="leftArrow" name="arrow-left" :size="16" color="#1989fa" :style="{ marginRight: 4 }" />
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
