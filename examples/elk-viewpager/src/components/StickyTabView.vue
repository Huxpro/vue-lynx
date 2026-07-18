<script setup lang="ts">
// A collapsing-header + sticky-tab-bar + horizontally-paged scaffold — the
// "native profile" pattern (Twitter/X, Mastodon apps): the #header scrolls
// away, the tab bar rises with it and pins to the top once you scroll onto
// it, and the panes below keep swiping horizontally, each with its own
// vertical scroll.
//
// It uses Lynx's scroll-coordinator (a.k.a. foldview): an absolutely
// positioned header that collapses, and a flex slot that holds the tab bar
// *above* the viewpager. As the coordinator scrolls, the whole slot slides
// up under the collapsing header until the tab bar reaches the top and pins;
// the slot then hands the scroll to the active viewpager pane's list. The
// tabs live in the slot (not in a sticky toolbar), which is what makes them
// start below the card and stick only on scroll.
import type { ShadowElement } from 'vue-lynx';
import { computed, ref, useTemplateRef, watch } from 'vue-lynx';

declare const SystemInfo: { platform?: string } | undefined;

// Like the viewpager, the coordinator element is registered under different
// names per platform: Lynx for Web ships the legacy XElement foldview names,
// while native OSS engines register the extracted scroll-coordinator element.
const isWeb = typeof SystemInfo !== 'undefined' && SystemInfo?.platform === 'web';
const foldTag = isWeb ? 'x-foldview-ng' : 'scroll-coordinator';
const foldHeaderTag = isWeb ? 'x-foldview-header-ng' : 'scroll-coordinator-header';
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

    <component :is="foldSlotTag" class="stv-slot">
      <!-- Tab bar sits at the top of the slot, above the viewpager. It rides
           up with the collapsing header and pins once it reaches the top. -->
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
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.stv-header {
  position: absolute;
  width: 100%;
}

.stv-slot {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  /* Web (foldview) is a standard-flexbox container, so a Lynx flex weight
     doesn't reach this raw child — a definite height keeps the slot filled. */
  height: 100%;
}

.stv-bar {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  border-bottom: 1px solid var(--c-border);
  /* Opaque so the collapsing header never shows through the pinned tab bar. */
  background-color: var(--c-bg-base);
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
  flex: 1;
  min-height: 0;
  width: 100%;
}

.stv-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
