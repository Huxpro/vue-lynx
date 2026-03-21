<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ActionBar from '../components/ActionBar/index.vue';
import ActionBarIcon from '../components/ActionBarIcon/index.vue';
import ActionBarButton from '../components/ActionBarButton/index.vue';
</script>

<template>
  <DemoPage title="ActionBar">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 0.5, borderStyle: 'solid', borderColor: '#ebedf0' }">
          <ActionBarIcon text="Like" />
          <ActionBarIcon text="Cart" />
          <ActionBarButton type="warning" text="Add to Cart" />
          <ActionBarButton type="danger" text="Buy Now" />
        </view>
      </view>

      <!-- With Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Badge</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 0.5, borderStyle: 'solid', borderColor: '#ebedf0' }">
          <ActionBarIcon text="Like" dot />
          <ActionBarIcon text="Cart" :badge="5" />
          <ActionBarButton type="warning" text="Add to Cart" />
          <ActionBarButton type="danger" text="Buy Now" />
        </view>
      </view>

      <!-- Custom Button Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 0.5, borderStyle: 'solid', borderColor: '#ebedf0' }">
          <ActionBarIcon text="Like" />
          <ActionBarButton type="primary" text="Add to Cart" color="#be99ff" />
          <ActionBarButton type="primary" text="Buy Now" color="#7232dd" />
        </view>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 0.5, borderStyle: 'solid', borderColor: '#ebedf0' }">
          <ActionBarIcon text="Like" />
          <ActionBarButton type="warning" text="Add to Cart" disabled />
          <ActionBarButton type="danger" text="Buy Now" disabled />
        </view>
      </view>
    </view>
  </DemoPage>
</template>
