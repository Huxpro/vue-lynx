<script setup lang="ts">
import { ref } from 'vue';
import Swiper from './Swiper.vue';
import Page from '../Components/Page.vue';
import TabHeader from '../Components/TabHeader.vue';
import SafeArea from '../Components/SafeArea.vue';
import { picsArr } from '../utils/pics.js';
import { easings } from '../utils/useAnimate.js';

const tabs = ['Photos', 'Details'];
const activeTab = ref(0);
const isFullscreen = ref(false);

function onTabChange(index: number) {
  activeTab.value = index;
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}
</script>

<template>
  <!-- Normal mode: standard layout -->
  <Page v-if="!isFullscreen">
    <view class="tab-strip">
      <TabHeader
        :tabs="tabs"
        :active-tab="activeTab"
        :is-fullscreen="false"
        @tab-change="onTabChange"
        @toggle-fullscreen="toggleFullscreen"
      />
    </view>
    <Swiper
      v-if="activeTab === 0"
      :data="picsArr"
      :duration="300"
      :main-thread-easing="easings.easeInOutQuad"
    />
    <view v-if="activeTab === 1" class="details-tab">
      <text class="details-title">Product Details</text>
      <text class="details-text">
        Premium single leather seat with ergonomic design.
        Crafted from high-quality genuine leather with a
        reinforced steel frame for lasting durability.
      </text>
    </view>
  </Page>

  <!-- Fullscreen mode: player fills the entire viewport -->
  <SafeArea v-if="isFullscreen">
    <view class="fullscreen-container">
      <!-- Floating tab header overlay -->
      <view class="fullscreen-header-wrap">
        <TabHeader
          :tabs="tabs"
          :active-tab="activeTab"
          :is-fullscreen="true"
          @tab-change="onTabChange"
          @toggle-fullscreen="toggleFullscreen"
        />
      </view>

      <!-- Content fills the screen -->
      <Swiper
        v-if="activeTab === 0"
        :data="picsArr"
        :duration="300"
        :main-thread-easing="easings.easeInOutQuad"
      />
      <view v-if="activeTab === 1" class="details-tab details-tab-fullscreen">
        <text class="details-title">Product Details</text>
        <text class="details-text">
          Premium single leather seat with ergonomic design.
          Crafted from high-quality genuine leather with a
          reinforced steel frame for lasting durability.
        </text>
      </view>
    </view>
  </SafeArea>
</template>
