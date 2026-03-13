<script setup>
import { reactive, ref } from 'vue'

const COLS = 5
const ROWS = 10

const cols = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i))
const rows = Array.from({ length: ROWS }, (_, i) => i)

// cells[col][row] = raw expression string
const cells = reactive(
  Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => ''))
)

const editingCell = ref(null) // { c, r }
const editValue = ref('')

function evalCell(exp) {
  if (!exp || !exp.startsWith('=')) return exp

  const replaced = exp
    .slice(1)
    .replace(/\b([A-Z])(\d{1,2})\b/g, (_, col, row) =>
      `get(${col.charCodeAt(0) - 65},${row})`
    )

  try {
    return String(new Function('get', `return ${replaced}`)(getCellValue))
  } catch {
    return '#ERR'
  }
}

function getCellValue(c, r) {
  const val = evalCell(cells[c][r])
  const num = Number(val)
  return Number.isFinite(num) ? num : val
}

function startEdit(c, r) {
  editingCell.value = { c, r }
  editValue.value = cells[c][r]
}

function finishEdit(e) {
  if (editingCell.value) {
    const { c, r } = editingCell.value
    cells[c][r] = (e?.detail?.value ?? editValue.value).trim()
    editingCell.value = null
  }
}

function onEditInput(e) {
  editValue.value = e.detail.value
}
</script>

<template>
  <view :style="{ padding: 10 }">
    <!-- Header row -->
    <view :style="{ display: 'flex', flexDirection: 'row' }">
      <view :style="{ width: 30, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }">
        <text :style="{ fontSize: 12 }"></text>
      </view>
      <view
        v-for="col in cols"
        :key="col"
        :style="{ width: 70, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee', borderWidth: 0.5, borderColor: '#ccc' }"
      >
        <text :style="{ fontSize: 13, fontWeight: 'bold' }">{{ col }}</text>
      </view>
    </view>

    <!-- Data rows -->
    <view v-for="r in rows" :key="r" :style="{ display: 'flex', flexDirection: 'row' }">
      <!-- Row header -->
      <view :style="{ width: 30, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee', borderWidth: 0.5, borderColor: '#ccc' }">
        <text :style="{ fontSize: 12 }">{{ r }}</text>
      </view>
      <!-- Cells -->
      <view
        v-for="(col, c) in cols"
        :key="col + r"
        :style="{ width: 70, height: 28, borderWidth: 0.5, borderColor: '#ccc', justifyContent: 'center' }"
        @tap="startEdit(c, r)"
      >
        <input
          v-if="editingCell && editingCell.c === c && editingCell.r === r"
          type="text"
          :value="editValue"
          :style="{ height: 28, fontSize: 13, padding: '0 4px' }"
          @input="onEditInput"
          @confirm="finishEdit"
          @blur="finishEdit"
          autofocus
        />
        <text v-else :style="{ fontSize: 13, padding: '0 4px' }">
          {{ evalCell(cells[c][r]) }}
        </text>
      </view>
    </view>

    <text :style="{ marginTop: 12, fontSize: 12, color: '#999' }">
      Tap a cell to edit. Use =A0+B1 for formulas.
    </text>
  </view>
</template>
