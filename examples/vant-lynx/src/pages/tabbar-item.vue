<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Tabbar from '../components/Tabbar/index.vue';
import TabbarItem from '../components/TabbarItem/index.vue';

const basicActive = ref(0);
const badgeActive = ref(0);
const iconActive = ref(0);
const namedActive = ref('home');
const colorActive = ref(0);
</script>

<template>
  <DemoPage title="TabbarItem">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24, height: 60 }">
        <Tabbar v-model="basicActive" :fixed="false">
          <TabbarItem icon="home-o">Home</TabbarItem>
          <TabbarItem icon="search">Search</TabbarItem>
          <TabbarItem icon="friends-o">Friends</TabbarItem>
          <TabbarItem icon="setting-o">Settings</TabbarItem>
        </Tabbar>
      </view>

      <!-- With Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Badge</text>
      <view :style="{ marginBottom: 24, height: 60 }">
        <Tabbar v-model="badgeActive" :fixed="false">
          <TabbarItem icon="home-o">Home</TabbarItem>
          <TabbarItem icon="search" :dot="true">Search</TabbarItem>
          <TabbarItem icon="friends-o" badge="5">Friends</TabbarItem>
          <TabbarItem icon="setting-o" badge="20">Settings</TabbarItem>
        </Tabbar>
      </view>

      <!-- Custom Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Different Icons</text>
      <view :style="{ marginBottom: 24, height: 60 }">
        <Tabbar v-model="iconActive" :fixed="false">
          <TabbarItem icon="home-o">Home</TabbarItem>
          <TabbarItem icon="chat-o">Chat</TabbarItem>
          <TabbarItem icon="cart-o">Cart</TabbarItem>
          <TabbarItem icon="contact-o">Profile</TabbarItem>
        </Tabbar>
      </view>

      <!-- Named Items -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Named Items</text>
      <view :style="{ marginBottom: 24, height: 60 }">
        <Tabbar v-model="namedActive" :fixed="false">
          <TabbarItem name="home" icon="home-o">Home</TabbarItem>
          <TabbarItem name="search" icon="search">Search</TabbarItem>
          <TabbarItem name="friends" icon="friends-o">Friends</TabbarItem>
          <TabbarItem name="settings" icon="setting-o">Settings</TabbarItem>
        </Tabbar>
      </view>
      <view :style="{ marginBottom: 24 }">
        <text :style="{ fontSize: 12, color: '#969799' }">Active: {{ namedActive }}</text>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 24, height: 60 }">
        <Tabbar v-model="colorActive" :fixed="false" active-color="#ee0a24" inactive-color="#000">
          <TabbarItem icon="home-o">Home</TabbarItem>
          <TabbarItem icon="search">Search</TabbarItem>
          <TabbarItem icon="friends-o">Friends</TabbarItem>
          <TabbarItem icon="setting-o">Settings</TabbarItem>
        </Tabbar>
      </view>

      <!-- Without Border -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Without Border</text>
      <view :style="{ marginBottom: 24, height: 60 }">
        <Tabbar :model-value="0" :fixed="false" :border="false">
          <TabbarItem icon="home-o">Home</TabbarItem>
          <TabbarItem icon="search">Search</TabbarItem>
          <TabbarItem icon="setting-o">Settings</TabbarItem>
        </Tabbar>
      </view>
    </view>
  </DemoPage>
</template>
