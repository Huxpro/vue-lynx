<!-- BENCH_MODE_SCRIPT --><script setup lang="ts">
// Lynx port of vuejs/core packages-private/benchmark client/App.vue.
// The vapor variant is GENERATED from this file (the build inserts the
// `vapor` attribute on the script tag) so both modes run byte-identical
// workloads. Do not edit apps/vapor/src/App.vue by hand.
import { onMounted, ref, shallowRef, triggerRef } from 'vue'
import { buildData } from '../../../shared/data'
import type { RowData } from '../../../shared/data'
import { runScenario } from '../../../shared/bench-core'
import type { BenchApi } from '../../../shared/bench-core'

const MODE = __BENCH_MODE__

const selected = shallowRef<number | undefined>(undefined)
const rows = shallowRef<RowData[]>([])
const status = ref('booting')
const resultJson = ref('')

const api: BenchApi = {
  run() {
    rows.value = buildData()
    selected.value = undefined
  },
  runLots() {
    rows.value = buildData(10000)
    selected.value = undefined
  },
  add() {
    rows.value.push(...buildData(1000))
    triggerRef(rows)
  },
  update() {
    const _rows = rows.value
    for (let i = 0, len = _rows.length; i < len; i += 10) {
      _rows[i].label.value += ' !!!'
    }
  },
  select(id: number) {
    selected.value = id
  },
  remove(id: number) {
    rows.value.splice(
      rows.value.findIndex(d => d.id === id),
      1,
    )
    triggerRef(rows)
  },
  swapRows() {
    const _rows = rows.value
    if (_rows.length > 998) {
      const d1 = _rows[1]
      const d998 = _rows[998]
      _rows[1] = d998
      _rows[998] = d1
      triggerRef(rows)
    }
  },
  clear() {
    rows.value = []
    selected.value = undefined
  },
  rowIds() {
    return rows.value.map(r => r.id)
  },
  setStatus(text: string) {
    status.value = text
  },
}

onMounted(() => {
  setTimeout(async () => {
    const result = await runScenario(MODE, api)
    resultJson.value = JSON.stringify(result)
  }, 50)
})
</script>

<template>
  <view class="page">
    <text class="title">Vue ({{ MODE }}) Benchmark on Lynx</text>
    <text class="status" id="bench-status">{{ status }}</text>
    <text v-if="resultJson" class="result" id="bench-result">{{ resultJson }}</text>
    <view class="rows">
      <view
        v-for="row of rows"
        :key="row.id"
        class="row"
        :class="selected === row.id ? 'danger' : ''"
      >
        <text class="col-id">{{ row.id }}</text>
        <text class="col-label" @tap="api.select(row.id)">{{ row.label.value }}</text>
        <text class="col-remove" @tap="api.remove(row.id)">x</text>
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
.status {
  font-size: 12px;
  color: #42b883;
  margin: 4px;
}
.result {
  font-size: 6px;
  color: #999;
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
