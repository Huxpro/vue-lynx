<script setup lang="ts">
// Ported from elk: app/pages/settings/* (reduced to the preferences that
// drive ported features) + a token sign-in form replacing Elk's OAuth
// redirect flow (see PRD "Core infrastructure").
import { ref } from 'vue-lynx';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import { mastoLogin } from '../composables/masto';
import { togglePreference, useUserSettings } from '../composables/settings';
import { currentServer, currentUser, DEFAULT_SERVER, publicServer } from '../composables/users';

const settings = useUserSettings();

const server = ref(currentServer.value);
const token = ref('');
const switching = ref(false);

function onServerInput(e: { detail?: { value?: string } }) {
  server.value = e.detail?.value ?? '';
}

function onTokenInput(e: { detail?: { value?: string } }) {
  token.value = e.detail?.value ?? '';
}

async function apply() {
  const s = server.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!s || switching.value)
    return;
  switching.value = true;
  try {
    mastoLogin({ server: s, token: token.value.trim() || undefined });
  }
  finally {
    switching.value = false;
  }
}

function signOut() {
  currentUser.value = undefined;
  token.value = '';
  mastoLogin({ server: publicServer.value || DEFAULT_SERVER });
}
</script>

<template>
  <view class="page">
    <PageHeader title="Settings" icon="settings-3-line" />
    <scroll-view scroll-orientation="vertical" class="settings-scroll">
      <!-- Instance / session -->
      <text class="settings-section">Instance</text>
      <view class="settings-card">
        <text class="settings-label">Server</text>
        <input
          class="settings-input"
          type="text"
          :value="server"
          placeholder="mastodon.social"
          @input="onServerInput"
        />
        <text class="settings-label">Access token (optional — enables home timeline, notifications, posting)</text>
        <input
          class="settings-input"
          type="text"
          :value="token"
          placeholder="Paste a personal access token"
          @input="onTokenInput"
        />
        <view class="settings-row">
          <view class="settings-btn" @tap="apply">
            <AppIcon name="login-circle-line" :size="16" color="#ffffff" />
            <text class="settings-btn-text">{{ token ? 'Sign in' : 'Browse' }}</text>
          </view>
          <view v-if="currentUser" class="settings-btn settings-btn-secondary" @tap="signOut">
            <AppIcon name="logout-box-r-line" :size="16" color="#686868" />
            <text class="settings-btn-text-secondary">Sign out</text>
          </view>
        </view>
        <text v-if="currentUser?.account" class="settings-session">
          Signed in as @{{ currentUser.account.acct }}@{{ currentUser.server }}
        </text>
        <text v-else class="settings-session">Browsing {{ currentServer }} as guest</text>
      </view>

      <!-- Preferences (Elk settings/preferences) -->
      <text class="settings-section">Timeline preferences</text>
      <view class="settings-card">
        <view class="settings-toggle" @tap="togglePreference('hideBoostsInTimeline')">
          <text class="settings-toggle-label">Hide boosts in timeline</text>
          <AppIcon
            :name="settings.hideBoostsInTimeline ? 'checkbox-circle-line' : 'checkbox-blank-circle-line'"
            :size="20"
            :color="settings.hideBoostsInTimeline ? '#cc7d24' : '#919191'"
          />
        </view>
        <view class="settings-toggle" @tap="togglePreference('hideRepliesInTimeline')">
          <text class="settings-toggle-label">Hide replies in timeline</text>
          <AppIcon
            :name="settings.hideRepliesInTimeline ? 'checkbox-circle-line' : 'checkbox-blank-circle-line'"
            :size="20"
            :color="settings.hideRepliesInTimeline ? '#cc7d24' : '#919191'"
          />
        </view>
      </view>

      <text class="settings-section">About</text>
      <view class="settings-card">
        <text class="settings-about">
          Elk on Lynx — a port of the Elk Mastodon client to Vue Lynx.
          Reuses Elk's masto.js API layer, content renderer pipeline and
          domain logic; rebuilds every template on Lynx native elements.
        </text>
      </view>
      <view class="settings-bottom-pad" />
    </scroll-view>
  </view>
</template>

<style>
.settings-scroll {
  flex: 1;
  width: 100%;
}

.settings-section {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text-secondary);
  padding: 14px 16px 6px;
}

.settings-card {
  display: flex;
  flex-direction: column;
  margin: 0 16px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 12px;
  gap: 8px;
  background-color: var(--c-bg-card);
}

.settings-label {
  font-size: 12px;
  color: var(--c-text-secondary);
}

.settings-input {
  height: 38px;
  font-size: 14px;
  color: var(--c-text-base);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 0 10px;
  background-color: var(--c-bg-base);
}

.settings-row {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: 4px;
}

.settings-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  background-color: var(--c-primary);
  border-radius: 8px;
  padding: 7px 14px;
}

.settings-btn-secondary {
  background-color: var(--c-bg-active);
}

.settings-btn-text {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.settings-btn-text-secondary {
  color: var(--c-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.settings-session {
  font-size: 12px;
  color: var(--c-text-secondary-light);
}

.settings-toggle {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.settings-toggle-label {
  font-size: 14px;
  color: var(--c-text-base);
}

.settings-about {
  font-size: 13px;
  line-height: 19px;
  color: var(--c-text-secondary);
}

.settings-bottom-pad {
  height: 40px;
}
</style>
