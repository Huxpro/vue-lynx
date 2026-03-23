<script setup lang="ts">
import { computed } from 'vue-lynx';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { validFeeds } from './api';
import NavLink from './components/NavLink.vue';
import { openExternalUrl } from './utils';
import logoUrl from './assets/lynx-logo.png';

const router = useRouter();
const route = useRoute();

const feedKeys = Object.keys(validFeeds);
const activeFeed = computed(() =>
  route.name === 'feed-page' && typeof route.params.feed === 'string'
    ? route.params.feed
    : '',
);
const transitionKey = computed(
  () => activeFeed.value || String(route.name ?? 'route'),
);

function goHome() {
  router.push('/');
}

function openVueReference() {
  openExternalUrl('https://github.com/Huxpro/vue-lynx');
}
</script>

<template>
  <page class="page">
    <view class="header">
      <view class="inner">
        <view class="logo" @tap="goHome">
          <image class="logo-image" :src="logoUrl" resize="cover" />
        </view>

        <NavLink
          v-for="key in feedKeys"
          :key="key"
          :to="`/${key}`"
          :label="validFeeds[key].title"
          :active="activeFeed === key"
        />

        <text class="github" @tap="openVueReference">Built with VueLynx</text>
      </view>
    </view>

    <view class="route-shell">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in" :duration="200">
          <component :is="Component" :key="transitionKey" />
        </Transition>
      </RouterView>
    </view>
  </page>
</template>

<style lang="scss">
.page {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  background-color: #f2f3f5;
  color: #2e495e;
}

.header {
  background-color: #3eaf7c;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  height: 55px;

  .inner {
    max-width: 800px;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 15px 5px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .nav-link,
  .github {
    color: #fff;
    line-height: 24px;
    transition: color 0.15s ease;
    font-weight: 300;
    letter-spacing: 0.075em;
    margin-right: 1.8em;
    white-space: nowrap;
  }

  .nav-link.router-link-active {
    font-weight: 600;
  }

  .github {
    font-size: 0.9em;
    margin-left: auto;
    margin-right: 0;
  }
}

.route-shell {
  padding-top: 55px;
}

.logo {
  width: 26px;
  height: 26px;
  margin-right: 12px;
  border-width: 1px;
  border-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-image {
  width: 24px;
  height: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .header .inner {
    padding: 15px 30px;
  }
}

@media (max-width: 600px) {
  .header {
    .inner {
      padding: 15px;
    }

    .nav-link {
      margin-right: 1em;
    }

    .github {
      display: none;
    }
  }
}
</style>
