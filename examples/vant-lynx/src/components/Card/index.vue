<!--
  Lynx Limitations:
  - thumbLink: <a> tags not supported in Lynx, thumbLink prop accepted for API compat but no-op
  - lazyLoad: No IntersectionObserver / $Lazyload plugin in Lynx
  - van-multi-ellipsis--l2 / van-ellipsis: CSS text-overflow ellipsis classes not applied (Lynx text truncation differs)
  - float: right on num (Lynx uses margin-left: auto in flex row instead)
  - display: inline-block (Lynx uses inline-flex instead)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import Tag from '../Tag/index.vue';
import Image from '../Image/index.vue';
import type { CardProps } from './types';
import './index.less';

const [name, bem] = createNamespace('card');

const props = withDefaults(defineProps<CardProps>(), {
  currency: '¥',
});

const emit = defineEmits<{
  clickThumb: [event: Event];
}>();

const slots = useSlots();

const showNum = computed(() => !!slots.num || isDef(props.num));
const showPrice = computed(() => !!slots.price || isDef(props.price));
const showOriginPrice = computed(() => !!slots['origin-price'] || isDef(props.originPrice));
const showBottom = computed(() => showNum.value || showPrice.value || showOriginPrice.value || !!slots.bottom);
const showThumb = computed(() => !!slots.thumb || !!props.thumb);

const priceArr = computed(() => {
  if (!isDef(props.price)) return [];
  return props.price!.toString().split('.');
});

function onThumbClick(event: Event) {
  emit('clickThumb', event);
}
</script>

<template>
  <view :class="bem()">
    <view :class="bem('header')">
      <!-- Thumb -->
      <view v-if="showThumb" :class="bem('thumb')" @tap="onThumbClick">
        <slot name="thumb">
          <Image
            v-if="thumb"
            :src="thumb"
            fit="cover"
            width="100%"
            height="100%"
          />
        </slot>
        <view v-if="$slots.tag || tag" :class="bem('tag')">
          <slot name="tag">
            <Tag mark type="primary">{{ tag }}</Tag>
          </slot>
        </view>
      </view>

      <!-- Content -->
      <view :class="bem('content', { centered })">
        <view>
          <!-- Title -->
          <slot name="title">
            <view v-if="title" :class="bem('title')">
              <text>{{ title }}</text>
            </view>
          </slot>

          <!-- Desc -->
          <slot name="desc">
            <view v-if="desc" :class="bem('desc')">
              <text>{{ desc }}</text>
            </view>
          </slot>

          <!-- Tags slot -->
          <slot name="tags" />
        </view>

        <!-- Bottom -->
        <view v-if="showBottom" :class="bem('bottom')">
          <slot name="price-top" />
          <!-- Price -->
          <view v-if="showPrice" :class="bem('price')">
            <slot name="price">
              <text :class="bem('price-currency')">{{ currency }}</text>
              <text :class="bem('price-integer')">{{ priceArr[0] }}</text>
              <template v-if="priceArr.length > 1">
                <text>.</text>
                <text :class="bem('price-decimal')">{{ priceArr[1] }}</text>
              </template>
            </slot>
          </view>
          <!-- Origin Price -->
          <view v-if="showOriginPrice" :class="bem('origin-price')">
            <slot name="origin-price">
              <text>{{ currency }} {{ originPrice }}</text>
            </slot>
          </view>
          <!-- Num -->
          <view v-if="showNum" :class="bem('num')">
            <slot name="num">
              <text>x{{ num }}</text>
            </slot>
          </view>
          <slot name="bottom" />
        </view>
      </view>
    </view>

    <!-- Footer -->
    <view v-if="$slots.footer" :class="bem('footer')">
      <slot name="footer" />
    </view>
  </view>
</template>
