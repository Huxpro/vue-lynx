<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import ActionBar from '../components/ActionBar/index.vue';
import ActionBarIcon from '../components/ActionBarIcon/index.vue';
import ActionBarButton from '../components/ActionBarButton/index.vue';
</script>

<template>
  <DemoPage title="ActionBarIcon">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24 }">
        <ActionBar :placeholder="false" :safe-area-inset-bottom="false">
          <ActionBarIcon icon="chat-o" text="Chat" />
          <ActionBarIcon icon="cart-o" text="Cart" />
          <ActionBarIcon icon="shop-o" text="Shop" />
          <ActionBarButton type="danger" text="Buy Now" />
        </ActionBar>
      </view>

      <!-- With Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 80 }">With Badge</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 24 }">
        <ActionBarIcon icon="chat-o" text="Chat" badge="5" />
        <ActionBarIcon icon="cart-o" text="Cart" badge="12" />
        <ActionBarIcon icon="shop-o" text="Shop" badge="99+" />
      </view>

      <!-- With Dot -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Dot</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 24 }">
        <ActionBarIcon icon="chat-o" text="Chat" :dot="true" />
        <ActionBarIcon icon="cart-o" text="Cart" :dot="true" />
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 24 }">
        <ActionBarIcon icon="chat-o" text="Chat" color="#ee0a24" />
        <ActionBarIcon icon="cart-o" text="Cart" color="#07c160" />
        <ActionBarIcon icon="star-o" text="Collect" color="#ff976a" />
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 24 }">
        <ActionBarIcon icon="chat-o" text="Chat" :disabled="true" />
        <ActionBarIcon icon="cart-o" text="Cart" :disabled="true" />
      </view>
    </view>
  </DemoPage>
</template>
