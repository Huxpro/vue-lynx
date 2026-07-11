<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/tags/[tag].vue — hashtag timeline.
import { computed } from 'vue-lynx';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { useMastoClient } from '../composables/masto';

const route = useRoute();
const tag = computed(() => route.params.tag as string);
const paginator = computed(() =>
  useMastoClient().v1.timelines.tag.$select(tag.value).list({ limit: 30 }),
);
</script>

<template>
  <view class="page">
    <PageHeader :title="`#${tag}`" back />
    <TimelinePaginator :key="tag" :paginator="paginator" context="public" />
  </view>
</template>
