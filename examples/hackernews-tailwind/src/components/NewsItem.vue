<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { FeedItem } from '../api';
import { toHost, isAbsoluteUrl } from '../utils';

const props = defineProps<{
  item: FeedItem;
}>();

const router = useRouter();
const host = toHost(props.item.url);

function goToItem() {
  router.push(`/item/${props.item.id}`);
}

function goToUser() {
  router.push(`/user/${props.item.user}`);
}
</script>

<template>
  <view
    class="bg-hn-card flex flex-row border-b border-hn-border"
    :style="{ padding: '20px 16px 20px 0' }"
  >
    <!-- Score: 80px wide, centered -->
    <view :style="{ width: '80px', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
      <text :style="{ color: '#3eaf7c', fontSize: '1.1em', fontWeight: '700' }">
        {{ item.points }}
      </text>
    </view>

    <!-- Content -->
    <view class="flex flex-col flex-1">
      <!-- Title -->
      <text
        :style="{ color: '#2e495e', fontSize: '15px', lineHeight: '20px' }"
        @tap="goToItem"
      >
        {{ item.title }}
      </text>

      <!-- Host -->
      <text
        v-if="isAbsoluteUrl(item.url)"
        :style="{ color: '#595959', fontSize: '0.85em', marginTop: '2px' }"
      >
        ({{ host }})
      </text>

      <!-- Meta line -->
      <view class="flex flex-row flex-wrap" :style="{ marginTop: '4px', gap: '4px' }">
        <text v-if="item.type !== 'job'" :style="{ color: '#595959', fontSize: '0.85em' }">
          by
        </text>
        <text
          v-if="item.type !== 'job'"
          :style="{ color: '#595959', fontSize: '0.85em', textDecorationLine: 'underline' }"
          @tap="goToUser"
        >
          {{ item.user }}
        </text>
        <text :style="{ color: '#595959', fontSize: '0.85em' }">
          {{ item.time_ago }}
        </text>
        <text v-if="item.type !== 'job'" :style="{ color: '#595959', fontSize: '0.85em' }">
          |
        </text>
        <text
          v-if="item.type !== 'job'"
          :style="{ color: '#595959', fontSize: '0.85em', textDecorationLine: 'underline' }"
          @tap="goToItem"
        >
          {{ item.comments_count }} comments
        </text>
      </view>
    </view>
  </view>
</template>
