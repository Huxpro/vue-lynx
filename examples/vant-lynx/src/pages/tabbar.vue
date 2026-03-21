<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Tabbar from '../components/Tabbar/index.vue';
import TabbarItem from '../components/TabbarItem/index.vue';

const active1 = ref(0);
const active2 = ref(0);
const active3 = ref('home');
const active4 = ref(0);

// beforeChange demo: simulate async check, reject tab index 2
function beforeChange(name: number | string) {
  if (name === 2) {
    return false;
  }
  return true;
}
</script>

<template>
  <DemoPage title="Tabbar">

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabbar v-model="active1" :fixed="false">
          <TabbarItem :name="0" icon="home-o">Home</TabbarItem>
          <TabbarItem :name="1" icon="search">Search</TabbarItem>
          <TabbarItem :name="2" icon="chat-o">Notify</TabbarItem>
          <TabbarItem :name="3" icon="setting-o">Me</TabbarItem>
        </Tabbar>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Active: {{ active1 }}</text>

      <!-- Badge / Dot -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 8 }">Match by Name (with Badge)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabbar v-model="active3" :fixed="false">
          <TabbarItem name="home" icon="home-o">Home</TabbarItem>
          <TabbarItem name="search" icon="search" dot>Search</TabbarItem>
          <TabbarItem name="notify" icon="chat-o" badge="5">Notify</TabbarItem>
          <TabbarItem name="me" icon="setting-o" :badge="99">Me</TabbarItem>
        </Tabbar>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 8 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabbar v-model="active2" :fixed="false" active-color="#07c160" inactive-color="#000">
          <TabbarItem :name="0" icon="home-o">Home</TabbarItem>
          <TabbarItem :name="1" icon="search">Search</TabbarItem>
          <TabbarItem :name="2" icon="chat-o">Notify</TabbarItem>
          <TabbarItem :name="3" icon="setting-o">Me</TabbarItem>
        </Tabbar>
      </view>

      <!-- beforeChange Interceptor -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 8 }">Before Change (tab 3 blocked)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabbar v-model="active4" :fixed="false" :before-change="beforeChange">
          <TabbarItem :name="0">Allow</TabbarItem>
          <TabbarItem :name="1">Allow</TabbarItem>
          <TabbarItem :name="2">Blocked</TabbarItem>
          <TabbarItem :name="3">Allow</TabbarItem>
        </Tabbar>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Active: {{ active4 }} (tab index 2 is blocked by beforeChange)</text>
    </view>
  </DemoPage>
</template>
