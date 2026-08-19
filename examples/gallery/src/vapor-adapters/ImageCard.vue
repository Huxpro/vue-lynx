<script setup lang="ts">
import ImageCard from '../ImageCard/ImageCard.vue'
import { furnituresPicturesSubArray } from '../Pictures/furnituresPictures.js'

const picture = furnituresPicturesSubArray[0]!
</script>

<template>
  <view class="gallery-wrapper single-card">
    <ImageCard :picture="picture" />
  </view>
</template>
