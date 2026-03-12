<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  UserDetail.vue — Dynamic route params (/users/:id)
  Demonstrates useRoute().params and router.back() for navigation.
-->
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
  <view :style="{ padding: 16 }">
    <text
      @tap="goBack"
      :style="{ fontSize: 14, color: '#1a73e8', marginBottom: 12 }"
    >
      ← Back to Users
    </text>

    <view v-if="user" :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
      <text :style="{ fontSize: 22, fontWeight: 'bold', color: '#111' }">
        {{ user.name }}
      </text>
      <text :style="{ fontSize: 13, color: '#1a73e8', marginTop: 4 }">
        {{ user.role }}
      </text>
      <text :style="{ fontSize: 14, color: '#555', marginTop: 12, lineHeight: 20 }">
        {{ user.bio }}
      </text>
      <text :style="{ fontSize: 11, color: '#aaa', marginTop: 16 }">
        Route param :id = {{ userId }}
      </text>
    </view>

    <view v-else :style="{ padding: 16 }">
      <text :style="{ fontSize: 14, color: '#e53935' }">
        User not found (id: {{ userId }})
      </text>
    </view>
  </view>
</template>
