<script setup lang="ts">
// Ported from elk: app/components/nav/NavBottom.vue — bottom tab bar.
// Elk (guest): explore / local / federated / sign-in. With a session it
// adds home + notifications. Same destinations here.
import { computed, ref } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { currentServer, currentUser } from '../composables/users';
import AppIcon from './AppIcon.vue';

const router = useRouter();
const route = useRoute();
const pressedTab = ref<string | null>(null);

interface Tab {
  icon: string;
  label: string;
  to: string;
  match: string;
}

const tabs = computed<Tab[]>(() => {
  const server = currentServer.value;
  if (currentUser.value?.token) {
    return [
      { icon: 'home-5-line', label: 'Home', to: '/home', match: '/home' },
      { icon: 'search-line', label: 'Search', to: '/search', match: '/search' },
      { icon: 'compass-3-line', label: 'Explore', to: `/${server}/explore`, match: '/explore' },
      { icon: 'notification-4-line', label: 'Notifications', to: '/notifications', match: '/notifications' },
      { icon: 'settings-3-line', label: 'Settings', to: '/settings', match: '/settings' },
    ];
  }
  return [
    { icon: 'compass-3-line', label: 'Explore', to: `/${server}/explore`, match: '/explore' },
    { icon: 'group-2-line', label: 'Local', to: `/${server}/public/local`, match: '/public/local' },
    { icon: 'earth-line', label: 'Federated', to: `/${server}/public`, match: '/public$' },
    { icon: 'search-line', label: 'Search', to: '/search', match: '/search' },
    { icon: 'settings-3-line', label: 'Settings', to: '/settings', match: '/settings' },
  ];
});

function isActive(tab: Tab): boolean {
  if (tab.match.endsWith('$'))
    return route.path.endsWith(tab.match.slice(0, -1));
  return route.path.includes(tab.match);
}

function releaseTab() {
  pressedTab.value = null;
}
</script>

<template>
  <view class="nav-bottom">
    <view
      v-for="tab in tabs"
      :key="tab.label"
      class="nav-bottom-tab"
      :class="[
        isActive(tab) ? 'nav-bottom-tab-active' : '',
        pressedTab === tab.label ? 'nav-bottom-tab-pressed' : '',
      ]"
      @touchstart="pressedTab = tab.label"
      @touchend="releaseTab"
      @touchcancel="releaseTab"
      @tap="router.push(tab.to)"
    >
      <AppIcon :name="tab.icon" :size="22" :color="isActive(tab) ? '#cc7d24' : '#686868'" />
    </view>
  </view>
</template>

<style>
.nav-bottom {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  border-top: 1px solid var(--c-border);
  background-color: var(--c-bg-base);
  flex-shrink: 0;
}

.nav-bottom-tab {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  transition: transform var(--motion-fast) var(--ease-out-quart), opacity var(--motion-fast) var(--ease-out-quart);
}

.nav-bottom-tab-pressed {
  transform: scale(0.88);
  opacity: 0.7;
}

.nav-bottom-tab-active {
  opacity: 1;
}
</style>
