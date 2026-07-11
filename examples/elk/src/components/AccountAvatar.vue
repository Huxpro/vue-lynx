<script setup lang="ts">
// Ported from elk: app/components/account/AccountAvatar.vue (minus the
// squircle mask + loading skeleton; Lynx <image> with a bg placeholder).
import type { mastodon } from 'masto';

withDefaults(defineProps<{
  account: mastodon.v1.Account;
  size?: number;
}>(), {
  size: 44,
});
</script>

<template>
  <image
    :src="account.avatar"
    class="account-avatar"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>

<style>
.account-avatar {
  border-radius: 50%;
  background-color: var(--c-bg-active);
}
</style>
