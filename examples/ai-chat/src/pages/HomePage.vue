<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { useRouter } from 'vue-router';

import PromptBox from '../components/chat/PromptBox.vue';
import Navbar from '../components/Navbar.vue';
import Icon from '../components/ui/Icon.vue';
import { useChats } from '../composables/useChats';
import { useSession } from '../composables/useSession';
import { apiFetch } from '../lib/api';
import { uid } from '../lib/uid';

/** Port of app/pages/index.vue. */
const router = useRouter();
const { user } = useSession();
const { fetchChats } = useChats();

const input = ref('');
const loading = ref(false);
const chatId = uid();

const greeting = computed(() => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';

  const name = user.value?.name?.split(' ')[0] || user.value?.username;

  return name ? `${timeGreeting}, ${name}` : timeGreeting;
});

async function createChat(prompt: string) {
  input.value = prompt;
  loading.value = true;

  const parts = [{ type: 'text', text: prompt }];

  try {
    const chat = await apiFetch<{ id: string }>('/api/chats', {
      method: 'POST',
      body: {
        id: chatId,
        message: { role: 'user', parts },
      },
    });
    void fetchChats();
    router.push(`/chat/${chat.id}`);
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  await createChat(input.value);
}

const quickChats = [
  { label: 'Why use Nuxt UI?', icon: 'i-logos-nuxt-icon' },
  { label: 'Help me create a Vue composable', icon: 'i-logos-vue' },
  { label: 'Tell me more about UnJS', icon: 'i-logos-unjs' },
  { label: 'Why should I consider VueUse?', icon: 'i-logos-vueuse' },
  { label: 'Tailwind CSS best practices', icon: 'i-logos-tailwindcss-icon' },
  { label: 'What is the weather in Bordeaux?', icon: 'i-lucide-sun' },
  { label: 'Show me a chart of sales data', icon: 'i-lucide-line-chart' },
];
</script>

<template>
  <view class="flex-1 flex flex-col min-w-0">
    <Navbar />

    <view class="flex-1 flex flex-col justify-center px-6 py-8 gap-6 home-container">
      <text class="text-4xl text-highlighted font-bold">{{ greeting }}</text>

      <PromptBox
        v-model="input"
        :status="loading ? 'streaming' : 'ready'"
        @submit="onSubmit"
      />

      <view class="flex flex-row flex-wrap gap-2">
        <view
          v-for="quickChat in quickChats"
          :key="quickChat.label"
          class="flex flex-row items-center gap-1.5 rounded-full border border-accented px-2.5 py-1.5"
          @tap="createChat(quickChat.label)"
        >
          <Icon :name="quickChat.icon" tone="muted" :size="14" />
          <text class="text-sm text-default">{{ quickChat.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.home-container {
  max-width: 768px;
  width: 100%;
  align-self: center;
}
</style>
