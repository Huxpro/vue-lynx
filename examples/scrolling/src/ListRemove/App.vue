<script setup lang="ts">
import { ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Stress case: delete from the middle / pop the tail.
 *
 * Vue Lynx currently flushes only append-only `insertAction`s
 * (`removeAction` is always `[]`), so native <list> can keep stale cells
 * after a reactive splice.
 */
const items = ref(makeCards(12, 'Row'));

function removeMiddle() {
  if (items.value.length < 2) return;
  const mid = Math.floor(items.value.length / 2);
  items.value = [
    ...items.value.slice(0, mid),
    ...items.value.slice(mid + 1),
  ];
}

function removeTail() {
  if (items.value.length === 0) return;
  items.value = items.value.slice(0, -1);
}

function reset() {
  items.value = makeCards(12, 'Row');
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · remove (gap)</text>
      <text class="subtitle">
        Expectation: middle / tail deletes leave a consistent feed. Current
        Vue Lynx list updates omit `removeAction` — watch for ghost rows or
        wrong count after tapping.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="removeMiddle">
        <text class="btn-text">Remove middle</text>
      </view>
      <view class="btn danger" @tap="removeTail">
        <text class="btn-text">Remove last</text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner warn">
      <text class="banner-text">
        Vue data length: {{ items.length }} — compare with what native list
        still shows.
      </text>
    </view>

    <list
      class="list"
      list-type="single"
      scroll-orientation="vertical"
    >
      <list-item
        v-for="card in items"
        :key="card.id"
        :item-key="card.id"
        :estimated-main-axis-size-px="96"
      >
        <view class="card">
          <text class="card-title">{{ card.title }}</text>
          <text class="card-body">{{ card.body }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>
