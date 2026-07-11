<script setup lang="ts">
// Ported from elk: app/components/nav/NavBottom.vue — bottom tab bar.
// Elk (guest): explore / local / federated / sign-in. With a session it
// adds home + notifications. Same destinations here.
import { computed } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { currentServer, currentUser } from '../composables/users';
import AppIcon from './AppIcon.vue';

const router = useRouter();
const route = useRoute();

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
</script>

<template>
  <view class="nav-bottom">
    <view
      v-for="tab in tabs"
      :key="tab.label"
      class="nav-bottom-tab"
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
  height: 52px;
  border-top: 1px solid var(--c-border);
  background-color: var(--c-bg-base);
  flex-shrink: 0;
}

.nav-bottom-tab {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}
</style>
