<!--
  Lynx Limitations:
  - safeAreaInsetTop: uses fixed 44px padding (no CSS env() in Lynx)
  - fixed: uses Lynx position fixed (no usePlaceholder composable)
  - placeholder: uses hardcoded 46px height (no DOM measurement in Lynx)
  - HAPTICS_FEEDBACK: not available in Lynx (no haptic feedback on click)
  - van-ellipsis: Lynx text overflow handled differently (no CSS class)
  - CSS class-based BEM styling replaced with inline styles
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import type { NavBarThemeVars } from './types';

export interface NavBarProps {
  title?: string;
  fixed?: boolean;
  zIndex?: number | string;
  border?: boolean;
  leftText?: string;
  rightText?: string;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  leftArrow?: boolean;
  placeholder?: boolean;
  safeAreaInsetTop?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<NavBarProps>(), {
  title: '',
  fixed: false,
  border: true,
  leftText: '',
  rightText: '',
  leftDisabled: false,
  rightDisabled: false,
  leftArrow: false,
  placeholder: false,
  safeAreaInsetTop: false,
  clickable: true,
});

const emit = defineEmits<{
  'click-left': [event: any];
  'click-right': [event: any];
}>();

const slots = useSlots();

const hasLeft = computed(
  () => props.leftArrow || props.leftText || !!slots.left,
);

const hasRight = computed(() => props.rightText || !!slots.right);

const navBarStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: '46px',
    backgroundColor: '#fff',
    paddingTop: props.safeAreaInsetTop ? '44px' : '0px',
  };

  if (props.fixed) {
    style.position = 'fixed';
    style.top = '0px';
    style.left = '0px';
    style.right = '0px';
  }

  if (props.zIndex !== undefined) {
    style.zIndex = props.zIndex;
  }

  if (props.border) {
    style.borderBottomWidth = '0.5px';
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = '#ebedf0';
  }

  return style;
});

const placeholderStyle = computed(() => ({
  height: props.safeAreaInsetTop ? '90px' : '46px',
}));

const leftStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingLeft: '16px',
  paddingRight: '16px',
  height: '100%',
  opacity: props.leftDisabled ? 0.6 : 1,
}));

const rightStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingLeft: '16px',
  paddingRight: '16px',
  height: '100%',
  opacity: props.rightDisabled ? 0.6 : 1,
}));

const titleStyle = computed(() => ({
  flex: 1,
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#323233',
  textAlign: 'center' as const,
  overflow: 'hidden' as const,
}));

const arrowStyle = {
  marginRight: '4px',
};

const textStyle = {
  fontSize: '14px',
  color: '#1989fa',
};

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
  <view v-if="fixed && placeholder" :style="placeholderStyle">
    <view :style="navBarStyle">
      <!-- Left area -->
      <view v-if="hasLeft" :style="leftStyle" @tap="onClickLeft">
        <slot name="left">
          <Icon
            v-if="leftArrow"
            name="arrow-left"
            :size="16"
            color="#1989fa"
            :style="arrowStyle"
          />
          <text v-if="leftText" :style="textStyle">{{ leftText }}</text>
        </slot>
      </view>

      <!-- Title -->
      <view :style="{ flex: 1 }">
        <slot name="title">
          <text :style="titleStyle">{{ title }}</text>
        </slot>
      </view>

      <!-- Right area -->
      <view v-if="hasRight" :style="rightStyle" @tap="onClickRight">
        <slot name="right">
          <text v-if="rightText" :style="textStyle">{{ rightText }}</text>
        </slot>
      </view>
    </view>
  </view>

  <!-- Normal (non-placeholder) rendering -->
  <view v-else :style="navBarStyle">
    <!-- Left area -->
    <view v-if="hasLeft" :style="leftStyle" @tap="onClickLeft">
      <slot name="left">
        <Icon
          v-if="leftArrow"
          name="arrow-left"
          :size="16"
          color="#1989fa"
          :style="arrowStyle"
        />
        <text v-if="leftText" :style="textStyle">{{ leftText }}</text>
      </slot>
    </view>

    <!-- Title -->
    <view :style="{ flex: 1 }">
      <slot name="title">
        <text :style="titleStyle">{{ title }}</text>
      </slot>
    </view>

    <!-- Right area -->
    <view v-if="hasRight" :style="rightStyle" @tap="onClickRight">
      <slot name="right">
        <text v-if="rightText" :style="textStyle">{{ rightText }}</text>
      </slot>
    </view>
  </view>
</template>
