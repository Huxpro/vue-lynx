<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import { apiFetch } from '../../lib/api';
import { useToast } from '../../composables/useToast';
import Icon from '../ui/Icon.vue';
import UButton from '../ui/UButton.vue';
import ModalShell from './ModalShell.vue';

/**
 * Port of app/components/chat/ChatVisibility.vue's UModal body: private/
 * shared options + copy link row. Resolves with the final visibility.
 */
const props = defineProps<{
  chatId: string;
  visibility: 'public' | 'private';
}>();

const emit = defineEmits<{ close: [result: 'public' | 'private'] }>();

const toast = useToast();
const current = ref<'public' | 'private'>(props.visibility);
const loading = ref(false);
const copied = ref(false);

const isShared = computed(() => current.value === 'public');
const shareUrl = computed(() => `https://chat.example.com/chat/${props.chatId}`);

const options = [
  {
    value: 'private' as const,
    label: 'Keep private',
    description: 'Only you have access',
    icon: 'i-lucide-lock',
  },
  {
    value: 'public' as const,
    label: 'Shared',
    description: 'Anyone with the link can view',
    icon: 'i-lucide-globe',
  },
];

async function updateVisibility(value: 'public' | 'private') {
  if (value === current.value || loading.value) return;
  loading.value = true;
  const previous = current.value;
  current.value = value;
  try {
    await apiFetch(`/api/chats/${props.chatId}/visibility`, {
      method: 'PATCH',
      body: { visibility: value },
    });
  } catch {
    current.value = previous;
    toast.add({
      description: 'Failed to update visibility',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

async function copyLink() {
  const nav = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } })
    .navigator;
  try {
    if (!nav?.clipboard) throw new Error('no clipboard');
    await nav.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    toast.add({ description: 'Clipboard is not available here', color: 'neutral' });
  }
}
</script>

<template>
  <ModalShell
    :title="isShared ? 'Chat shared' : 'Share chat'"
    :description="isShared ? 'Anyone with the link can view this chat.' : 'Only you can view this chat.'"
    @dismiss="emit('close', current)"
  >
    <view class="flex flex-col gap-0.5 rounded-lg border border-default p-1">
      <view
        v-for="option in options"
        :key="option.value"
        class="flex flex-row items-center gap-3 rounded-md px-3 py-2.5"
        :class="[current === option.value ? 'bg-elevated' : '', loading ? 'opacity-50' : '']"
        @tap="updateVisibility(option.value)"
      >
        <Icon :name="option.icon" tone="muted" :size="20" />

        <view class="flex flex-col flex-1 min-w-0">
          <text class="text-sm font-medium text-highlighted">{{ option.label }}</text>
          <text class="text-sm text-muted">{{ option.description }}</text>
        </view>

        <Icon v-if="current === option.value" name="i-lucide-circle-check" tone="primary" :size="20" />
      </view>
    </view>

    <view v-if="isShared" class="flex flex-row items-center gap-2 rounded-lg border border-default px-2 py-1.5 mt-4">
      <text class="flex-1 text-sm text-muted pl-1" text-maxline="1">{{ shareUrl }}</text>
      <UButton
        :label="copied ? 'Copied!' : 'Copy link'"
        size="sm"
        color="neutral"
        :variant="copied ? 'soft' : 'solid'"
        @tap="copyLink"
      />
    </view>
  </ModalShell>
</template>
