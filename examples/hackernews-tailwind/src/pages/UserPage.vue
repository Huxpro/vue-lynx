<script setup lang="ts">
import { computed } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { fetchUser } from '../api';
import { stripHtml } from '../utils';
import Spinner from '../components/Spinner.vue';

const route = useRoute();
const router = useRouter();

const userId = computed(() => route.params.id as string);

const { data: user, isLoading, isError } = useQuery({
  queryKey: computed(() => ['user', userId.value]),
  queryFn: () => fetchUser(userId.value),
  staleTime: 60 * 1000,
});

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
    <view v-else-if="isError" class="items-center flex flex-col" :style="{ padding: '2em 3em', gap: '8px' }">
      <text :style="{ fontSize: '1.5em', fontWeight: 'bold', color: '#2e495e' }">
        User not found.
      </text>
      <text :style="{ color: '#3eaf7c', fontSize: '15px' }" @tap="goBack">
        &lt; Back
      </text>
    </view>

    <template v-else-if="user">
      <view class="bg-hn-card flex flex-col" :style="{ padding: '2em 3em' }">
        <!-- Back link -->
        <text
          :style="{ color: '#3eaf7c', fontSize: '13px', marginBottom: '12px' }"
          @tap="goBack"
        >
          &lt; Back
        </text>

        <!-- User ID: h1 equivalent -->
        <text :style="{ fontSize: '1.5em', fontWeight: 'bold', color: '#2e495e' }">
          User : {{ user.id }}
        </text>

        <!-- Meta -->
        <view class="flex flex-col" :style="{ marginTop: '12px', gap: '4px' }">
          <view class="flex flex-row">
            <text :style="{ color: '#595959', fontSize: '15px', width: '4em' }">Created:</text>
            <text :style="{ color: '#2e495e', fontSize: '15px' }">{{ user.created }}</text>
          </view>
          <view class="flex flex-row">
            <text :style="{ color: '#595959', fontSize: '15px', width: '4em' }">Karma:</text>
            <text :style="{ color: '#2e495e', fontSize: '15px' }">{{ user.karma }}</text>
          </view>
        </view>

        <!-- About -->
        <view v-if="user.about" class="border-t border-hn-border" :style="{ marginTop: '1em', paddingTop: '1em' }">
          <text :style="{ color: '#2e495e', fontSize: '15px', lineHeight: '1.5em' }">
            {{ stripHtml(user.about) }}
          </text>
        </view>

        <!-- Links -->
        <view class="flex flex-row" :style="{ marginTop: '1em', gap: '6px' }">
          <text :style="{ color: '#2e495e', fontSize: '15px', textDecorationLine: 'underline' }">
            submissions
          </text>
          <text :style="{ color: '#2e495e', fontSize: '15px' }">|</text>
          <text :style="{ color: '#2e495e', fontSize: '15px', textDecorationLine: 'underline' }">
            comments
          </text>
        </view>
      </view>
    </template>
  </scroll-view>
</template>
