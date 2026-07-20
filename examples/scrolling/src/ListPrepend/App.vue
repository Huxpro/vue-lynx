<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Confirmed gap: insert at the front (unshift).
 *
 * MT `insertListItem` always `push`es and ignores the INSERT anchor, so
 * `update-list-info` reports the new item at the tail. Watch the TOP cell —
 * after Prepend it must become the red "NEW …" card.
 */
const items = ref(makeCards(6, 'Row'));
let seq = items.value.length;

const topTitle = computed(() => items.value[0]?.title ?? '(empty)');

function prepend() {
  seq += 1;
  const card = {
    id: `Row-new-${seq}`,
    title: `NEW ${seq}`,
    body: 'Must be the FIRST (top) cell. If this shows at the bottom, prepend is broken.',
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
    body: 'Append-only path — expected to work (lands at bottom).',
    color: '#10b981',
    height: 96,
  };
  items.value = [...items.value, card];
}

function reset() {
  items.value = makeCards(6, 'Row');
  seq = items.value.length;
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · prepend (confirmed gap)</text>
      <text class="subtitle">
        Tap Prepend once. The TOP list cell must turn red and read
        &quot;NEW …&quot;. If the red card appears at the bottom instead, the
        adapter ignored the insert-before anchor.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="prepend">
        <text class="btn-text">Prepend (bug)</text>
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
        Vue says TOP = {{ topTitle }} — scroll to top of the list and check.
      </text>
    </view>

    <!-- Truth strip: first Vue item only -->
    <view class="truth-block">
      <text class="truth-label">Vue truth · first item</text>
      <view
        class="truth-chip wide"
        :style="{ backgroundColor: items[0]?.color ?? '#9ca3af' }"
      >
        <text class="truth-chip-text">{{ topTitle }}</text>
      </view>
    </view>

    <list
      class="list"
      list-type="single"
      scroll-orientation="vertical"
    >
      <list-item
        v-for="(card, index) in items"
        :key="card.id"
        :item-key="card.id"
        :estimated-main-axis-size-px="96"
      >
        <view
          class="card"
          :style="{
            borderLeftWidth: '6px',
            borderLeftColor: card.color,
            backgroundColor: index === 0 ? '#fef2f2' : '#ffffff',
          }"
        >
          <text class="card-title">
            {{ index === 0 ? 'TOP · ' : '' }}{{ card.title }}
          </text>
          <text class="card-body">{{ card.body }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>
