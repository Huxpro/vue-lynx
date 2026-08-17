<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useOverlay } from '../composables/useOverlay';
import { useSession } from '../composables/useSession';
import Icon from './ui/Icon.vue';
import UAvatar from './ui/UAvatar.vue';

/**
 * Port of app/components/UserMenu.vue. Opens the UserMenuSheet overlay
 * (theme pickers, appearance, logout).
 */
defineProps<{ collapsed?: boolean }>();

const router = useRouter();
const { user, clear } = useSession();
const overlay = useOverlay();

async function openMenu() {
  const instance = overlay.open<'logout' | false>('user-menu');
  const action = await instance.result;
  if (action === 'logout') {
    await clear();
    router.push('/');
  }
}
</script>

<template>
  <view
    class="flex flex-row items-center gap-2 rounded-md px-2 py-1.5"
    :class="collapsed ? 'justify-center' : ''"
    @tap="openMenu"
  >
    <UAvatar :src="user?.avatar" :size="24" />
    <text v-if="!collapsed" class="text-sm text-default flex-1" text-maxline="1">
      {{ user?.name || user?.username }}
    </text>
    <Icon v-if="!collapsed" name="i-lucide-chevrons-up-down" tone="dimmed" :size="16" />
  </view>
</template>
