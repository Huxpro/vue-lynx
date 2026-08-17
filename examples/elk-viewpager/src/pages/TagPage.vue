<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/tags/[tag].vue — hashtag timeline
// + tag/TagActionButton.vue (follow/unfollow hashtag, auth-gated).
import type { mastodon } from 'masto';
import { computed, onMounted, ref } from 'vue-lynx';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { fetchTag } from '../composables/cache';
import { useMastoClient } from '../composables/masto';
import { checkLogin } from '../composables/users';

const route = useRoute();
const tag = computed(() => route.params.tag as string);
const tagInfo = ref<mastodon.v1.Tag | null>(null);
const paginator = computed(() =>
  useMastoClient().v1.timelines.tag.$select(tag.value).list({ limit: 30 }),
);

onMounted(async () => {
  try {
    tagInfo.value = await fetchTag(tag.value);
  }
  catch { /* tag info is decorative */ }
});

async function toggleFollowTag() {
  if (!checkLogin() || !tagInfo.value)
    return;
  const api = useMastoClient().v1.tags.$select(tag.value);
  tagInfo.value = tagInfo.value.following
    ? await api.unfollow()
    : await api.follow();
}
</script>

<template>
  <view class="page">
    <PageHeader :title="`#${tag}`" back>
      <view
        v-if="checkLogin() && tagInfo"
        class="tag-follow-btn"
        :class="tagInfo.following ? 'tag-follow-btn-active' : ''"
        @tap="toggleFollowTag"
      >
        <text class="tag-follow-text" :style="tagInfo.following ? { color: '#ffffff' } : undefined">
          {{ tagInfo.following ? 'Following' : 'Follow' }}
        </text>
      </view>
    </PageHeader>
    <TimelinePaginator :key="tag" :paginator="paginator" context="public" />
  </view>
</template>

<style>
.tag-follow-btn {
  border: 1px solid var(--c-primary);
  border-radius: 15px;
  padding: 4px 14px;
}

.tag-follow-btn-active {
  background-color: var(--c-primary);
}

.tag-follow-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-primary);
}
</style>
