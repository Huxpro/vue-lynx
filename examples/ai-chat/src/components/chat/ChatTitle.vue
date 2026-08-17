<script setup lang="ts">
import { computed } from 'vue-lynx';

import { useChatActions } from '../../composables/useChatActions';
import { useOverlay } from '../../composables/useOverlay';
import Icon from '../ui/Icon.vue';

/** Port of app/components/chat/ChatTitle.vue (UDropdownMenu -> sheet). */
const props = defineProps<{
  chatId: string;
  title?: string | null;
  isOwner: boolean;
}>();

const emit = defineEmits<{
  'update:title': [title: string];
}>();

const { renameChat, deleteChat } = useChatActions();
const overlay = useOverlay();

const displayTitle = computed(() => props.title || 'Untitled');

async function openMenu() {
  if (!props.isOwner) return;
  const instance = overlay.open<string | false>('menu', {
    groups: [
      [{ label: 'Rename', value: 'rename', icon: 'i-lucide-pencil' }],
      [{ label: 'Delete', value: 'delete', icon: 'i-lucide-trash', color: 'error' }],
    ],
  });
  const action = await instance.result;
  if (action === 'rename') {
    const newTitle = await renameChat(props.chatId, props.title);
    if (newTitle) emit('update:title', newTitle);
  } else if (action === 'delete') {
    await deleteChat(props.chatId);
  }
}
</script>

<template>
  <text v-if="!isOwner" class="text-sm font-medium text-highlighted" text-maxline="1">
    {{ displayTitle }}
  </text>

  <view v-else class="flex flex-row items-center gap-1 rounded-md px-2 py-1.5 min-w-0" @tap="openMenu">
    <text
      class="text-sm font-medium"
      :class="title ? 'text-highlighted' : 'text-muted'"
      text-maxline="1"
    >
      {{ displayTitle }}
    </text>
    <Icon name="i-lucide-chevron-down" tone="dimmed" :size="14" />
  </view>
</template>
