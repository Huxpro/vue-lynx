<script setup lang="ts">
/**
 * Single-property CSS v-bind comparison row.
 *
 * All four CSS classes reference the same `value` prop via v-bind(), so the
 * SFC compiler emits exactly ONE useCssVars entry: { hash: value }.
 * Only one class is ever applied per instance (v-if guards), so each instance
 * behaves identically to the single-var VBindThreads pattern that is confirmed
 * working on Lynx.
 */
defineProps<{
  label: string
  property: 'background-color' | 'color' | 'font-size' | 'opacity'
  value: string | number
}>()
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'row', gap: '10px', marginBottom: '6px' }">

    <!-- Left: v-bind() in CSS -->
    <view :style="{ flex: 1, borderRadius: '6px' }">
      <view
        v-if="property === 'background-color'"
        class="row-bg"
        :style="{ padding: '8px', borderRadius: '6px' }"
      >
        <text :style="{ fontSize: '10px', color: '#fff', marginBottom: '2px' }">{{ label }}</text>
        <text :style="{ fontSize: '11px', color: '#fff' }">v-bind(value)</text>
      </view>

      <view v-else :style="{ padding: '8px', borderRadius: '6px', backgroundColor: '#fff' }">
        <text :style="{ fontSize: '10px', color: '#555', marginBottom: '2px' }">{{ label }}</text>
        <text v-if="property === 'color'" class="row-color" :style="{ fontWeight: 'bold' }">
          v-bind(value)
        </text>
        <text v-else-if="property === 'font-size'" class="row-font-size">
          Sample text
        </text>
        <text v-else-if="property === 'opacity'" class="row-opacity" :style="{ fontWeight: 'bold' }">
          v-bind(value)
        </text>
      </view>
    </view>

    <!-- Right: inline :style -->
    <view :style="{ flex: 1, borderRadius: '6px' }">
      <view
        v-if="property === 'background-color'"
        :style="{ padding: '8px', borderRadius: '6px', backgroundColor: (value as string) }"
      >
        <text :style="{ fontSize: '10px', color: '#fff', marginBottom: '2px' }">{{ label }}</text>
        <text :style="{ fontSize: '11px', color: '#fff' }">:style inline</text>
      </view>

      <view v-else :style="{ padding: '8px', borderRadius: '6px', backgroundColor: '#fff' }">
        <text :style="{ fontSize: '10px', color: '#555', marginBottom: '2px' }">{{ label }}</text>
        <text v-if="property === 'color'" :style="{ fontWeight: 'bold', color: (value as string) }">
          :style inline
        </text>
        <text v-else-if="property === 'font-size'" :style="{ fontSize: (value as string) }">
          Sample text
        </text>
        <text v-else-if="property === 'opacity'" :style="{ fontWeight: 'bold', opacity: (value as number) }">
          :style inline
        </text>
      </view>
    </view>

  </view>
</template>

<style>
/* All four classes reference the same prop — compiler emits one CSS var. */
.row-bg {
  background-color: v-bind(value);
}

.row-color {
  color: v-bind(value);
}

.row-font-size {
  font-size: v-bind(value);
}

.row-opacity {
  opacity: v-bind(value);
}
</style>
