<script setup lang="ts">
import { ref } from 'vue-lynx';

import redHeart from '../Pictures/redHeart.png';
import whiteHeart from '../Pictures/whiteHeart.png';

const isLiked = ref(false);

function onTap() {
  isLiked.value = true;
}
</script>

<template>
  <view class="like-icon" @tap="onTap">
    <view v-if="isLiked" class="circle" />
    <view v-if="isLiked" class="circle circleAfter" />
    <image :src="isLiked ? redHeart : whiteHeart" class="heart-love" />
  </view>
</template>
