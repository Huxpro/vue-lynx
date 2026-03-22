<!--
  Lynx Limitations:
  - thumbLink: <a> tags not supported in Lynx, thumbLink prop accepted for API compat but no-op
  - lazyLoad: No IntersectionObserver / $Lazyload plugin in Lynx
  - van-multi-ellipsis--l2 / van-ellipsis: CSS text-overflow ellipsis classes not applied (Lynx text truncation differs)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import Tag from '../Tag/index.vue';
import Image from '../Image/index.vue';
import './index.less';

interface CardProps {
  tag?: string;
  num?: string | number;
  desc?: string;
  thumb?: string;
  title?: string;
  price?: string | number;
  centered?: boolean;
  lazyLoad?: boolean;
  currency?: string;
  thumbLink?: string;
  originPrice?: string | number;
}

const props = withDefaults(defineProps<CardProps>(), {
  currency: '¥',
});

const emit = defineEmits<{
  clickThumb: [event: Event];
}>();

const slots = useSlots();

function isDef(val: unknown): boolean {
  return val !== undefined && val !== null;
}

const showNum = computed(() => !!slots.num || isDef(props.num));
const showPrice = computed(() => !!slots.price || isDef(props.price));
const showOriginPrice = computed(() => !!slots['origin-price'] || isDef(props.originPrice));
const showBottom = computed(() => showNum.value || showPrice.value || showOriginPrice.value || !!slots.bottom);
const showThumb = computed(() => !!slots.thumb || !!props.thumb);

const priceArr = computed(() => {
  if (!isDef(props.price)) return [];
  return props.price!.toString().split('.');
});

const contentClass = computed(() => {
  const classes = ['van-card__content'];
  if (props.centered) {
    classes.push('van-card__content--centered');
  }
  return classes.join(' ');
});

function onThumbClick(event: Event) {
  emit('clickThumb', event);
}
</script>

<template>
  <view class="van-card">
    <view class="van-card__header">
      <!-- Thumb -->
      <view v-if="showThumb" class="van-card__thumb" @tap="onThumbClick">
        <slot name="thumb">
          <Image
            v-if="thumb"
            :src="thumb"
            fit="cover"
            width="100%"
            height="100%"
          />
        </slot>
        <view v-if="$slots.tag || tag" class="van-card__tag">
          <slot name="tag">
            <Tag mark type="primary">{{ tag }}</Tag>
          </slot>
        </view>
      </view>

      <!-- Content -->
      <view :class="contentClass">
        <view>
          <!-- Title -->
          <slot name="title">
            <view v-if="title" class="van-card__title">
              <text>{{ title }}</text>
            </view>
          </slot>

          <!-- Desc -->
          <slot name="desc">
            <view v-if="desc" class="van-card__desc">
              <text>{{ desc }}</text>
            </view>
          </slot>

          <!-- Tags slot -->
          <slot name="tags" />
        </view>

        <!-- Bottom -->
        <view v-if="showBottom" class="van-card__bottom">
          <slot name="price-top" />
          <!-- Price -->
          <view v-if="showPrice" class="van-card__price">
            <slot name="price">
              <text class="van-card__price-currency">{{ currency }}</text>
              <text class="van-card__price-integer">{{ priceArr[0] }}</text>
              <template v-if="priceArr.length > 1">
                <text>.</text>
                <text class="van-card__price-decimal">{{ priceArr[1] }}</text>
              </template>
            </slot>
          </view>
          <!-- Origin Price -->
          <view v-if="showOriginPrice" class="van-card__origin-price">
            <slot name="origin-price">
              <text>{{ currency }} {{ originPrice }}</text>
            </slot>
          </view>
          <!-- Num -->
          <view v-if="showNum" class="van-card__num">
            <slot name="num">
              <text>x{{ num }}</text>
            </slot>
          </view>
          <slot name="bottom" />
        </view>
      </view>
    </view>

    <!-- Footer -->
    <view v-if="$slots.footer" class="van-card__footer">
      <slot name="footer" />
    </view>
  </view>
</template>
