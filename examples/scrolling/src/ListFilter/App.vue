<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Stress case: filter / toggle a subset (common chat / search UX).
 *
 * Filtering removes + re-inserts keyed children. With empty `removeAction`
 * and append-only inserts, toggling the filter often leaves ghost cells or
 * duplicated item-keys once you toggle back.
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
      <text class="title">list · filter (gap)</text>
      <text class="subtitle">
        Toggle “even only”, then toggle back. Correct behavior restores the
        full 16 rows with no ghosts / duplicated keys. Broken updates usually
        show after the second toggle.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="toggle">
        <text class="btn-text">
          {{ onlyEven ? 'Show all' : 'Even only' }}
        </text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner warn">
      <text class="banner-text">
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
