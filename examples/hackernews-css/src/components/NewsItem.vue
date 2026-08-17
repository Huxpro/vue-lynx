<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { FeedItem } from '../api';
import { isAbsoluteUrl, openExternalUrl, toHost } from '../utils';

const props = defineProps<{
  item: FeedItem;
}>();

const router = useRouter();
const itemUrl = toHost(props.item.url);

function goToItem() {
  router.push(`/item/${props.item.id}`);
}

function goToUser() {
  router.push(`/user/${props.item.user}`);
}

function handleTitleTap() {
  if (isAbsoluteUrl(props.item.url)) {
    openExternalUrl(props.item.url);
    return;
  }

  goToItem();
}
</script>

<template>
  <view class="news-item">
    <text class="score">{{ item.points }}</text>

    <view class="title">
      <text class="news-link" @tap="handleTitleTap">{{ item.title }}</text>
      <text v-if="isAbsoluteUrl(item.url)" class="host">({{ itemUrl }})</text>
    </view>

    <view class="meta">
      <text v-if="item.type !== 'job'">by </text>
      <text v-if="item.type !== 'job'" class="meta-link" @tap="goToUser">
        {{ item.user }}
      </text>
      <text class="time">{{ item.time_ago }}</text>
      <text v-if="item.type !== 'job'">|</text>
      <text v-if="item.type !== 'job'" class="meta-link" @tap="goToItem">
        {{ item.comments_count }} comments
      </text>
    </view>
  </view>
</template>

<style lang="scss">
.news-item {
  background-color: #fff;
  padding: 20px 30px 20px 80px;
  border-bottom: 1px solid #eee;
  position: relative;
  line-height: 20px;

  .title {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25em;
  }

  .news-link {
    color: #2e495e;
  }

  .score {
    color: #3eaf7c;
    font-size: 1.1em;
    font-weight: 700;
    position: absolute;
    top: 50%;
    left: 0;
    width: 80px;
    text-align: center;
    margin-top: -10px;
  }

  .meta,
  .host,
  .meta-link {
    font-size: 0.85em;
    color: #595959;
  }

  .meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.35em;
    margin-top: 4px;
  }

  .meta-link {
    text-decoration: underline;
  }
}
</style>
