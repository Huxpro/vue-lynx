<!-- GENERATED from apps/ui-vdom/src/App.vue — do not edit -->
<script setup vapor lang="ts">
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

// -- storms: N sequential state→render→DOM ticks from one click --------------
// Each tick runs in its own macrotask (MessageChannel avoids the nested
// setTimeout 4ms clamp) so every mutation goes through a full render cycle
// instead of batching. Total wall time to the final DOM state is a
// throughput measure that amplifies sub-frame update costs above the
// harness's one-frame observation floor.
const STORM_UPDATE_TICKS = 50
const STORM_SELECT_TICKS = 30

const _stormChannel = new MessageChannel()
let _stormPending: (() => void) | null = null
_stormChannel.port1.onmessage = () => {
  const cb = _stormPending
  _stormPending = null
  if (cb) cb()
}
function nextMacrotask(cb: () => void) {
  _stormPending = cb
  _stormChannel.port2.postMessage(0)
}

function stormUpdate() {
  let t = 0
  const step = () => {
    t++
    const _rows = rows.value
    for (let i = 0, len = _rows.length; i < len; i += 10) {
      _rows[i].label.value = 'bench ' + t
    }
    if (t < STORM_UPDATE_TICKS) nextMacrotask(step)
  }
  nextMacrotask(step)
}

function stormSelect() {
  let t = 0
  const step = () => {
    t++
    const _rows = rows.value
    selected.value = t < STORM_SELECT_TICKS
      ? _rows[(t * 97) % _rows.length].id
      : _rows[0].id
    if (t < STORM_SELECT_TICKS) nextMacrotask(step)
  }
  nextMacrotask(step)
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
