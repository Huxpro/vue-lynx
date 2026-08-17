<!-- GENERATED from apps/ui-vdom/src/App.vue — do not edit -->
<script setup vapor lang="ts">
// Cross-framework benchmark UI. Native-only timing is capability-gated so
// Lynx for Web keeps its black-box measurement behavior.
// Lynx port of the krausest js-framework-benchmark table app, matching the
// semantics of vuejs/core packages-private/benchmark client/App.vue.
// The vapor variant is GENERATED from this file (the build inserts the
// `vapor` attribute on the script tag). Do not edit apps/ui-vapor/src/App.vue
// by hand. The React variant (apps/ui-react) mirrors these operations with
// idiomatic React state.
import { ref, shallowRef, triggerRef } from 'vue'
import { buildData, buildDataSeeded } from '../../../shared/data'
import { createNativeBench } from '../../../shared/native-bench'
import type { RowData } from '../../../shared/data'

const MODE = __BENCH_MODE__
const INITIAL_ROWS_SEED = 42
const {
  runStorm: runNativeBenchStorm,
  startMeasure: startNativeMeasure,
} = createNativeBench(lynx)

const selected = shallowRef<number | undefined>(undefined)
const rows = shallowRef<RowData[]>(
  buildDataSeeded(__BENCH_AUTOROWS__, INITIAL_ROWS_SEED),
)
const ready = ref('ready')

function run() {
  const finish = startNativeMeasure('create')
  rows.value = buildData()
  selected.value = undefined
  finish()
}
function runLots() {
  const finish = startNativeMeasure('create')
  rows.value = buildData(10000)
  selected.value = undefined
  finish()
}
function run3k() {
  const finish = startNativeMeasure('create')
  rows.value = buildData(3000)
  selected.value = undefined
  finish()
}
function run5k() {
  const finish = startNativeMeasure('create')
  rows.value = buildData(5000)
  selected.value = undefined
  finish()
}
function run20k() {
  const finish = startNativeMeasure('create')
  rows.value = buildData(20000)
  selected.value = undefined
  finish()
}
function run30k() {
  const finish = startNativeMeasure('create')
  rows.value = buildData(30000)
  selected.value = undefined
  finish()
}
function add() {
  const finish = startNativeMeasure('append1k')
  rows.value.push(...buildData(1000))
  triggerRef(rows)
  finish()
}
function update() {
  const finish = startNativeMeasure('update10th')
  const _rows = rows.value
  for (let i = 0, len = _rows.length; i < len; i += 10) {
    _rows[i].label.value += ' !!!'
  }
  finish()
}
function select(id: number) {
  const finish = startNativeMeasure('select')
  selected.value = id
  finish()
}
function remove(id: number) {
  const finish = startNativeMeasure('remove')
  rows.value.splice(
    rows.value.findIndex(d => d.id === id),
    1,
  )
  triggerRef(rows)
  finish()
}
function swapRows() {
  const finish = startNativeMeasure('swap')
  const _rows = rows.value
  if (_rows.length > 998) {
    const d1 = _rows[1]
    const d998 = _rows[998]
    _rows[1] = d998
    _rows[998] = d1
    triggerRef(rows)
  }
  finish()
}
function clear() {
  const finish = startNativeMeasure('clear')
  rows.value = []
  selected.value = undefined
  finish()
}

// -- storms: N sequential state→render→DOM ticks from one click --------------
// Each tick runs in its own task so every mutation goes through a full render
// cycle instead of batching. Lynx for Web keeps MessageChannel; Native uses
// its timer task queue. Total wall time ends after the final tick settles.
const STORM_UPDATE_TICKS = 50
const STORM_SELECT_TICKS = 30

function stormUpdate() {
  runNativeBenchStorm('updateStorm', STORM_UPDATE_TICKS, t => {
    const _rows = rows.value
    for (let i = 0, len = _rows.length; i < len; i += 10) {
      _rows[i].label.value = 'bench ' + t
    }
  })
}

function stormSelect() {
  runNativeBenchStorm('selectStorm', STORM_SELECT_TICKS, t => {
    const _rows = rows.value
    selected.value = t < STORM_SELECT_TICKS
      ? _rows[(t * 97) % _rows.length].id
      : _rows[0].id
  })
}
</script>

<template>
  <view class="page">
    <text class="title">Vue ({{ MODE }}) UI Benchmark on Lynx · {{ ready }}</text>
    <view class="toolbar">
      <view class="btn" @tap="run()"><text class="btn-text">Create 1,000 rows</text></view>
      <view class="btn" @tap="run3k()"><text class="btn-text">Create 3,000 rows</text></view>
      <view class="btn" @tap="run5k()"><text class="btn-text">Create 5,000 rows</text></view>
      <view class="btn" @tap="runLots()"><text class="btn-text">Create 10,000 rows</text></view>
      <view class="btn" @tap="run20k()"><text class="btn-text">Create 20,000 rows</text></view>
      <view class="btn" @tap="run30k()"><text class="btn-text">Create 30,000 rows</text></view>
      <view class="btn" @tap="add()"><text class="btn-text">Append 1,000 rows</text></view>
      <view class="btn" @tap="update()"><text class="btn-text">Update every 10th row</text></view>
      <view class="btn" @tap="swapRows()"><text class="btn-text">Swap Rows</text></view>
      <view class="btn" @tap="clear()"><text class="btn-text">Clear</text></view>
      <view class="btn" @tap="stormUpdate()"><text class="btn-text">Update storm</text></view>
      <view class="btn" @tap="stormSelect()"><text class="btn-text">Select storm</text></view>
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
