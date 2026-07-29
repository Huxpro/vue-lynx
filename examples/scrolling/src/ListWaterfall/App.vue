<script setup lang="ts">
import { makeCards } from '../shared/data';

const tiles = makeCards(40, 'Tile');
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · waterfall</text>
      <text class="subtitle">
        scroll-view is linear only. list unlocks flow / waterfall layouts
        while Vue components stay ordinary SFCs inside each list-item.
      </text>
    </view>

    <list
      class="list"
      list-type="waterfall"
      :span-count="2"
      scroll-orientation="vertical"
    >
      <list-item
        v-for="tile in tiles"
        :key="tile.id"
        :item-key="tile.id"
        :estimated-main-axis-size-px="tile.height"
      >
        <view
          class="tile"
          :style="{
            height: `${tile.height}px`,
            backgroundColor: tile.color,
          }"
        >
          <text class="tile-label">{{ tile.title }}</text>
          <text class="tile-meta">{{ tile.height }}px tall</text>
        </view>
      </list-item>
    </list>
  </view>
</template>
