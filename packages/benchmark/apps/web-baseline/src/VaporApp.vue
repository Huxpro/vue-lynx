<script setup vapor>
import { shallowRef, triggerRef } from 'vue'
import {
  STORM_SELECT_TICKS,
  STORM_UPDATE_TICKS,
  makeVueBuildData,
  runStorm,
  SIZES,
} from './shared.js'

const buildData = makeVueBuildData(shallowRef)

const selected = shallowRef(undefined)
const rows = shallowRef([])

const creators = SIZES.map(([label, n]) => ({
  label,
  fn: () => {
    rows.value = buildData(n)
    selected.value = undefined
  },
}))
function update() {
  const _rows = rows.value
  for (let i = 0, len = _rows.length; i < len; i += 10) {
    _rows[i].label.value += ' !!!'
  }
}
function select(id) {
  selected.value = id
}
function remove(id) {
  rows.value.splice(rows.value.findIndex(d => d.id === id), 1)
  triggerRef(rows)
}
function clear() {
  rows.value = []
  selected.value = undefined
}
function stormUpdate() {
  runStorm(STORM_UPDATE_TICKS, (t) => {
    const _rows = rows.value
    for (let i = 0, len = _rows.length; i < len; i += 10) {
      _rows[i].label.value = 'bench ' + t
    }
  })
}
function stormSelect() {
  runStorm(STORM_SELECT_TICKS, (t) => {
    const _rows = rows.value
    selected.value = t < STORM_SELECT_TICKS
      ? _rows[(t * 97) % _rows.length].id
      : _rows[0].id
  })
}
</script>

<template>
  <div class="page">
    <span class="title">Vue vapor (web DOM) UI Benchmark · ready</span>
    <div class="toolbar">
      <button class="btn" v-for="c of creators" :key="c.label" @click="c.fn()"><span class="btn-text">{{ c.label }}</span></button>
      <button class="btn" @click="update()"><span class="btn-text">Update every 10th row</span></button>
      <button class="btn" @click="clear()"><span class="btn-text">Clear</span></button>
      <button class="btn" @click="stormUpdate()"><span class="btn-text">Update storm</span></button>
      <button class="btn" @click="stormSelect()"><span class="btn-text">Select storm</span></button>
    </div>
    <div class="rows">
      <div v-for="row of rows" :key="row.id" class="row" :class="selected === row.id ? 'danger' : ''">
        <span class="col-id">{{ row.id }}</span>
        <span class="col-label" @click="select(row.id)">{{ row.label.value }}</span>
        <span class="col-remove" @click="remove(row.id)">x</span>
      </div>
    </div>
  </div>
</template>
