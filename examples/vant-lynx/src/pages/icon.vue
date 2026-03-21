<script setup lang="ts">
import { useRouter } from 'vue-router';
import Icon from '../components/Icon/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const basicIcons = ['arrow', 'arrow-left', 'success', 'cross', 'plus', 'minus', 'close', 'search'];
const outlinedIcons = ['star-o', 'like-o', 'warning-o', 'info-o', 'chat-o', 'setting-o', 'location-o', 'phone-o'];
const filledIcons = ['star', 'like', 'warning', 'info', 'chat', 'setting', 'location', 'phone'];
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Icon</text>
    </view>

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
  </view>
</template>
