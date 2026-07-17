<script setup lang="ts">
// A collapsing-header + sticky-tab-bar + horizontally-paged scaffold — the
// "native profile" pattern (Twitter/X, Mastodon apps): the #header slot
// scrolls away with the page, the tab bar sticks to the top once you scroll
// onto it, and the panes below keep swiping horizontally.
//
// One vertical <scroll-view> is the single scroller; the tab bar is a
// sticky child (Lynx's scroll-view sticky capability — the `sticky`
// attribute natively, `position: sticky` on the web runtime). The panes are
// laid out at their natural height, so the whole page scrolls as one and
// the header genuinely collapses before the list continues — no nested
// scroll to fight. Horizontal paging is still owned by the viewpager.
import type { ShadowElement } from 'vue-lynx';
import { computed, ref, useTemplateRef, watch } from 'vue-lynx';

declare const SystemInfo: { platform?: string } | undefined;

const isWeb = typeof SystemInfo !== 'undefined' && SystemInfo?.platform === 'web';
// The viewpager element is registered under different names per platform:
// the legacy XElement name on Lynx for Web, the extracted element natively.
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
  <scroll-view scroll-orientation="vertical" class="stv">
    <view class="stv-header">
      <slot name="header" />
    </view>

    <view sticky class="stv-toolbar">
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
    </view>

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
  </scroll-view>
</template>

<style>
.stv {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.stv-header {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.stv-toolbar {
  /* Sticks to the top of the scroll-view once scrolled onto. `sticky` is the
     native Lynx attribute; `position: sticky` covers the web runtime. */
  position: sticky;
  top: 0;
  z-index: 2;
  width: 100%;
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

.stv-pages {
  width: 100%;
}

.stv-page {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
