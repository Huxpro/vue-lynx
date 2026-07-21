<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Regression check: filter / toggle a subset.
 *
 * Empirically looks correct on device. Keep as a smoke test (toggle twice and
 * confirm length 16 → 8 → 16 with no ghosts).
 */
const all = makeCards(16, 'Row');
const onlyEven = ref(false);

const items = computed(() =>
  onlyEven.value
    ? all.filter((_, i) => (i + 1) % 2 === 0)
    : all,
);

function toggle() {
  onlyEven.value = !onlyEven.value;
}

function reset() {
  onlyEven.value = false;
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · filter (smoke)</text>
      <text class="subtitle">
        Toggle even-only, then show all again. Length should be 16 → 8 → 16
        with no leftover rows. Treated as OK in practice; kept for regression.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn" @tap="toggle">
        <text class="btn-text">
          {{ onlyEven ? 'Show all (16)' : 'Even only (8)' }}
        </text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner ok-banner">
      <text class="banner-text ok-text">
        Filter={{ onlyEven ? 'even' : 'all' }} · Vue length={{ items.length }}
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
