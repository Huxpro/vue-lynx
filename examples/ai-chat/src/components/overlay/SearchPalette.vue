<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import { useChats } from '../../composables/useChats';
import { fuzzyMatch } from '../../lib/search';
import Icon from '../ui/Icon.vue';

/**
 * Port of UDashboardSearch (the ⌘K command palette): full-screen search
 * overlay filtering the grouped chat history plus a "New chat" action.
 * Keyboard navigation is skipped (PRD F1.8) — items are tapped.
 */
const emit = defineEmits<{ close: [result: string | false] }>();

const { groups } = useChats();

const query = ref('');

function onInput(e: { detail?: { value?: string } }) {
  query.value = e.detail?.value ?? '';
}

const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase();
  const links = {
    id: 'links',
    label: 'Actions',
    items: [{ id: '__new__', label: 'New chat', icon: 'i-lucide-circle-plus' }],
  };
  const chatGroups = groups.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => fuzzyMatch(item.label, q)),
    }))
    .filter((group) => group.items.length > 0);
  if (!fuzzyMatch('New chat', q)) return chatGroups;
  return [links, ...chatGroups];
});
</script>

<template>
  <view class="absolute inset-0 z-40 flex flex-col items-center">
    <view class="absolute inset-0 z-40 modal-backdrop" @tap="emit('close', false)" />

    <view
      class="rounded-lg bg-default border border-default shadow-lg flex flex-col z-50 overflow-hidden mt-20"
      style="width: 560px; max-width: 92%; max-height: 70%"
    >
      <view class="flex flex-row items-center gap-2.5 px-4 py-3 border-b border-default">
        <Icon name="i-lucide-search" tone="dimmed" :size="18" />
        <input
          :value="query"
          placeholder="Search chats..."
          class="palette-input text-base text-highlighted flex-1"
          @input="onInput"
        />
        <view class="p-1 rounded-md" @tap="emit('close', false)">
          <Icon name="i-lucide-x" tone="muted" :size="16" />
        </view>
      </view>

      <scroll-view scroll-orientation="vertical" class="flex-1">
        <view class="flex flex-col p-2">
          <view v-for="group in filteredGroups" :key="group.id" class="flex flex-col">
            <text class="text-xs font-semibold text-muted px-2.5 pt-3 pb-1">{{ group.label }}</text>
            <view
              v-for="item in group.items"
              :key="item.id"
              class="flex flex-row items-center gap-2.5 rounded-md px-2.5 py-2"
              @tap="emit('close', item.id)"
            >
              <Icon
                :name="'icon' in item && item.icon ? item.icon : 'i-lucide-message-circle'"
                tone="muted"
                :size="16"
              />
              <text class="text-sm text-default flex-1" text-maxline="1">{{ item.label }}</text>
            </view>
          </view>

          <view v-if="!filteredGroups.length" class="flex flex-col items-center py-8">
            <text class="text-sm text-muted">No chats found</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style>
.palette-input {
  height: 32px;
  background-color: transparent;
  border: none;
  color: var(--ui-text-highlighted);
  caret-color: var(--ui-primary);
  --placeholder-color: var(--ui-text-dimmed);
}
</style>
