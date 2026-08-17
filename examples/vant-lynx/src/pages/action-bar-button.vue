<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import ActionBar from '../components/ActionBar/index.vue';
import ActionBarButton from '../components/ActionBarButton/index.vue';
import ActionBarIcon from '../components/ActionBarIcon/index.vue';
</script>

<template>
  <DemoPage title="ActionBarButton">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24 }">
        <ActionBar :placeholder="false" :safe-area-inset-bottom="false">
          <ActionBarIcon icon="chat-o" text="Chat" />
          <ActionBarIcon icon="cart-o" text="Cart" />
          <ActionBarButton type="warning" text="Add to Cart" />
          <ActionBarButton type="danger" text="Buy Now" />
        </ActionBar>
      </view>

      <!-- Button Types -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 80 }">Button Types</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 }">
        <ActionBarButton type="default" text="Default" />
        <ActionBarButton type="primary" text="Primary" />
        <ActionBarButton type="success" text="Success" />
        <ActionBarButton type="warning" text="Warning" />
        <ActionBarButton type="danger" text="Danger" />
      </view>

      <!-- With Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Icon</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 24 }">
        <ActionBarButton type="danger" text="Buy Now" icon="cart-o" />
        <ActionBarButton type="warning" text="Add to Cart" icon="star-o" />
      </view>

      <!-- Loading State -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading State</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 24 }">
        <ActionBarButton type="warning" text="Loading" :loading="true" />
        <ActionBarButton type="danger" text="Loading" :loading="true" />
      </view>

      <!-- Disabled State -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled State</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 24 }">
        <ActionBarButton type="warning" text="Disabled" :disabled="true" />
        <ActionBarButton type="danger" text="Disabled" :disabled="true" />
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 24 }">
        <ActionBarButton color="#7232dd" text="Custom Color" />
        <ActionBarButton color="#be99ff" text="Custom Color" />
      </view>
    </view>
  </DemoPage>
</template>
