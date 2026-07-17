<script setup lang="ts">
// A collapsing-header + sticky-tab-bar + horizontally-paged scaffold — the
// "native profile" pattern (Twitter/X, Mastodon apps): the #header slot
// scrolls away, the tab bar pins to the top, and the panes below it keep
// swiping horizontally, each with its own vertical scroll.
//
// It wraps Lynx's scroll-coordinator (a.k.a. foldview) — an outer vertical
// scroller whose header collapses until the toolbar sticks, after which the
// active pane's inner list takes over the scroll — around the same
// two-way-synced viewpager used by TabPager.vue.
import type { ShadowElement } from 'vue-lynx';
import { computed, ref, useTemplateRef, watch } from 'vue-lynx';

declare const SystemInfo: { platform?: string } | undefined;

// Like the viewpager, the coordinator element is registered under different
// names per platform: Lynx for Web ships the legacy XElement foldview names
// (x-foldview-*-ng), while native OSS engines register the extracted
// scroll-coordinator element (lynx-family/lynx). Both expose the same
// header / toolbar / slot structure.
const isWeb = typeof SystemInfo !== 'undefined' && SystemInfo?.platform === 'web';
const foldTag = isWeb ? 'x-foldview-ng' : 'scroll-coordinator';
const foldHeaderTag = isWeb ? 'x-foldview-header-ng' : 'scroll-coordinator-header';
const foldToolbarTag = isWeb ? 'x-foldview-toolbar-ng' : 'scroll-coordinator-toolbar';
const foldSlotTag = isWeb ? 'x-foldview-slot-ng' : 'scroll-coordinator-slot';
const pagerTag = isWeb ? 'x-viewpager-ng' : 'viewpager';
const pagerItemTag = isWeb ? 'x-viewpager-item-ng' : 'viewpager-item';

const props = defineProps<{
  tabs: readonly { key: string; label: string }[];
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [key: string];
}>();

const pagerRef = useTemplateRef<ShadowElement>('pagerRef');

const activeIndex = computed(() => {
  const index = props.tabs.findIndex(t => t.key === props.modelValue);
  return index === -1 ? 0 : index;
});

// Last page index the pager itself reported (via change). Used to skip the
// selectTab() round-trip when the pager is already on the page.
const pagerIndex = ref(activeIndex.value);

function onPagerChange(e: { detail?: { index?: number }; params?: { index?: number } }) {
  const index = e?.detail?.index ?? e?.params?.index;
  if (typeof index !== 'number')
    return;
  pagerIndex.value = index;
  const key = props.tabs[index]?.key;
  if (key && key !== props.modelValue)
    emit('update:modelValue', key);
}

watch(activeIndex, (index) => {
  if (index === pagerIndex.value)
    return;
  pagerRef.value
    ?.invoke({ method: 'selectTab', params: { index, smooth: true } })
    .exec();
});
</script>

<template>
  <component :is="foldTag" class="stv">
    <component :is="foldHeaderTag" class="stv-header">
      <slot name="header" />
    </component>

    <component :is="foldToolbarTag" class="stv-toolbar">
      <view class="stv-bar">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="stv-tab"
          @tap="$emit('update:modelValue', t.key)"
        >
          <text class="stv-tab-text" :class="modelValue === t.key ? 'stv-tab-text-active' : ''">{{ t.label }}</text>
          <view class="stv-tab-underline" :class="modelValue === t.key ? 'stv-tab-underline-active' : ''" />
        </view>
      </view>
    </component>

    <component :is="foldSlotTag" class="stv-slot">
      <component
        :is="pagerTag"
        ref="pagerRef"
        class="stv-pages"
        :initial-select-index="activeIndex"
        @change="onPagerChange"
      >
        <component
          :is="pagerItemTag"
          v-for="t in tabs"
          :key="t.key"
          class="stv-page"
        >
          <slot :name="t.key" />
        </component>
      </component>
    </component>
  </component>
</template>

<style>
.stv {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.stv-toolbar {
  /* Opaque so collapsed header content never shows through the pinned bar. */
  background-color: var(--c-bg-base);
}

.stv-bar {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--c-border);
}

.stv-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding-top: 10px;
}

.stv-tab-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  padding-bottom: 8px;
  transition: color var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.stv-tab-text-active {
  color: var(--c-text-base);
  font-weight: 600;
}

.stv-tab-underline {
  height: 3px;
  width: 60%;
  border-radius: 2px;
  background-color: var(--c-primary);
  opacity: 0;
  transform: scaleX(0.35);
  transition: transform var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.stv-tab-underline-active {
  opacity: 1;
  transform: scaleX(1);
}

.stv-slot {
  /* The coordinator element is a standard-flexbox container (not a Lynx
     linear one), so a Lynx `flex: 1` weight doesn't reach this raw child —
     give the slot a definite height so the viewpager/panes below it fill. */
  height: 100%;
  width: 100%;
}

.stv-pages {
  flex: 1;
  width: 100%;
  height: 100%;
}

.stv-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
