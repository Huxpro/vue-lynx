<script setup lang="ts">
import { ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Stress case: reverse / rotate keyed children.
 *
 * Without `removeAction` + correct insert positions (and without recycling),
 * a reorder can leave native <list> showing the old order or mixed keys.
 */
const items = ref(makeCards(10, 'Row'));

function reverse() {
  items.value = [...items.value].reverse();
}

function rotate() {
  if (items.value.length < 2) return;
  const [first, ...rest] = items.value;
  items.value = [...rest, first!];
}

function reset() {
  items.value = makeCards(10, 'Row');
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · reorder (gap)</text>
      <text class="subtitle">
        Vue `:key` / Lynx `:item-key` stay stable, but the MT adapter does not
        emit a full insert/remove diff. Reverse / rotate and check whether the
        on-screen order matches the banner.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="reverse">
        <text class="btn-text">Reverse</text>
      </view>
      <view class="btn danger" @tap="rotate">
        <text class="btn-text">Rotate ↑</text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner warn">
      <text class="banner-text">
        Vue order: {{ items.map((c) => c.title).join(' → ') }}
      </text>
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
        <view class="card">
          <text class="card-title">#{{ index + 1 }} · {{ card.title }}</text>
          <text class="card-body">id={{ card.id }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>
