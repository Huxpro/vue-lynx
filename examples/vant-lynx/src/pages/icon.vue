<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Icon from '../components/Icon/index.vue';
const basicIcons = ['arrow', 'arrow-left', 'success', 'cross', 'plus', 'minus', 'close', 'search'];
const outlinedIcons = ['star-o', 'like-o', 'warning-o', 'info-o', 'chat-o', 'setting-o', 'location-o', 'phone-o'];
const filledIcons = ['star', 'like', 'warning', 'info', 'chat', 'setting', 'location', 'phone'];

const demoIcon = 'chat-o';
const demoImage = 'https://fastly.jsdelivr.net/npm/@vant/assets/icon-demo.png';
</script>

<template>
  <DemoPage title="Icon">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">基础用法</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view v-for="icon in basicIcons" :key="icon" :style="{ width: '25%', alignItems: 'center', marginBottom: 16, display: 'flex', flexDirection: 'column' }">
          <Icon :name="icon" :size="24" />
          <text :style="{ fontSize: 10, color: '#969799', marginTop: 8 }">{{ icon }}</text>
        </view>
      </view>

      <!-- Using URL -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">使用图片 URL</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ width: '25%', alignItems: 'center', display: 'flex', flexDirection: 'column' }">
          <Icon :name="demoImage" :size="24" />
        </view>
      </view>

      <!-- Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">徽标提示</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Icon :name="demoIcon" :size="24" dot />
        </view>
        <view :style="{ marginRight: 24 }">
          <Icon :name="demoIcon" :size="24" badge="9" />
        </view>
        <view :style="{ marginRight: 24 }">
          <Icon :name="demoIcon" :size="24" badge="99+" />
        </view>
      </view>

      <!-- Icon Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">图标颜色</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 16 }">
          <Icon name="cart-o" :size="24" color="#1989fa" />
        </view>
        <view :style="{ marginRight: 16 }">
          <Icon name="fire-o" :size="24" color="#ee0a24" />
        </view>
      </view>

      <!-- Icon Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">图标大小</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 16 }">
          <Icon :name="demoIcon" size="40" />
        </view>
        <view :style="{ marginRight: 16 }">
          <Icon :name="demoIcon" :size="24" />
        </view>
      </view>

      <!-- Outlined Icons -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">线框风格</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view v-for="icon in outlinedIcons" :key="icon" :style="{ width: '25%', alignItems: 'center', marginBottom: 16, display: 'flex', flexDirection: 'column' }">
          <Icon :name="icon" :size="24" />
          <text :style="{ fontSize: 10, color: '#969799', marginTop: 8 }">{{ icon }}</text>
        </view>
      </view>

      <!-- Filled Icons -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">实底风格</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view v-for="icon in filledIcons" :key="icon" :style="{ width: '25%', alignItems: 'center', marginBottom: 16, display: 'flex', flexDirection: 'column' }">
          <Icon :name="icon" :size="24" />
          <text :style="{ fontSize: 10, color: '#969799', marginTop: 8 }">{{ icon }}</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
