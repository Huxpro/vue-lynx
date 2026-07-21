<script setup lang="ts">
import { RouterView } from 'vue-router';
import { validFeeds } from './api';
import NavLink from './components/NavLink.vue';
import logoUrl from './assets/lynx-logo.png';

import './App.css';

const feedKeys = Object.keys(validFeeds);
</script>

<template>
  <!--
    Layout lives on an inner <view>, not <page>.
    On Lynx for Web, page maps to div[part=page]; Tailwind flex utilities that
    only set CSS variables (or that page doesn't resolve) leave the root in
    flex-direction:row — the header eats the full width and flex-1 content
    collapses to width:0. A real <view> applies flex-col correctly.
  -->
  <page class="w-full h-full bg-hn-bg">
    <view
      class="w-full h-full flex flex-col"
      :style="{ flexDirection: 'column' }"
    >
      <!-- Header: 55px, matching reference -->
      <view
        class="bg-hn-green flex flex-col"
        :style="{ height: '55px', flexShrink: 0 }"
      >
        <scroll-view
          scroll-x
          scroll-orientation="horizontal"
          class="flex-1"
          :style="{ height: '100%' }"
        >
          <view
            class="flex flex-row items-center h-full"
            :style="{ minWidth: '100%' }"
          >
            <!-- Logo: Lynx logo with thin white border (YC-style) -->
            <view
              :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '15px', marginRight: '12px' }"
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
                marginRight: '15px',
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
          </view>
        </scroll-view>
      </view>

      <!-- Route content: fade on route type change, NOT on pagination -->
      <view
        class="flex flex-col flex-1"
        :style="{ minHeight: 0, width: '100%', flexDirection: 'column' }"
      >
        <RouterView v-slot="{ Component, route }">
          <Transition name="fade" mode="out-in" :duration="200">
            <component
              :is="Component"
              :key="(route.params.feed as string) || route.name"
            />
          </Transition>
        </RouterView>
      </view>
    </view>
  </page>
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
