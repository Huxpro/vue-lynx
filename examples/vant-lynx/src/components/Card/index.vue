<!--
  @component VantCard (Lynx port)
  @see https://github.com/youzan/vant/blob/main/packages/vant/src/card/Card.tsx

  === Feature Parity with Vant ===
  Props (Vant -> Lynx):
    [x] tag                  - string (corner tag text)
    [x] num                  - string | number
    [x] desc                 - string
    [x] thumb                - string (image URL)
    [x] title                - string
    [x] price                - string | number
    [x] currency             - string (default '¥')
    [x] originPrice          - string | number
    [x] centered             - boolean (vertically center content)
    [x] lazyLoad             - boolean (accepted, image lazy-load not implemented in Lynx)
    [ ] thumbLink            - MISSING: link URL when clicking thumb

  Events (Vant -> Lynx):
    [x] click                - (event) => void
    [x] clickThumb           - (event) => void

  Slots (Vant -> Lynx):
    [x] thumb                - custom thumb content
    [x] tag                  - custom tag content
    [x] title                - custom title
    [x] desc                 - custom description
    [x] price                - custom price
    [x] num                  - custom num display
    [x] footer               - footer content
    [x] bottom               - bottom content
    [ ] price-top            - MISSING: content above price
    [ ] tags                 - MISSING: custom tags below desc

  Lynx-specific notes:
    - Uses inline styles with explicit display: 'flex' (Lynx default is linear)
    - <image> element used instead of Vant's <Image> component
    - Tag rendered as absolute-positioned view, not Vant's <Tag> component
    - Price split into integer/decimal not done (single text display)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface CardProps {
  title?: string;
  desc?: string;
  num?: string | number;
  price?: string | number;
  currency?: string;
  thumb?: string;
  thumbLink?: string;
  tag?: string;
  originPrice?: string | number;
  centered?: boolean;
  lazyLoad?: boolean;
}

const props = withDefaults(defineProps<CardProps>(), {
  currency: '¥',
  centered: false,
  lazyLoad: false,
});

const emit = defineEmits<{
  click: [event: any];
  clickThumb: [event: any];
}>();

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  padding: 8,
  backgroundColor: '#fafafa',
  borderRadius: 8,
}));

const thumbStyle = {
  width: 88,
  height: 88,
  borderRadius: 8,
  backgroundColor: '#f2f3f5',
  overflow: 'hidden' as const,
  flexShrink: 0,
  position: 'relative' as const,
};

const thumbImageStyle = {
  width: 88,
  height: 88,
};

const contentStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: props.centered ? 'center' as const : 'flex-start' as const,
  marginLeft: 12,
  minHeight: 88,
}));

const titleStyle = {
  fontSize: 14,
  fontWeight: 'bold' as const,
  color: '#323233',
  lineHeight: 20,
};

const descStyle = {
  fontSize: 12,
  color: '#969799',
  lineHeight: 18,
  marginTop: 4,
};

const priceStyle = {
  fontSize: 14,
  fontWeight: 'bold' as const,
  color: '#ee0a24',
  marginTop: 4,
};

const originPriceStyle = {
  fontSize: 12,
  color: '#969799',
  textDecorationLine: 'line-through' as const,
  marginLeft: 4,
};

const numStyle = {
  fontSize: 12,
  color: '#969799',
};

const tagStyle = {
  position: 'absolute' as const,
  top: 2,
  left: 0,
  backgroundColor: '#ee0a24',
  paddingTop: 1,
  paddingBottom: 1,
  paddingLeft: 4,
  paddingRight: 4,
  borderTopRightRadius: 4,
  borderBottomRightRadius: 4,
};

const tagTextStyle = {
  fontSize: 10,
  color: '#fff',
};

const bottomRowStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto' as const,
};

const priceRowStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'baseline',
};

function onTap(event: any) {
  emit('click', event);
}

function onThumbTap(event: any) {
  emit('clickThumb', event);
}
</script>

<template>
  <view :style="containerStyle" @tap="onTap">
    <!-- Thumb -->
    <view :style="thumbStyle" @tap.stop="onThumbTap">
      <slot name="thumb">
        <image v-if="thumb" :src="thumb" :style="thumbImageStyle" />
      </slot>
      <!-- Tag -->
      <view v-if="tag" :style="tagStyle">
        <slot name="tag">
          <text :style="tagTextStyle">{{ tag }}</text>
        </slot>
      </view>
    </view>

    <!-- Content -->
    <view :style="contentStyle">
      <!-- Title -->
      <slot name="title">
        <text v-if="title" :style="titleStyle">{{ title }}</text>
      </slot>

      <!-- Description -->
      <slot name="desc">
        <text v-if="desc" :style="descStyle">{{ desc }}</text>
      </slot>

      <!-- Bottom Section -->
      <view :style="bottomRowStyle">
        <!-- Price -->
        <view :style="priceRowStyle">
          <slot name="price">
            <text v-if="price !== undefined" :style="priceStyle">{{ currency }}{{ price }}</text>
          </slot>
          <text v-if="originPrice !== undefined" :style="originPriceStyle">{{ currency }}{{ originPrice }}</text>
        </view>

        <!-- Num -->
        <slot name="num">
          <text v-if="num !== undefined" :style="numStyle">x{{ num }}</text>
        </slot>
      </view>

      <!-- Footer slot -->
      <slot name="footer" />

      <!-- Bottom slot -->
      <slot name="bottom" />
    </view>
  </view>
</template>
