<script setup lang="ts">
import { computed } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { fetchItem } from '../api';
import Comment from '../components/Comment.vue';
import Spinner from '../components/Spinner.vue';
import { isAbsoluteUrl, openExternalUrl, toHost } from '../utils';

const route = useRoute();
const router = useRouter();

const itemId = computed(() => Number(route.params.id));

const { data: item, isLoading, isError } = useQuery({
  queryKey: computed(() => ['item', itemId.value]),
  queryFn: () => fetchItem(itemId.value),
  staleTime: 60 * 1000,
});

const itemUrl = computed(() => (item.value ? toHost(item.value.url) : ''));

function goBack() {
  router.back();
}

function goToUser() {
  if (item.value) {
    router.push(`/user/${item.value.user}`);
  }
}

function openItemLink() {
  if (item.value && isAbsoluteUrl(item.value.url)) {
    openExternalUrl(item.value.url);
  }
}
</script>

<template>
  <scroll-view class="view item-view" scroll-orientation="vertical">
    <view v-if="isLoading" class="status-card">
      <Spinner :show="true" />
    </view>

    <view v-else-if="isError" class="status-card">
      <text class="status-error">Failed to load item.</text>
    </view>

    <template v-else-if="item">
      <view class="item-view-header">
        <text class="back-link" @tap="goBack">&lt; Back</text>

        <view class="item-title-row">
          <text class="item-title" @tap="openItemLink">{{ item.title }}</text>
          <text v-if="isAbsoluteUrl(item.url)" class="host">{{ itemUrl }}</text>
        </view>

        <view class="meta">
          <text>{{ item.points }} points | by </text>
          <text class="meta-link" @tap="goToUser">{{ item.user }}</text>
          <text> {{ item.time_ago }}</text>
        </view>
      </view>

      <view class="item-view-comments">
        <view class="item-view-comments-header">
          <text>
            {{
              item.comments && item.comments.length
                ? item.comments.length + ' comments'
                : 'No comments yet'
            }}
          </text>
        </view>

        <view class="comment-children">
          <Comment
            v-for="comment in item.comments"
            :key="comment.id"
            :comment="comment"
          />
        </view>
      </view>
    </template>
  </scroll-view>
</template>

<style lang="scss">
.item-view {
  height: 100%;
  padding-bottom: 30px;
}

.item-view-header {
  background-color: #fff;
  padding: 1.8em 2em 1em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  color: #3eaf7c;
  font-size: 0.85em;
  text-decoration: underline;
  margin-bottom: 12px;
}

.item-title-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5em;
}

.item-title {
  font-size: 1.5em;
  margin-right: 0.5em;
}

.item-view-header {
  .host,
  .meta,
  .meta-link {
    color: #595959;
  }

  .meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .meta-link {
    text-decoration: underline;
  }
}

.item-view-comments {
  background-color: #fff;
  margin-top: 10px;
  padding: 0 2em 0.5em;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.item-view-comments-header {
  margin: 0;
  font-size: 1.1em;
  padding: 1em 0;
  position: relative;
}

.comment-children {
  padding: 0;
  margin: 0;
}

.status-card {
  background-color: #fff;
  margin-top: 30px;
  padding: 40px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-error {
  color: #c53030;
}

@media (max-width: 600px) {
  .item-title {
    font-size: 1.25em;
  }
}
</style>
