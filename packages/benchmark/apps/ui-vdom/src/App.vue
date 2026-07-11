<!-- BENCH_MODE_SCRIPT --><script setup lang="ts">
// Black-box cross-framework benchmark UI (no instrumentation).
// Lynx port of the krausest js-framework-benchmark table app, matching the
// semantics of vuejs/core packages-private/benchmark client/App.vue.
// The vapor variant is GENERATED from this file (the build inserts the
// `vapor` attribute on the script tag). Do not edit apps/ui-vapor/src/App.vue
// by hand. The React variant (apps/ui-react) mirrors these operations with
// idiomatic React state.
import { ref, shallowRef, triggerRef } from 'vue'
import { buildData } from '../../../shared/data'
import type { RowData } from '../../../shared/data'

const MODE = __BENCH_MODE__

const selected = shallowRef<number | undefined>(undefined)
const rows = shallowRef<RowData[]>([])
const ready = ref('ready')

function run() {
  rows.value = buildData()
  selected.value = undefined
}
function runLots() {
  rows.value = buildData(10000)
  selected.value = undefined
}
function add() {
  rows.value.push(...buildData(1000))
  triggerRef(rows)
}
function update() {
  const _rows = rows.value
  for (let i = 0, len = _rows.length; i < len; i += 10) {
    _rows[i].label.value += ' !!!'
  }
}
function select(id: number) {
  selected.value = id
}
function remove(id: number) {
  rows.value.splice(
    rows.value.findIndex(d => d.id === id),
    1,
  )
  triggerRef(rows)
}
function swapRows() {
  const _rows = rows.value
  if (_rows.length > 998) {
    const d1 = _rows[1]
    const d998 = _rows[998]
    _rows[1] = d998
    _rows[998] = d1
    triggerRef(rows)
  }
}
function clear() {
  rows.value = []
  selected.value = undefined
}
</script>

<template>
  <view class="page">
    <text class="title">Vue ({{ MODE }}) UI Benchmark on Lynx · {{ ready }}</text>
    <view class="toolbar">
      <view class="btn" @tap="run()"><text class="btn-text">Create 1,000 rows</text></view>
      <view class="btn" @tap="runLots()"><text class="btn-text">Create 10,000 rows</text></view>
      <view class="btn" @tap="add()"><text class="btn-text">Append 1,000 rows</text></view>
      <view class="btn" @tap="update()"><text class="btn-text">Update every 10th row</text></view>
      <view class="btn" @tap="swapRows()"><text class="btn-text">Swap Rows</text></view>
      <view class="btn" @tap="clear()"><text class="btn-text">Clear</text></view>
    </view>
    <view class="rows">
      <view
        v-for="row of rows"
        :key="row.id"
        class="row"
        :class="selected === row.id ? 'danger' : ''"
      >
        <text class="col-id">{{ row.id }}</text>
        <text class="col-label" @tap="select(row.id)">{{ row.label.value }}</text>
        <text class="col-remove" @tap="remove(row.id)">x</text>
      </view>
    </view>
  </view>
</template>

<style>
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}
.title {
  font-size: 14px;
  font-weight: bold;
  margin: 4px;
}
.toolbar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.btn {
  background-color: #e8e8e8;
  border-radius: 3px;
  margin: 2px;
  padding: 4px 8px;
}
.btn-text {
  font-size: 11px;
  color: #222;
}
.rows {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  flex-direction: row;
  height: 18px;
  align-items: center;
}
.danger {
  background-color: #f2dede;
}
.col-id {
  width: 60px;
  font-size: 11px;
  color: #333;
}
.col-label {
  flex: 1;
  font-size: 11px;
  color: #111;
}
.col-remove {
  width: 30px;
  font-size: 11px;
  color: #c00;
}
</style>
