<!--
  Lynx Limitations:
  - safeAreaInsetTop: uses fixed 44px padding (no CSS env() in Lynx)
  - placeholder: uses hardcoded 46px height (no DOM measurement via usePlaceholder)
  - HAPTICS_FEEDBACK: not available in Lynx (no haptic feedback on click)
  - van-ellipsis: Lynx text overflow handled differently (uses single-line overflow on __title)
  - tag prop: always renders <view> (no HTML tag switching in Lynx)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Icon from '../Icon/index.vue';
import './index.less';

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

const [, bem] = createNamespace('nav-bar');

const slots = useSlots();

const hasLeft = computed(
  () => props.leftArrow || props.leftText || !!slots.left,
);

const hasRight = computed(() => props.rightText || !!slots.right);

const zIndexStyle = computed(() => {
  if (props.zIndex !== undefined) {
    return { zIndex: Number(props.zIndex) };
  }
  return undefined;
});

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
  <view v-if="fixed && placeholder" class="van-nav-bar__placeholder">
    <view
      :class="[
        bem([{ fixed }]),
        { 'van-hairline--bottom': border, 'van-safe-area-top': safeAreaInsetTop },
      ]"
      :style="zIndexStyle"
    >
      <view :class="bem('content')">
        <!-- Left area -->
        <view
          v-if="hasLeft"
          :class="bem('left', { disabled: leftDisabled })"
          @tap="onClickLeft"
        >
          <slot name="left">
            <Icon
              v-if="leftArrow"
              name="arrow-left"
              :class="bem('arrow')"
            />
            <text v-if="leftText" :class="bem('text')">{{ leftText }}</text>
          </slot>
        </view>

        <!-- Title -->
        <view :class="bem('title')">
          <slot name="title">
            <text :class="bem('title')">{{ title }}</text>
          </slot>
        </view>

        <!-- Right area -->
        <view
          v-if="hasRight"
          :class="bem('right', { disabled: rightDisabled })"
          @tap="onClickRight"
        >
          <slot name="right">
            <text v-if="rightText" :class="bem('text')">{{ rightText }}</text>
          </slot>
        </view>
      </view>
    </view>
  </view>

  <!-- Normal (non-placeholder) rendering -->
  <view
    v-else
    :class="[
      bem([{ fixed }]),
      { 'van-hairline--bottom': border, 'van-safe-area-top': safeAreaInsetTop },
    ]"
    :style="zIndexStyle"
  >
    <view :class="bem('content')">
      <!-- Left area -->
      <view
        v-if="hasLeft"
        :class="bem('left', { disabled: leftDisabled })"
        @tap="onClickLeft"
      >
        <slot name="left">
          <Icon
            v-if="leftArrow"
            name="arrow-left"
            :class="bem('arrow')"
          />
          <text v-if="leftText" :class="bem('text')">{{ leftText }}</text>
        </slot>
      </view>

      <!-- Title -->
      <view :class="bem('title')">
        <slot name="title">
          <text :class="bem('title')">{{ title }}</text>
        </slot>
      </view>

      <!-- Right area -->
      <view
        v-if="hasRight"
        :class="bem('right', { disabled: rightDisabled })"
        @tap="onClickRight"
      >
        <slot name="right">
          <text v-if="rightText" :class="bem('text')">{{ rightText }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
