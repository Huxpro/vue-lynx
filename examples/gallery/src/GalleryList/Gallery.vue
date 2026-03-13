<script setup lang="ts">
import { furnituresPictures } from '../Pictures/furnituresPictures';
import { calculateEstimatedSize } from '../utils';

import LikeImageCard from '../Components/LikeImageCard.vue';
</script>

<template>
  <view class="gallery-wrapper">
    <list
      class="list"
      list-type="waterfall"
      :column-count="2"
      scroll-orientation="vertical"
      custom-list-name="list-container"
    >
      <list-item
        v-for="(pic, i) in furnituresPictures"
        :key="i"
        :item-key="String(i)"
        :estimated-main-axis-size-px="calculateEstimatedSize(pic.width, pic.height)"
      >
        <LikeImageCard :picture="pic" />
      </list-item>
    </list>
  </view>
</template>
