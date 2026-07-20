<script setup lang="ts">
import { makeCards } from '../shared/data';

// Native list lazily attaches visible cells. Keep `:key` === `:item-key`.
const cards = makeCards(80, 'Row');
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · single</text>
      <text class="subtitle">
        Only visible rows are materialized. Pass stable Vue `:key` and Lynx
        `:item-key` on every list-item.
      </text>
    </view>

    <list
      class="list"
      list-type="single"
      scroll-orientation="vertical"
    >
      <list-item
        v-for="card in cards"
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
