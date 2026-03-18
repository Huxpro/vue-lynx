<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import NavLink from './NavLink.vue';
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }">
    <!-- Header -->
    <text :style="{ fontSize: '18px', fontWeight: 'bold', padding: '16px', color: '#111', backgroundColor: '#fff' }">
      Vue Router + Lynx
    </text>

    <!-- Navigation bar -->
    <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', paddingLeft: '8px', paddingRight: '8px', paddingBottom: '8px' }">
      <NavLink to="/" label="Home" />
      <NavLink to="/about" label="About" />
      <NavLink to="/users" label="Users" />
    </view>

    <!-- Route outlet -->
    <RouterView />
  </view>
</template>
