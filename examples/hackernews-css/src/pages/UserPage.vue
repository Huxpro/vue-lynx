<script setup lang="ts">
import { computed } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { fetchUser } from '../api';
import Spinner from '../components/Spinner.vue';
import { openExternalUrl, stripHtml } from '../utils';

const route = useRoute();
const router = useRouter();

const userId = computed(() => String(route.params.id ?? ''));

const { data: user, isLoading, isError } = useQuery({
  queryKey: computed(() => ['user', userId.value]),
  queryFn: () => fetchUser(userId.value),
  staleTime: 60 * 1000,
});

function goBack() {
  router.back();
}

function openSubmissions() {
  if (user.value) {
    openExternalUrl(`https://news.ycombinator.com/submitted?id=${user.value.id}`);
  }
}

function openComments() {
  if (user.value) {
    openExternalUrl(`https://news.ycombinator.com/threads?id=${user.value.id}`);
  }
}
</script>

<template>
  <scroll-view class="view page-scroll" scroll-orientation="vertical">
    <view v-if="isLoading" class="status-card">
      <Spinner :show="true" />
    </view>

    <view v-else-if="isError" class="status-card">
      <text class="status-title">User not found.</text>
      <text class="back-link" @tap="goBack">&lt; Back</text>
    </view>

    <view v-else-if="user" class="user-view">
      <text class="back-link" @tap="goBack">&lt; Back</text>
      <text class="user-title">User : {{ user.id }}</text>

      <view class="meta">
        <view class="meta-row">
          <text class="label">Created:</text>
          <text>{{ user.created }}</text>
        </view>
        <view class="meta-row">
          <text class="label">Karma:</text>
          <text>{{ user.karma }}</text>
        </view>
      </view>

      <text v-if="user.about" class="about">{{ stripHtml(user.about) }}</text>

      <view class="links">
        <text class="links-link" @tap="openSubmissions">submissions</text>
        <text>|</text>
        <text class="links-link" @tap="openComments">comments</text>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss">
.page-scroll {
  height: 100%;
  padding-bottom: 30px;
}

.user-view {
  background-color: #fff;
  box-sizing: border-box;
  padding: 2em 3em;
  margin-top: 30px;
}

.user-title {
  margin: 0;
  font-size: 1.5em;
}

.meta {
  padding: 0;
  margin-top: 1em;
}

.meta-row {
  display: flex;
  flex-direction: row;
  margin-bottom: 4px;
}

.label {
  display: inline-block;
  min-width: 4em;
  color: #595959;
}

.about {
  margin: 1em 0;
  white-space: pre-wrap;
  line-height: 1.5em;
}

.links {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.links-link {
  text-decoration: underline;
}

.back-link {
  color: #3eaf7c;
  font-size: 0.85em;
  text-decoration: underline;
  margin-bottom: 12px;
}

.status-card {
  background-color: #fff;
  margin-top: 30px;
  padding: 2em 3em;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-title {
  font-size: 1.5em;
}
</style>
