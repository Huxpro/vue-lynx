<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const users: Record<string, { name: string; role: string; bio: string }> = {
  '1': { name: 'Alice', role: 'Engineer', bio: 'Builds cross-platform renderers with Vue and Lynx.' },
  '2': { name: 'Bob', role: 'Designer', bio: 'Crafts pixel-perfect interfaces for mobile experiences.' },
  '3': { name: 'Charlie', role: 'PM', bio: 'Coordinates teams to ship features on time.' },
};

const userId = computed(() => route.params.id as string);
const user = computed(() => users[userId.value]);

function goBack() {
  router.back();
}
</script>

<template>
  <view :style="{ padding: '16px' }">
    <text
      @tap="goBack"
      :style="{ fontSize: '14px', color: '#1a73e8', marginBottom: '12px' }"
    >
      ← Back to Users
    </text>

    <view v-if="user" :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
      <text :style="{ fontSize: '22px', fontWeight: 'bold', color: '#111' }">
        {{ user.name }}
      </text>
      <text :style="{ fontSize: '13px', color: '#1a73e8', marginTop: '4px' }">
        {{ user.role }}
      </text>
      <text :style="{ fontSize: '14px', color: '#555', marginTop: '12px', lineHeight: '20px' }">
        {{ user.bio }}
      </text>
      <text :style="{ fontSize: '11px', color: '#aaa', marginTop: '16px' }">
        Route param :id = {{ userId }}
      </text>
    </view>

    <view v-else :style="{ padding: '16px' }">
      <text :style="{ fontSize: '14px', color: '#e53935' }">
        User not found (id: {{ userId }})
      </text>
    </view>
  </view>
</template>
