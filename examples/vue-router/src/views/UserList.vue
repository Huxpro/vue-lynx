<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  UserList.vue — Demonstrates v-for + programmatic navigation to dynamic routes
-->
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const users = [
  { id: 1, name: 'Alice', role: 'Engineer' },
  { id: 2, name: 'Bob', role: 'Designer' },
  { id: 3, name: 'Charlie', role: 'PM' },
];

function goToUser(id: number) {
  router.push(`/users/${id}`);
}
</script>

<template>
  <view :style="{ padding: 16 }">
    <text :style="{ fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 12 }">
      Users
    </text>

    <view
      v-for="user in users"
      :key="user.id"
      @tap="goToUser(user.id)"
      :style="{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
      }"
    >
      <view>
        <text :style="{ fontSize: 15, fontWeight: 'bold', color: '#111' }">
          {{ user.name }}
        </text>
        <text :style="{ fontSize: 12, color: '#777', marginTop: 2 }">
          {{ user.role }}
        </text>
      </view>
      <text :style="{ fontSize: 14, color: '#1a73e8' }">→</text>
    </view>
  </view>
</template>
