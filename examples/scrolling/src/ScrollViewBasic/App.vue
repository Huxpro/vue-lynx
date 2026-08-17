<script setup lang="ts">
import { makeCards } from '../shared/data';

// scroll-view renders every child eagerly — keep the dataset small.
const cards = makeCards(8, 'Section');
</script>

<template>
  <view class="root">
    <scroll-view class="scroll" scroll-orientation="vertical">
      <view class="header">
        <text class="title">scroll-view</text>
        <text class="subtitle">
          All children mount at once. Best for short, heterogeneous pages
          (forms, settings, article bodies).
        </text>
      </view>

      <view v-for="card in cards" :key="card.id" class="card">
        <text class="card-title">{{ card.title }}</text>
        <text class="card-body">{{ card.body }}</text>
      </view>

      <text class="footer-note">
        End of content — every card above stayed in memory while you scrolled.
      </text>
    </scroll-view>
  </view>
</template>
