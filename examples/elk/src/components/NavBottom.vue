<script setup lang="ts">
// Ported from elk-zone/elk:
// app/components/nav/{NavBottom,NavBottomMoreMenu}.vue.
import { computed, ref, watch } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { useUserSettings } from '../composables/settings';
import { currentServer, currentUser } from '../composables/users';
import AppIcon from './AppIcon.vue';
import {
  buildBottomTabs,
  buildMoreMenuItems,
  type NavigationItem,
} from './nav-items';
import Sheet from './sheet/Sheet.vue';

const props = withDefaults(defineProps<{
  safeAreaBottom?: number;
}>(), {
  safeAreaBottom: 0,
});

const router = useRouter();
const route = useRoute();
const settings = useUserSettings();
const sheetVisible = ref(false);
const pressedTab = ref<string | null>(null);
const pressedMenuItem = ref<string | null>(null);

const authenticated = computed(() => !!currentUser.value?.token);
const tabs = computed(() => buildBottomTabs({
  authenticated: authenticated.value,
  server: currentServer.value,
}));
const menuItems = computed(() => buildMoreMenuItems({
  authenticated: authenticated.value,
  server: currentServer.value,
  activePath: route.path,
}));
const sheetBottomInset = computed(() => 56 + props.safeAreaBottom);

watch(() => route.path, () => {
  sheetVisible.value = false;
});

function isTabActive(tab: NavigationItem): boolean {
  if (tab.kind === 'more')
    return sheetVisible.value;
  if (!tab.to)
    return false;
  if (tab.key === 'federated')
    return route.path === tab.to;
  return route.path === tab.to || route.path.startsWith(`${tab.to}/`);
}

function tabIconColor(tab: NavigationItem): string {
  return isTabActive(tab) ? '#cc7d24' : settings.colorMode === 'dark' ? '#888888' : '#686868';
}

function menuIconColor(item: NavigationItem): string {
  if (item.disabled)
    return settings.colorMode === 'dark' ? '#4d4d4d' : '#bdbdbd';
  if (item.active)
    return '#cc7d24';
  return settings.colorMode === 'dark' ? '#f3f3f3' : '#232323';
}

function releaseTab() {
  pressedTab.value = null;
}

function releaseMenuItem() {
  pressedMenuItem.value = null;
}

function selectTab(tab: NavigationItem) {
  if (tab.kind === 'more') {
    sheetVisible.value = !sheetVisible.value;
    return;
  }
  if (tab.to) {
    sheetVisible.value = false;
    router.push(tab.to);
  }
}

function selectMenuItem(item: NavigationItem) {
  if (item.disabled || !item.to)
    return;
  sheetVisible.value = false;
  router.push(item.to);
}

function toggleTheme() {
  settings.colorMode = settings.colorMode === 'dark' ? 'light' : 'dark';
}

function toggleZenMode() {
  settings.zenMode = !settings.zenMode;
}
</script>

<template>
  <view class="nav-shell">
    <Sheet
      v-model="sheetVisible"
      :bottom-inset="sheetBottomInset"
      :top-inset="144"
      :dismiss-distance="120"
    >
      <view class="nav-sheet-content">
        <view class="nav-sheet-routes">
          <view
            v-for="item in menuItems"
            :key="item.key"
            class="nav-sheet-item"
            :class="[
              item.active ? 'nav-sheet-item-active' : '',
              item.disabled ? 'nav-sheet-item-disabled' : '',
              pressedMenuItem === item.key ? 'nav-sheet-item-pressed' : '',
            ]"
            @touchstart="pressedMenuItem = item.key"
            @touchend="releaseMenuItem"
            @touchcancel="releaseMenuItem"
            @tap="selectMenuItem(item)"
          >
            <AppIcon :name="item.icon" :size="20" :color="menuIconColor(item)" />
            <text class="nav-sheet-item-label">{{ item.label }}</text>
          </view>
        </view>

        <view class="nav-sheet-divider" />

        <view
          class="nav-sheet-item nav-sheet-function"
          @tap="toggleTheme"
        >
          <AppIcon
            :name="settings.colorMode === 'dark' ? 'moon-line' : 'sun-line'"
            :size="20"
            :color="settings.colorMode === 'dark' ? '#f3f3f3' : '#232323'"
          />
          <text class="nav-sheet-item-label">
            {{ settings.colorMode === 'dark' ? 'Toggle Light Mode' : 'Toggle Dark Mode' }}
          </text>
        </view>
        <view
          class="nav-sheet-item nav-sheet-function"
          @tap="toggleZenMode"
        >
          <AppIcon
            :name="settings.zenMode ? 'layout-right-2-line' : 'layout-right-line'"
            :size="20"
            :color="settings.colorMode === 'dark' ? '#f3f3f3' : '#232323'"
          />
          <text class="nav-sheet-item-label">Zen Mode</text>
        </view>
      </view>
    </Sheet>

    <view class="nav-bottom">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="nav-bottom-tab"
        :class="[
          isTabActive(tab) ? 'nav-bottom-tab-active' : '',
          pressedTab === tab.key ? 'nav-bottom-tab-pressed' : '',
        ]"
        @touchstart="pressedTab = tab.key"
        @touchend="releaseTab"
        @touchcancel="releaseTab"
        @tap="selectTab(tab)"
      >
        <AppIcon
          :name="tab.kind === 'more' && sheetVisible ? 'close-line' : tab.icon"
          :size="22"
          :color="tabIconColor(tab)"
        />
      </view>
    </view>
  </view>
</template>

<style>
.nav-shell {
  width: 100%;
  height: 56px;
  flex-shrink: 0;
}

.nav-bottom {
  position: relative;
  z-index: 21;
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

.nav-bottom-tab-pressed,
.nav-sheet-item-pressed {
  transform: scale(0.9);
  opacity: 0.7;
}

.nav-bottom-tab-active {
  opacity: 1;
}

.nav-sheet-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 8px;
  padding-bottom: 24px;
}

.nav-sheet-routes {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-sheet-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 8px 20px;
  gap: 16px;
  transform: scale(1);
  opacity: 1;
  transition: transform var(--motion-fast) var(--ease-out-quart), opacity var(--motion-fast) var(--ease-out-quart), background-color var(--motion-state) var(--ease-out-quart);
}

.nav-sheet-item-label {
  font-size: 14px;
  line-height: 20px;
  color: var(--c-text-base);
}

.nav-sheet-item-active .nav-sheet-item-label {
  color: var(--c-primary);
}

.nav-sheet-item-disabled {
  opacity: 0.45;
}

.nav-sheet-item-disabled .nav-sheet-item-label {
  color: var(--c-text-secondary-light);
}

.nav-sheet-divider {
  height: 1px;
  margin: 8px 12px;
  background-color: var(--c-border-dark);
}

.nav-sheet-function {
  margin-top: 2px;
}
</style>
