<script setup lang="ts">
import Page from '../Components/Page.vue'
import Swiper from '../Swiper/Swiper.vue'
import { picsArr } from '../utils/pics.js'
import { easings } from '../utils/useAnimate.js'
</script>

<template>
  <Page>
    <Swiper :data="picsArr" :duration="300" :main-thread-easing="easings.easeInOutQuad" />
  </Page>
</template>
