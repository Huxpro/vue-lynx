<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Icon from '../components/Icon/index.vue';
const basicIcons = ['arrow', 'arrow-left', 'success', 'cross', 'plus', 'minus', 'close', 'search'];
const outlinedIcons = ['star-o', 'like-o', 'warning-o', 'info-o', 'chat-o', 'setting-o', 'location-o', 'phone-o'];
const filledIcons = ['star', 'like', 'warning', 'info', 'chat', 'setting', 'location', 'phone'];
</script>

<template>
  <DemoPage title="Icon">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view v-for="icon in basicIcons" :key="icon" :style="{ width: '25%', alignItems: 'center', marginBottom: 16, display: 'flex', flexDirection: 'column' }">
          <Icon :name="icon" :size="24" />
          <text :style="{ fontSize: 10, color: '#969799', marginTop: 8 }">{{ icon }}</text>
        </view>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Badge</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Icon name="chat" :size="24" dot />
        </view>
        <view :style="{ marginRight: 24 }">
          <Icon name="chat" :size="24" :badge="5" />
        </view>
        <view :style="{ marginRight: 24 }">
          <Icon name="chat" :size="24" badge="99+" />
        </view>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Color & Size</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 16 }">
          <Icon name="star" :size="32" color="#1989fa" />
        </view>
        <view :style="{ marginRight: 16 }">
          <Icon name="like" :size="32" color="#ee0a24" />
        </view>
        <view :style="{ marginRight: 16 }">
          <Icon name="success" :size="32" color="#07c160" />
        </view>
      </view>
    </view>
  </DemoPage>
</template>
