<script setup lang="ts">
import { useInfiniteFeed } from '../shared/useInfiniteFeed';

const { items, loading, done, loadMore } = useInfiniteFeed(15);
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · infinite</text>
      <text class="subtitle">
        `@scrolltolower` drives a Vue composable. No virtual-scroller library
        — native recycling + reactive `items` is the design pattern.
      </text>
    </view>

    <list
      class="list"
      list-type="single"
      scroll-orientation="vertical"
      :lower-threshold-item-count="3"
      @scrolltolower="loadMore"
    >
      <list-item
        v-for="item in items"
        :key="item.id"
        :item-key="item.id"
        :estimated-main-axis-size-px="96"
      >
        <view class="card">
          <text class="card-title">{{ item.title }}</text>
          <text class="card-body">{{ item.body }}</text>
        </view>
      </list-item>

      <list-item item-key="__footer" :estimated-main-axis-size-px="64">
        <view class="footer-item">
          <text class="footer-text">
            {{
              loading
                ? 'Loading more…'
                : done
                  ? 'You reached the end'
                  : 'Scroll for more'
            }}
          </text>
        </view>
      </list-item>
    </list>
  </view>
</template>
