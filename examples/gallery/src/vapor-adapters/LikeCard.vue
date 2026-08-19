<script setup lang="ts">
import LikeImageCard from '../Components/LikeImageCard.vue'
import { furnituresPicturesSubArray } from '../Pictures/furnituresPictures.js'

const picture = furnituresPicturesSubArray[0]!
</script>

<template>
  <view class="gallery-wrapper single-card">
    <LikeImageCard :picture="picture" />
  </view>
</template>
