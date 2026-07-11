<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';

import { useChatActions } from '../composables/useChatActions';
import { useChats } from '../composables/useChats';
import { useOverlay } from '../composables/useOverlay';
import { useSession } from '../composables/useSession';
import Logo from './Logo.vue';
import UserMenu from './UserMenu.vue';
import Icon from './ui/Icon.vue';
import UButton from './ui/UButton.vue';

/**
 * Port of the original layouts/default.vue UDashboardSidebar: logo header,
 * collapse toggle, New chat / Search items, date-grouped history with
 * per-chat actions, login/user footer. Drag-to-resize is skipped (PRD F1.2b)
 * and hover-revealed actions become an always-visible ellipsis (F1.6).
 */
const emit = defineEmits<{ openSearch: [] }>();

const router = useRouter();
const { groups } = useChats();
const { renameChat, deleteChat } = useChatActions();
const { loggedIn, login } = useSession();
const overlay = useOverlay();

const collapsed = ref(false);

function newChat() {
  router.push('/');
}

async function chatActions(item: { id: string; label: string }) {
  const instance = overlay.open<string | false>('menu', {
    groups: [
      [{ label: 'Rename', value: 'rename', icon: 'i-lucide-pencil' }],
      [{ label: 'Delete', value: 'delete', icon: 'i-lucide-trash', color: 'error' }],
    ],
  });
  const action = await instance.result;
  if (action === 'rename') {
    await renameChat(item.id, item.label === 'Untitled' ? '' : item.label);
  } else if (action === 'delete') {
    await deleteChat(item.id);
  }
}

function openChat(id: string) {
  router.push(`/chat/${id}`);
}
</script>

<template>
  <view
    class="flex flex-col py-4 bg-sidebar shrink-0 h-full"
    :style="{ width: collapsed ? '56px' : '256px' }"
  >
    <!-- header -->
    <view class="flex flex-row items-center px-4 pb-3" :class="collapsed ? 'justify-center px-2' : ''">
      <view v-if="!collapsed" class="flex flex-row items-end gap-0.5 flex-1" @tap="newChat">
        <Logo :size="32" />
        <text class="text-xl font-bold text-highlighted">Chat</text>
      </view>
      <view class="p-1.5 rounded-md" @tap="collapsed = !collapsed">
        <Icon name="i-lucide-panel-left" tone="muted" :size="20" />
      </view>
    </view>

    <!-- primary nav -->
    <view class="flex flex-col gap-0.5 px-2">
      <view
        class="flex flex-row items-center gap-2 rounded-md px-2.5 py-1.5"
        :class="collapsed ? 'justify-center' : ''"
        @tap="newChat"
      >
        <Icon name="i-lucide-circle-plus" tone="muted" :size="18" />
        <text v-if="!collapsed" class="text-sm text-default">New chat</text>
      </view>
      <view
        class="flex flex-row items-center gap-2 rounded-md px-2.5 py-1.5"
        :class="collapsed ? 'justify-center' : ''"
        @tap="emit('openSearch')"
      >
        <Icon name="i-lucide-search" tone="muted" :size="18" />
        <text v-if="!collapsed" class="text-sm text-default">Search</text>
      </view>
    </view>

    <!-- history -->
    <scroll-view v-if="!collapsed" scroll-orientation="vertical" class="flex-1 mt-2">
      <view class="flex flex-col px-2 pb-2">
        <view v-for="group in groups" :key="group.id" class="flex flex-col">
          <text class="text-xs font-semibold text-muted px-2.5 pt-4 pb-1.5">{{ group.label }}</text>
          <view
            v-for="item in group.items"
            :key="item.id"
            class="flex flex-row items-center rounded-md px-2.5 py-1.5 gap-1"
          >
            <view class="flex-1 flex flex-row" @tap="openChat(item.id)">
              <text
                class="text-sm flex-1"
                :class="item.label === 'Untitled' ? 'text-muted' : 'text-default'"
                text-maxline="1"
              >
                {{ item.label }}
              </text>
            </view>
            <view class="p-0.5 rounded" @tap="chatActions(item)">
              <Icon name="i-lucide-ellipsis" tone="dimmed" :size="16" />
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    <view v-else class="flex-1" />

    <!-- footer -->
    <view class="px-2 pt-3">
      <UserMenu v-if="loggedIn" :collapsed="collapsed" />
      <UButton
        v-else
        :label="collapsed ? '' : 'Login with GitHub'"
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        :block="!collapsed"
        :square="collapsed"
        @tap="login()"
      />
    </view>
  </view>
</template>
