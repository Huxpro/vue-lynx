<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useColorMode } from '../composables/useColorMode';
import { useOverlay } from '../composables/useOverlay';
import { useSession } from '../composables/useSession';
import Icon from './ui/Icon.vue';
import UAvatar from './ui/UAvatar.vue';

/**
 * Port of app/components/UserMenu.vue. The nested UDropdownMenu becomes an
 * action sheet; template/docs external links are omitted (no browser on
 * native Lynx — PRD F4.6 note). Theme color pickers arrive with the theme
 * sheet (F4.6).
 */
defineProps<{ collapsed?: boolean }>();

const router = useRouter();
const { user, clear } = useSession();
const { colorMode } = useColorMode();
const overlay = useOverlay();

async function openMenu() {
  const instance = overlay.open<string | false>('menu', {
    title: user.value?.name || user.value?.username,
    groups: [
      [
        {
          label: 'Light',
          value: 'light',
          icon: 'i-lucide-sun',
          checked: colorMode.value === 'light',
        },
        {
          label: 'Dark',
          value: 'dark',
          icon: 'i-lucide-moon',
          checked: colorMode.value === 'dark',
        },
      ],
      [{ label: 'Log out', value: 'logout', icon: 'i-lucide-log-out' }],
    ],
  });
  const action = await instance.result;
  if (action === 'light' || action === 'dark') {
    colorMode.value = action;
  } else if (action === 'logout') {
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
