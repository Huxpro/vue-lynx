<script setup lang="ts">
import { RouterView } from 'vue-router';
import { validFeeds } from './api';
import NavLink from './components/NavLink.vue';
import logoUrl from './assets/lynx-logo.png';

import './App.css';

const feedKeys = Object.keys(validFeeds);
</script>

<template>
  <view class="w-full h-full bg-hn-bg flex flex-col">
    <!-- Header: 55px, matching reference -->
    <view
      class="bg-hn-green flex flex-col"
      :style="{ height: '55px', paddingLeft: '15px', paddingRight: '15px' }"
    >
      <scroll-view
        scroll-x
        class="flex-1"
        :style="{ height: '100%' }"
        :content-container-style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }"
      >
        <!-- Logo: Lynx logo with thin white border (YC-style) -->
        <view
          :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }"
        >
          <view
            class="flex-shrink-0"
            :style="{ width: '26px', height: '26px', borderWidth: '1px', borderColor: '#fff', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
          >
            <image
              :src="logoUrl"
              :style="{ width: '24px', height: '24px' }"
              resize="cover"
            />
          </view>
        </view>

        <!-- Feed nav links -->
        <NavLink
          v-for="key in feedKeys"
          :key="key"
          :to="`/${key}`"
          :label="validFeeds[key].title"
        />

        <!-- Built with VueLynx -->
        <view
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
          }"
        >
          <text
            :style="{
              color: '#fff',
              fontSize: '14px',
              fontWeight: '300',
              letterSpacing: '0.075em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }"
          >
            Built with VueLynx
          </text>
        </view>
      </scroll-view>
    </view>

    <!-- Route content: fade on route type change, NOT on pagination -->
    <RouterView v-slot="{ Component, route }">
      <Transition name="fade" mode="out-in" :duration="200">
        <component
          :is="Component"
          :key="(route.params.feed as string) || route.name"
        />
      </Transition>
    </RouterView>
  </view>
</template>

<style>
/* Fade: for switching between route types (feed→item, feed→user, news→ask) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
