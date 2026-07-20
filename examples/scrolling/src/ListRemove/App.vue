<script setup lang="ts">
import { ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Regression check: delete from the middle / pop the tail.
 *
 * Empirically looks correct on device even though `removeAction` stays empty
 * (likely helped by `__RemoveElement` on already-attached cells). Keep as a
 * smoke test, not a known-broken demo.
 */
const items = ref(makeCards(12, 'Row'));
const lastAction = ref('—');

function removeMiddle() {
  if (items.value.length < 2) return;
  const mid = Math.floor(items.value.length / 2);
  const removed = items.value[mid]!;
  items.value = [
    ...items.value.slice(0, mid),
    ...items.value.slice(mid + 1),
  ];
  lastAction.value = `removed middle ${removed.title}`;
}

function removeTail() {
  if (items.value.length === 0) return;
  const removed = items.value[items.value.length - 1]!;
  items.value = items.value.slice(0, -1);
  lastAction.value = `removed last ${removed.title}`;
}

function reset() {
  items.value = makeCards(12, 'Row');
  lastAction.value = 'reset';
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · remove (smoke)</text>
      <text class="subtitle">
        Expectation: rows disappear and the length badge matches. This path
        has looked fine in practice — use it as a regression check.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn" @tap="removeMiddle">
        <text class="btn-text">Remove middle</text>
      </view>
      <view class="btn" @tap="removeTail">
        <text class="btn-text">Remove last</text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner ok-banner">
      <text class="banner-text ok-text">
        Vue length={{ items.length }} · last: {{ lastAction }}
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
