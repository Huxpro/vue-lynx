<script setup lang="ts">
// Ported from elk: app/pages/compose.vue + components/publish/PublishWidget.vue.
// Plain-text editor with Elk's character counter and visibility picker.
// (TipTap rich-text editing, media upload and drafts persistence are not
// portable — see PRD "Publish / compose".)
import type { mastodon } from 'masto';
import { computed, onMounted, ref } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import StatusCard from '../components/StatusCard.vue';
import { fetchStatus } from '../composables/cache';
import { useMastoClient } from '../composables/masto';
import { checkLogin, currentInstance } from '../composables/users';

const route = useRoute();
const router = useRouter();

const signedIn = checkLogin();
const text = ref('');
const visibility = ref<mastodon.v1.StatusVisibility>('public');
const posting = ref(false);
const errorText = ref('');
const replyTo = ref<mastodon.v1.Status | null>(null);

const maxCharacters = computed(() =>
  (currentInstance.value?.configuration?.statuses?.maxCharacters as number | undefined) ?? 500,
);
const remaining = computed(() => maxCharacters.value - text.value.length);

const visibilities: { key: mastodon.v1.StatusVisibility; icon: string; label: string }[] = [
  { key: 'public', icon: 'earth-line', label: 'Public' },
  { key: 'unlisted', icon: 'lock-line', label: 'Unlisted' },
  { key: 'private', icon: 'lock-line', label: 'Followers' },
  { key: 'direct', icon: 'at-line', label: 'Direct' },
];

onMounted(async () => {
  const replyId = route.query.replyTo as string | undefined;
  if (replyId) {
    try {
      replyTo.value = await fetchStatus(replyId);
    }
    catch { /* keep composing without context */ }
  }
});

function onInput(e: { detail?: { value?: string } }) {
  text.value = e.detail?.value ?? '';
}

async function publish() {
  if (!text.value.trim() || posting.value || remaining.value < 0)
    return;
  posting.value = true;
  errorText.value = '';
  try {
    await useMastoClient().v1.statuses.create({
      status: text.value,
      visibility: visibility.value,
      inReplyToId: replyTo.value?.id,
    });
    text.value = '';
    router.back();
  }
  catch (e: any) {
    errorText.value = e?.message ?? 'Failed to publish.';
  }
  posting.value = false;
}
</script>

<template>
  <view class="page">
    <PageHeader :title="replyTo ? 'Reply' : 'New post'" back />

    <view v-if="!signedIn" class="compose-empty">
      <AppIcon name="quill-pen-line" :size="40" color="#919191" />
      <text class="compose-empty-text">Posting requires a signed-in session. Add an access token in Settings.</text>
    </view>

    <scroll-view v-else scroll-orientation="vertical" class="compose-scroll">
      <StatusCard v-if="replyTo" :status="replyTo" :show-actions="false" />

      <view class="compose-editor">
        <textarea
          class="compose-textarea"
          :placeholder="replyTo ? 'Write your reply' : 'What is on your mind?'"
          :value="text"
          :maxlength="maxCharacters"
          @input="onInput"
        />
      </view>

      <!-- visibility picker (Elk PublishVisibilityPicker) -->
      <view class="compose-visibilities">
        <view
          v-for="v in visibilities"
          :key="v.key"
          class="compose-visibility"
          :class="visibility === v.key ? 'compose-visibility-active' : ''"
          @tap="visibility = v.key"
        >
          <AppIcon :name="v.icon" :size="14" :color="visibility === v.key ? '#cc7d24' : '#686868'" />
          <text
            class="compose-visibility-text"
            :style="visibility === v.key ? { color: '#cc7d24' } : undefined"
          >{{ v.label }}</text>
        </view>
      </view>

      <view class="compose-bar">
        <text class="compose-counter" :style="remaining < 0 ? { color: '#ff3c1b' } : undefined">
          {{ remaining }}
        </text>
        <view
          class="compose-publish"
          :class="!text.trim() || posting || remaining < 0 ? 'compose-publish-disabled' : ''"
          @tap="publish"
        >
          <text class="compose-publish-text">{{ posting ? 'Publishing…' : 'Publish!' }}</text>
        </view>
      </view>

      <text v-if="errorText" class="compose-error">{{ errorText }}</text>
    </scroll-view>
  </view>
</template>

<style>
.compose-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.compose-empty-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  text-align: center;
}

.compose-scroll {
  flex: 1;
  width: 100%;
}

.compose-editor {
  padding: 12px 16px;
}

.compose-textarea {
  width: 100%;
  height: 140px;
  font-size: 16px;
  color: var(--c-text-base);
  background-color: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 10px;
}

.compose-visibilities {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 0 16px;
}

.compose-visibility {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 4px 10px;
}

.compose-visibility-active {
  border-color: var(--c-primary);
  background-color: var(--c-primary-fade);
}

.compose-visibility-text {
  font-size: 12px;
  color: var(--c-text-secondary);
}

.compose-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  gap: 14px;
}

.compose-counter {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.compose-publish {
  background-color: var(--c-primary);
  border-radius: 18px;
  padding: 7px 18px;
}

.compose-publish-disabled {
  background-color: var(--c-bg-btn-disabled);
}

.compose-publish-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.compose-error {
  font-size: 13px;
  color: var(--c-danger);
  padding: 0 16px;
}
</style>
