<script setup lang="ts">
import { computed } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { fetchItem } from '../api';
import { toHost, isAbsoluteUrl } from '../utils';
import Comment from '../components/Comment.vue';
import Spinner from '../components/Spinner.vue';

const route = useRoute();
const router = useRouter();

const itemId = computed(() => Number(route.params.id));

const { data: item, isLoading, isError } = useQuery({
  queryKey: computed(() => ['item', itemId.value]),
  queryFn: () => fetchItem(itemId.value),
  staleTime: 60 * 1000,
});

const host = computed(() => item.value ? toHost(item.value.url) : '');

function goToUser() {
  if (item.value) {
    router.push(`/user/${item.value.user}`);
  }
}

function goBack() {
  router.back();
}
</script>

<template>
  <scroll-view class="flex-1" scroll-orientation="vertical">
    <!-- Loading -->
    <view v-if="isLoading" class="items-center" :style="{ padding: '40px' }">
      <Spinner :show="true" />
    </view>

    <!-- Error -->
    <view v-else-if="isError" class="items-center" :style="{ padding: '40px' }">
      <text :style="{ fontSize: '15px', color: '#e53e3e' }">Failed to load item.</text>
    </view>

    <template v-else-if="item">
      <!-- Item header card -->
      <view class="bg-hn-card flex flex-col" :style="{ padding: '1.8em 2em 1em' }">
        <!-- Back link -->
        <text
          :style="{ color: '#3eaf7c', fontSize: '13px', marginBottom: '12px' }"
          @tap="goBack"
        >
          &lt; Back
        </text>

        <!-- Title: 1.5em like reference h1 -->
        <text :style="{ color: '#2e495e', fontSize: '1.5em', fontWeight: 'bold', lineHeight: '1.3em' }">
          {{ item.title }}
        </text>

        <!-- Host -->
        <text
          v-if="isAbsoluteUrl(item.url)"
          :style="{ color: '#595959', fontSize: '0.85em', marginTop: '4px' }"
        >
          {{ host }}
        </text>

        <!-- Meta -->
        <view class="flex flex-row flex-wrap" :style="{ marginTop: '8px', gap: '4px' }">
          <text :style="{ color: '#595959', fontSize: '0.85em' }">
            {{ item.points }} points | by
          </text>
          <text
            :style="{ color: '#595959', fontSize: '0.85em', textDecorationLine: 'underline' }"
            @tap="goToUser"
          >
            {{ item.user }}
          </text>
          <text :style="{ color: '#595959', fontSize: '0.85em' }">
            {{ item.time_ago }}
          </text>
        </view>
      </view>

      <!-- Comments section -->
      <view class="bg-hn-card flex flex-col" :style="{ marginTop: '10px', padding: '0 2em 0.5em' }">
        <!-- Comments header -->
        <view class="flex flex-row items-center" :style="{ padding: '1em 0', gap: '8px' }">
          <text :style="{ fontSize: '1.1em', color: '#2e495e' }">
            {{
              item.comments && item.comments.length
                ? item.comments.length + ' comments'
                : 'No comments yet'
            }}
          </text>
        </view>

        <Comment
          v-for="comment in item.comments"
          :key="comment.id"
          :comment="comment"
          :depth="0"
        />
      </view>
    </template>
  </scroll-view>
</template>
