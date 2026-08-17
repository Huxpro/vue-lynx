<script setup lang="ts">
import { ref } from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * Remove + Reset with the *same* item-keys.
 *
 * Previously REMOVE did not update listItems / removeAction, so Reset
 * re-inserted Row-1…N and native list threw duplicated item-key (2202).
 * That was an impl bug — Reset is the intentional repro / regression check.
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
  // Same ids on purpose — must not 2202 after removes.
  items.value = makeCards(12, 'Row');
  lastAction.value = 'reset (same item-keys)';
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · remove + reset</text>
      <text class="subtitle">
        Remove some rows, then Reset. Reset rebuilds Row-1…12 with the same
        item-keys. A duplicated item-key toast means the MT adapter forgot to
        emit removeAction (impl bug — not a flaky demo).
      </text>
    </view>

    <view class="toolbar">
      <view class="btn" @tap="removeMiddle">
        <text class="btn-text">Remove middle</text>
      </view>
      <view class="btn" @tap="removeTail">
        <text class="btn-text">Remove last</text>
      </view>
      <view class="btn danger" @tap="reset">
        <text class="btn-text">Reset same keys</text>
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
