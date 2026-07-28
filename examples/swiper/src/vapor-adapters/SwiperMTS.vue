<script setup lang="ts">
import Page from '../Components/Page.vue'
import SwiperComponent from '../SwiperMTS/Swiper.vue'
import { picsArr } from '../utils/pics.js'
</script>

<template>
  <Page>
    <SwiperComponent :data="picsArr" />
  </Page>
</template>
