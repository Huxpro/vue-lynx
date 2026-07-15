<script setup lang="ts">
// Elk-style tab bar (CommonRouteTabs) backed by the native viewpager
// element, so tab panes swipe horizontally like a native client.
// The tab bar and the pager are kept in sync in both directions:
// tap a tab → selectTab() animates the pager; swipe the pager →
// the change event moves the active tab.
import type { ShadowElement } from 'vue-lynx';
import { computed, ref, useTemplateRef, watch } from 'vue-lynx';

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

// Last page index the pager itself reported (via change). Used to skip
// the selectTab() round-trip when the pager is already on the page.
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
  <view class="tab-pager">
    <view class="tab-pager-bar">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab-pager-tab"
        @tap="$emit('update:modelValue', t.key)"
      >
        <text class="tab-pager-text" :class="modelValue === t.key ? 'tab-pager-text-active' : ''">{{ t.label }}</text>
        <view class="tab-pager-underline" :class="modelValue === t.key ? 'tab-pager-underline-active' : ''" />
      </view>
    </view>
    <x-viewpager-ng
      ref="pagerRef"
      class="tab-pager-pages"
      :initial-select-index="activeIndex"
      @change="onPagerChange"
    >
      <x-viewpager-item-ng
        v-for="t in tabs"
        :key="t.key"
        class="tab-pager-page"
      >
        <slot :name="t.key" />
      </x-viewpager-item-ng>
    </x-viewpager-ng>
  </view>
</template>

<style>
.tab-pager {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
}

.tab-pager-bar {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--c-border);
}

.tab-pager-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding-top: 10px;
}

.tab-pager-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  padding-bottom: 8px;
  transition: color var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.tab-pager-text-active {
  color: var(--c-text-base);
  font-weight: 600;
}

.tab-pager-underline {
  height: 3px;
  width: 50%;
  border-radius: 2px;
  background-color: var(--c-primary);
  opacity: 0;
  transform: scaleX(0.35);
  transition: transform var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.tab-pager-underline-active {
  opacity: 1;
  transform: scaleX(1);
}

.tab-pager-pages {
  flex: 1;
  width: 100%;
}

.tab-pager-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
