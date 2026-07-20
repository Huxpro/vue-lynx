<script setup lang="ts">
import { ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Stress case: insert at the front (unshift / insertBefore).
 *
 * MT `insertListItem` always `push`es — it ignores the INSERT anchor — so a
 * Vue prepend is reported as a tail insert (wrong `position` / order).
 */
const items = ref(makeCards(8, 'Row'));
let seq = items.value.length;

function prepend() {
  seq += 1;
  const card = {
    id: `Row-new-${seq}`,
    title: `NEW ${seq} (should be first)`,
    body: 'Prepended via unshift — native list must insert at position 0.',
    color: '#ef4444',
    height: 96,
  };
  items.value = [card, ...items.value];
}

function append() {
  seq += 1;
  const card = {
    id: `Row-tail-${seq}`,
    title: `TAIL ${seq}`,
    body: 'Append-only path — this one is expected to work today.',
    color: '#10b981',
    height: 96,
  };
  items.value = [...items.value, card];
}

function reset() {
  items.value = makeCards(8, 'Row');
  seq = items.value.length;
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · prepend (gap)</text>
      <text class="subtitle">
        Compare Prepend vs Append. Append should land at the bottom. Prepend
        should land at the top — if it appears at the bottom (or duplicates),
        the MT list adapter ignored the INSERT anchor.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="prepend">
        <text class="btn-text">Prepend</text>
      </view>
      <view class="btn ok" @tap="append">
        <text class="btn-text">Append (ok)</text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner warn">
      <text class="banner-text">
        First Vue item: {{ items[0]?.title ?? '(empty)' }}
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
        <view
          class="card"
          :style="{
            borderLeftWidth: '4px',
            borderLeftColor: card.color,
          }"
        >
          <text class="card-title">{{ card.title }}</text>
          <text class="card-body">{{ card.body }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>
