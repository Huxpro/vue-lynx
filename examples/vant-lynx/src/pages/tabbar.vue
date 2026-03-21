<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Tabbar from '../components/Tabbar/index.vue';
import TabbarItem from '../components/TabbarItem/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const active = ref(0);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Tabbar</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabbar v-model="active" :fixed="false">
          <TabbarItem :name="0">Home</TabbarItem>
          <TabbarItem :name="1">Search</TabbarItem>
          <TabbarItem :name="2">Notify</TabbarItem>
          <TabbarItem :name="3">Me</TabbarItem>
        </Tabbar>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Active: {{ active }}</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Current active tab index: {{ active }}</text>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabbar v-model="active" :fixed="false" active-color="#07c160" inactive-color="#000">
          <TabbarItem :name="0">Home</TabbarItem>
          <TabbarItem :name="1">Search</TabbarItem>
          <TabbarItem :name="2">Notify</TabbarItem>
          <TabbarItem :name="3">Me</TabbarItem>
        </Tabbar>
      </view>
    </view>
  </view>
</template>
