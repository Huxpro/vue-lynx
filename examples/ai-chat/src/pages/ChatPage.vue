<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue-lynx';
import type { ShadowElement } from 'vue-lynx';
import { useRoute } from 'vue-router';

import ChatTitle from '../components/chat/ChatTitle.vue';
import FilePreview from '../components/chat/FilePreview.vue';
import Indicator from '../components/chat/Indicator.vue';
import MessageActions from '../components/chat/message/MessageActions.vue';
import MessageContent from '../components/chat/message/MessageContent.vue';
import PromptBox from '../components/chat/PromptBox.vue';
import Navbar from '../components/Navbar.vue';
import Icon from '../components/ui/Icon.vue';
import { useAttachments } from '../composables/useAttachments';
import { useChat } from '../composables/useChat';
import { useChats } from '../composables/useChats';
import { useModels } from '../composables/useModels';
import { useOverlay } from '../composables/useOverlay';
import { useToast } from '../composables/useToast';
import { apiFetch } from '../lib/api';
import type { UIMessage } from '../types/ai';

/** Port of app/pages/chat/[id].vue. */
const route = useRoute();
const toast = useToast();
const overlay = useOverlay();
const { model } = useModels();
const { chats, fetchChats } = useChats();

const chatId = String(route.params.id);

interface ChatData {
  id: string;
  title: string | null;
  visibility: 'public' | 'private';
  isOwner: boolean;
  messages: UIMessage[];
}

const data = ref<ChatData | null>(null);
const loaded = ref(false);

const isOwner = computed(() => data.value?.isOwner ?? false);
const visibility = ref<'public' | 'private'>('private');
const title = ref<string | null>(null);

interface Vote {
  messageId: string;
  isUpvoted: boolean;
}
const votes = ref<Vote[]>([]);

const input = ref('');
const editingMessageId = ref<string | null>(null);

const { files, open, removeFile, clearFiles, uploading, uploadedFiles } = useAttachments();

const scrollRef = useTemplateRef<ShadowElement>('scrollRef');

const chat = useChat({
  id: chatId,
  model: () => model.value,
  onError(error) {
    let message = error.message;
    if (typeof message === 'string' && message[0] === '{') {
      try {
        message = JSON.parse(message).message || message;
      } catch {
        // keep original message on malformed JSON
      }
    }
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0,
    });
  },
});

const { messages, status, error, sendMessage, regenerate, stop } = chat;

async function scrollToBottom() {
  // nextTick waits for the main thread to apply pending ops so the
  // scroll-view ref is resolvable by selector.
  await nextTick();
  scrollRef.value
    ?.invoke({
      method: 'scrollTo',
      params: { offset: 1e6, smooth: false },
    })
    .exec();
}

// Auto-scroll while streaming (should-auto-scroll on UChatMessages).
watch(
  messages,
  () => {
    void scrollToBottom();
  },
  { deep: true, flush: 'post' },
);

// Re-pin after the stream settles: the last parts (e.g. source pills) can
// land after the final in-stream scroll was applied.
watch(status, (value) => {
  if (value === 'ready') {
    setTimeout(() => void scrollToBottom(), 180);
  }
});

// The title is generated server-side before streaming starts on the first
// message; refresh the sidebar/title as soon as the response streams.
watch(status, async (value) => {
  if (value !== 'streaming' || title.value || !isOwner.value) return;
  await fetchChats();
  const updated = chats.value.find((c) => c.id === chatId);
  if (updated && updated.label !== 'Untitled') {
    title.value = updated.label;
  }
});

onMounted(async () => {
  try {
    data.value = await apiFetch<ChatData | null>(`/api/chats/${chatId}`);
  } catch {
    data.value = null;
  }
  loaded.value = true;
  if (!data.value) return;

  visibility.value = data.value.visibility;
  title.value = data.value.title;
  messages.value = data.value.messages;

  if (data.value.isOwner) {
    try {
      votes.value = await apiFetch<Vote[]>(`/api/chats/${chatId}/votes`);
    } catch {
      votes.value = [];
    }
  }

  scrollToBottom();

  // Arriving from the home page with only the first user message: generate.
  if (data.value.isOwner && data.value.messages.length === 1) {
    void regenerate();
  }
});

async function handleSubmit() {
  if (input.value.trim() && !uploading.value) {
    void sendMessage({
      text: input.value,
      files: uploadedFiles.value.length > 0 ? uploadedFiles.value : undefined,
    });
    input.value = '';
    clearFiles();
  }
}

function startEdit(message: UIMessage) {
  if (editingMessageId.value) return;
  editingMessageId.value = message.id;
}

async function saveEdit(message: UIMessage, text: string) {
  try {
    await apiFetch(`/api/chats/${chatId}/messages`, {
      method: 'DELETE',
      body: { messageId: message.id, type: 'edit' },
    });
  } catch {
    toast.add({ description: 'Failed to save edit.', icon: 'i-lucide-alert-circle', color: 'error' });
    return;
  }
  editingMessageId.value = null;
  void sendMessage({ text, messageId: message.id });
}

async function regenerateMessage(message: UIMessage) {
  try {
    await apiFetch(`/api/chats/${chatId}/messages`, {
      method: 'DELETE',
      body: { messageId: message.id, type: 'regenerate' },
    });
  } catch {
    toast.add({ description: 'Failed to regenerate.', icon: 'i-lucide-alert-circle', color: 'error' });
    return;
  }
  void regenerate({ messageId: message.id });
}

function getVote(messageId: string): boolean | null {
  const vote = votes.value.find((v) => v.messageId === messageId);
  if (!vote) return null;
  return Boolean(vote.isUpvoted);
}

async function vote(message: UIMessage, isUpvoted: boolean) {
  const snapshot = votes.value.map((v) => ({ ...v }));
  const toggling = getVote(message.id) === isUpvoted;
  const next = toggling ? null : isUpvoted;

  votes.value =
    next === null
      ? votes.value.filter((v) => v.messageId !== message.id)
      : [
          ...votes.value.filter((v) => v.messageId !== message.id),
          { messageId: message.id, isUpvoted: next },
        ];

  try {
    await apiFetch(`/api/chats/${chatId}/votes`, {
      method: 'POST',
      body: next === null ? { messageId: message.id } : { messageId: message.id, isUpvoted: next },
    });
  } catch {
    votes.value = snapshot;
    toast.add({
      description: 'Failed to save vote',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
  }
}

async function openShare() {
  const instance = overlay.open<'public' | 'private'>('share', {
    chatId,
    visibility: visibility.value,
  });
  visibility.value = await instance.result;
}

const lastMessage = computed(() => messages.value[messages.value.length - 1]);

const showIndicator = computed(
  () =>
    status.value === 'submitted' ||
    (status.value === 'streaming' &&
      lastMessage.value?.role === 'assistant' &&
      lastMessage.value.parts.length === 0),
);
</script>

<template>
  <view v-if="data?.id" class="flex-1 flex flex-col min-w-0 min-h-0">
    <Navbar>
      <template #title>
        <ChatTitle
          :chat-id="data.id"
          :title="title"
          :is-owner="isOwner"
          @update:title="title = $event"
        />
      </template>

      <view v-if="isOwner" class="p-2 rounded-md" @tap="openShare">
        <Icon name="i-lucide-share" tone="muted" :size="18" />
      </view>
    </Navbar>

    <scroll-view ref="scrollRef" scroll-orientation="vertical" class="flex-1 min-h-0">
      <view class="flex flex-col gap-6 px-6 py-4 chat-container">
        <view
          v-for="message in messages"
          :key="message.id"
          class="flex flex-col"
          :class="message.role === 'user' ? 'items-end' : 'items-start'"
        >
          <!-- user bubble / assistant full width -->
          <view
            :class="
              message.role === 'user'
                ? 'bg-elevated rounded-lg px-4 py-3 user-bubble'
                : 'w-full'
            "
          >
            <MessageContent
              :message="message"
              :editing="isOwner && editingMessageId === message.id"
              @save="saveEdit"
              @cancel-edit="editingMessageId = null"
            />
          </view>

          <!-- actions -->
          <view v-if="isOwner" class="flex flex-row items-center mt-1.5 actions-row">
            <MessageActions
              :message="message"
              :streaming="status === 'streaming' && message.id === lastMessage?.id"
              :editing="editingMessageId === message.id"
              :vote="getVote(message.id)"
              @vote="(m, up) => vote(m, up)"
              @edit="startEdit"
              @regenerate="regenerateMessage"
            />
          </view>
        </view>

        <!-- thinking indicator -->
        <view v-if="showIndicator" class="flex flex-row items-center gap-1.5">
          <Indicator />
          <text class="text-sm text-muted shimmer-pulse">Thinking...</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="isOwner" class="px-6 pb-4 pt-1 prompt-container">
      <PromptBox
        v-model="input"
        :status="status"
        :error="error?.message"
        :disabled="uploading"
        @submit="handleSubmit"
        @stop="stop()"
        @reload="regenerate()"
        @attach="open"
      >
        <template v-if="files.length > 0" #header>
          <view class="flex flex-row flex-wrap gap-2 px-2 pt-2">
            <FilePreview
              v-for="file in files"
              :key="file.id"
              :name="file.name"
              :type="file.mediaType"
              :preview-url="file.url"
              :status="file.status"
              removable
              @remove="removeFile(file.id)"
            />
          </view>
        </template>
      </PromptBox>
    </view>
  </view>

  <view v-else-if="loaded" class="flex-1 flex flex-col items-center justify-center gap-3">
    <text class="error-404 text-primary">404</text>
    <text class="text-2xl font-bold text-highlighted">Chat not found</text>
  </view>
</template>

<style>
.chat-container,
.prompt-container {
  max-width: 768px;
  width: 100%;
  align-self: center;
}
.user-bubble {
  max-width: 80%;
}
.error-404 {
  font-size: 56px;
  line-height: 60px;
  font-weight: 700;
}
</style>
