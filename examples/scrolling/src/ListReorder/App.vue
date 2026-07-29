<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

/**
 * Reorder stress — make the Vue truth vs native <list> mismatch obvious.
 *
 * Left/top strip is ordinary <view>s (always follows Vue). The <list> below
 * is what the MT adapter drives. After "Yellow → top" or "Reverse", the two
 * rows of colors must match. If the list keeps the old color order while the
 * truth strip flips, the list adapter lost the move.
 */
type Tile = { id: string; label: string; color: string };

const INITIAL: Tile[] = [
  { id: 'R', label: 'RED', color: '#ef4444' },
  { id: 'B', label: 'BLUE', color: '#3b82f6' },
  { id: 'G', label: 'GREEN', color: '#22c55e' },
  { id: 'Y', label: 'YELLOW', color: '#eab308' },
];

const items = ref<Tile[]>([...INITIAL]);

const expectedTop = computed(() => items.value[0]!);
const expectedOrder = computed(() =>
  items.value.map((t) => t.label).join(' → '),
);

function yellowToTop() {
  const rest = items.value.filter((t) => t.id !== 'Y');
  const yellow = items.value.find((t) => t.id === 'Y')!;
  items.value = [yellow, ...rest];
}

function reverse() {
  items.value = [...items.value].reverse();
}

function reset() {
  items.value = [...INITIAL];
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · reorder</text>
      <text class="subtitle">
        Compare the two color rows. Top = Vue truth (plain views). Bottom =
        native &lt;list&gt;. After a tap they must show the same order.
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="yellowToTop">
        <text class="btn-text">Yellow → top</text>
      </view>
      <view class="btn danger" @tap="reverse">
        <text class="btn-text">Reverse</text>
      </view>
      <view class="btn" @tap="reset">
        <text class="btn-text">Reset</text>
      </view>
    </view>

    <view class="banner warn">
      <text class="banner-text">
        Expect list TOP cell = {{ expectedTop.label }} · full order:
        {{ expectedOrder }}
      </text>
    </view>

    <!-- Vue truth: not a list — always correct -->
    <view class="truth-block">
      <text class="truth-label">Vue truth (not list)</text>
      <view class="truth-row">
        <view
          v-for="(tile, i) in items"
          :key="tile.id"
          class="truth-chip"
          :style="{ backgroundColor: tile.color }"
        >
          <text class="truth-chip-text">{{ i + 1 }}.{{ tile.label }}</text>
        </view>
      </view>
    </view>

    <text class="truth-label list-label">Native &lt;list&gt; (must match)</text>

    <list
      class="list reorder-list"
      list-type="single"
      scroll-orientation="vertical"
    >
      <list-item
        v-for="(tile, index) in items"
        :key="tile.id"
        :item-key="tile.id"
        :estimated-main-axis-size-px="88"
      >
        <view
          class="reorder-cell"
          :style="{ backgroundColor: tile.color }"
        >
          <text class="reorder-cell-pos">slot {{ index + 1 }}</text>
          <text class="reorder-cell-label">{{ tile.label }}</text>
          <text class="reorder-cell-hint">
            {{
              index === 0
                ? `← must be ${expectedTop.label}`
                : `id=${tile.id}`
            }}
          </text>
        </view>
      </list-item>
    </list>
  </view>
</template>
