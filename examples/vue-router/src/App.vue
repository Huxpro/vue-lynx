<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  App.vue — Router shell with tab-style navigation

  Lynx has no <a> tag, so we use RouterLink's `custom` v-slot to render
  native <text> elements with @tap handlers for navigation.
-->
<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import NavLink from './NavLink.vue';
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }">
    <!-- Header -->
    <text :style="{ fontSize: 18, fontWeight: 'bold', padding: 16, color: '#111', backgroundColor: '#fff' }">
      Vue Router + Lynx
    </text>

    <!-- Navigation bar -->
    <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }">
      <NavLink to="/" label="Home" />
      <NavLink to="/about" label="About" />
      <NavLink to="/users" label="Users" />
    </view>

    <!-- Route outlet -->
    <RouterView />
  </view>
</template>
