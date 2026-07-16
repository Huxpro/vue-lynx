<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import { useToast } from '../../../composables/useToast';
import type { UIMessage } from '../../../types/ai';
import { getTextFromMessage, isFileUIPart } from '../../../types/ai';
import Icon from '../../ui/Icon.vue';
import MotionPressable from '../../ui/MotionPressable.vue';

/**
 * Port of app/components/chat/message/MessageActions.vue. UTooltips are
 * omitted (hover-only affordance). Clipboard uses the web API when present;
 * native Lynx has no clipboard module, so copy falls back to a toast notice.
 */
const props = defineProps<{
  message: UIMessage & { createdAt?: string };
  streaming: boolean;
  editing: boolean;
  vote: boolean | null;
}>();

const emit = defineEmits<{
  edit: [message: UIMessage];
  regenerate: [message: UIMessage];
  vote: [message: UIMessage, isUpvoted: boolean];
}>();

const toast = useToast();

const formattedDate = computed(() => {
  const createdAt = props.message.metadata?.createdAt ?? props.message.createdAt;
  if (!createdAt) return null;
  const date = new Date(createdAt);
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
});

const hasFiles = computed(() => props.message.parts.some(isFileUIPart));

const copied = ref(false);

async function copy() {
  const text = getTextFromMessage(props.message);
  const nav = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } })
    .navigator;
  try {
    if (nav?.clipboard) {
      await nav.clipboard.writeText(text);
    } else {
      throw new Error('no clipboard');
    }
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
  <template v-if="message.role === 'assistant' && !streaming">
    <MotionPressable class="p-1.5 rounded-md" accessibility-label="Copy response" @tap="copy">
      <Icon
        :name="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
        :tone="copied ? 'primary' : 'muted'"
        :size="16"
      />
    </MotionPressable>

    <MotionPressable
      class="p-1.5 rounded-md"
      accessibility-label="Helpful response"
      @tap="emit('vote', message, true)"
    >
      <Icon name="i-lucide-thumbs-up" :tone="vote === true ? 'success' : 'muted'" :size="16" />
    </MotionPressable>

    <MotionPressable
      class="p-1.5 rounded-md"
      accessibility-label="Unhelpful response"
      @tap="emit('vote', message, false)"
    >
      <Icon name="i-lucide-thumbs-down" :tone="vote === false ? 'error' : 'muted'" :size="16" />
    </MotionPressable>

    <MotionPressable
      class="p-1.5 rounded-md"
      accessibility-label="Regenerate response"
      @tap="emit('regenerate', message)"
    >
      <Icon name="i-lucide-rotate-cw" tone="muted" :size="16" />
    </MotionPressable>
  </template>

  <template v-if="message.role === 'user' && !streaming && !editing">
    <text v-if="formattedDate" class="text-xs text-muted mr-1.5">{{ formattedDate }}</text>

    <MotionPressable
      v-if="!hasFiles"
      class="p-1.5 rounded-md"
      accessibility-label="Edit message"
      @tap="emit('edit', message)"
    >
      <Icon name="i-lucide-pencil" tone="muted" :size="16" />
    </MotionPressable>
  </template>
</template>
