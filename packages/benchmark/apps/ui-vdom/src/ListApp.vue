<!-- BENCH_LIST_MODE_SCRIPT --><script setup lang="ts">
declare const __BENCH_LIST_ROWS__: number

const rows = Array.from(
  { length: __BENCH_LIST_ROWS__ },
  (_, index) => ({ id: `row-${index}`, label: `Row ${index}` }),
)
</script>

<template>
  <view class="bench-list-page">
    <list
      class="bench-list-viewport"
      list-type="single"
      :span-count="1"
      :preload-buffer-count="2"
      scroll-orientation="vertical"
    >
      <list-item
        v-for="row in rows"
        :key="row.id"
        class="bench-list-cell"
        :item-key="row.id"
        reuse-identifier="bench-list-row"
        :estimated-main-axis-size-px="40"
      >
        <view class="bench-list-cell-body">
          <text class="bench-list-key">{{ row.id }}</text>
          <text class="bench-list-label">{{ row.label }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>

<style>
.bench-list-page {
  width: 390px;
  height: 640px;
  background-color: #fff;
}
.bench-list-viewport {
  width: 390px;
  height: 640px;
}
.bench-list-cell {
  width: 390px;
  height: 40px;
}
.bench-list-cell-body {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 390px;
  height: 40px;
  padding: 0 8px;
}
.bench-list-key {
  width: 92px;
  font-size: 12px;
  color: #333;
}
.bench-list-label {
  font-size: 12px;
  color: #111;
}
</style>
