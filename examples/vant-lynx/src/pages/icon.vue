<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Icon from '../components/Icon/index.vue';

// Icon categories from @vant/icons config
const basicIcons = [
  'arrow', 'arrow-left', 'arrow-up', 'arrow-down',
  'success', 'cross', 'plus', 'minus', 'fail', 'circle',
];

const outlineIcons = [
  'location-o', 'like-o', 'star-o', 'phone-o', 'setting-o',
  'fire-o', 'coupon-o', 'cart-o', 'shopping-cart-o', 'cart-circle-o',
  'friends-o', 'comment-o', 'gem-o', 'gift-o', 'point-gift-o',
  'send-gift-o', 'service-o', 'bag-o', 'todo-list-o', 'balance-list-o',
  'close', 'clock-o', 'question-o', 'passed', 'add-o',
  'gold-coin-o', 'info-o', 'play-circle-o', 'pause-circle-o', 'stop-circle-o',
  'warning-o', 'phone-circle-o', 'music-o', 'smile-o', 'thumb-circle-o',
  'comment-circle-o', 'browsing-history-o', 'underway-o', 'more-o', 'video-o',
  'shop-o', 'shop-collect-o', 'share-o', 'chat-o', 'smile-comment-o',
  'vip-card-o', 'award-o', 'diamond-o', 'volume-o', 'cluster-o',
  'wap-home-o', 'photo-o', 'gift-card-o', 'expand-o', 'medal-o',
  'good-job-o', 'manager-o', 'label-o', 'bookmark-o', 'bill-o',
  'hot-o', 'hot-sale-o', 'new-o', 'new-arrival-o', 'goods-collect-o',
  'eye-o', 'delete-o', 'font-o',
];

const filledIcons = [
  'location', 'like', 'star', 'phone', 'setting',
  'fire', 'coupon', 'cart', 'shopping-cart', 'cart-circle',
  'friends', 'comment', 'gem', 'gift', 'point-gift',
  'send-gift', 'service', 'bag', 'todo-list', 'balance-list',
  'clear', 'clock', 'question', 'checked', 'add',
  'gold-coin', 'info', 'play-circle', 'pause-circle', 'stop-circle',
  'warning', 'phone-circle', 'music', 'smile', 'thumb-circle',
  'comment-circle', 'browsing-history', 'underway', 'more', 'video',
  'shop', 'shop-collect', 'share', 'chat', 'smile-comment',
  'vip-card', 'award', 'diamond', 'volume', 'cluster',
];

const demoIcon = 'chat-o';
const demoImage = 'https://fastly.jsdelivr.net/npm/@vant/assets/icon-demo.png';
</script>

<template>
  <DemoPage title="Icon 图标">
    <view class="demo-icon">
      <!-- Basic Usage -->
      <text class="demo-icon__title">基础用法</text>
      <view class="demo-icon__card">
        <view class="demo-icon__item">
          <Icon name="chat-o" />
          <text class="demo-icon__name">chat-o</text>
        </view>
        <view class="demo-icon__item">
          <Icon name="location-o" />
          <text class="demo-icon__name">location-o</text>
        </view>
        <view class="demo-icon__item">
          <Icon name="like-o" />
          <text class="demo-icon__name">like-o</text>
        </view>
      </view>

      <!-- Using URL -->
      <text class="demo-icon__title">使用图片 URL</text>
      <view class="demo-icon__card">
        <view class="demo-icon__item">
          <Icon :name="demoImage" size="32" />
        </view>
      </view>

      <!-- Badge -->
      <text class="demo-icon__title">徽标提示</text>
      <view class="demo-icon__card demo-icon__row">
        <view class="demo-icon__badge-item">
          <Icon :name="demoIcon" dot />
        </view>
        <view class="demo-icon__badge-item">
          <Icon :name="demoIcon" badge="9" />
        </view>
        <view class="demo-icon__badge-item">
          <Icon :name="demoIcon" badge="99+" />
        </view>
      </view>

      <!-- Icon Color -->
      <text class="demo-icon__title">图标颜色</text>
      <view class="demo-icon__card demo-icon__row">
        <view class="demo-icon__badge-item">
          <Icon name="cart-o" color="#1989fa" />
        </view>
        <view class="demo-icon__badge-item">
          <Icon name="fire-o" color="#ee0a24" />
        </view>
      </view>

      <!-- Icon Size -->
      <text class="demo-icon__title">图标大小</text>
      <view class="demo-icon__card demo-icon__row">
        <view class="demo-icon__badge-item">
          <Icon :name="demoIcon" size="40" />
        </view>
        <view class="demo-icon__badge-item">
          <Icon :name="demoIcon" size="3rem" />
        </view>
      </view>


      <!-- Icon Spin -->
      <text class="demo-icon__title">旋转动画</text>
      <view class="demo-icon__card demo-icon__row">
        <view class="demo-icon__badge-item">
          <Icon name="loading" spin />
        </view>
        <view class="demo-icon__badge-item">
          <Icon name="success" spin />
        </view>
      </view>

      <!-- Basic Icons -->
      <text class="demo-icon__title">基础图标</text>
      <view class="demo-icon__grid">
        <view v-for="icon in basicIcons" :key="icon" class="demo-icon__grid-item">
          <Icon :name="icon" />
          <text class="demo-icon__name">{{ icon }}</text>
        </view>
      </view>

      <!-- Outline Icons -->
      <text class="demo-icon__title">线框风格</text>
      <view class="demo-icon__grid">
        <view v-for="icon in outlineIcons" :key="icon" class="demo-icon__grid-item">
          <Icon :name="icon" />
          <text class="demo-icon__name">{{ icon }}</text>
        </view>
      </view>

      <!-- Filled Icons -->
      <text class="demo-icon__title">实底风格</text>
      <view class="demo-icon__grid">
        <view v-for="icon in filledIcons" :key="icon" class="demo-icon__grid-item">
          <Icon :name="icon" />
          <text class="demo-icon__name">{{ icon }}</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-icon {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.demo-icon__title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
  margin-top: 16px;
}

.demo-icon__card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.demo-icon__row {
  flex-direction: row;
}

.demo-icon__item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  font-size: 24px;
}

.demo-icon__badge-item {
  margin-right: 24px;
  font-size: 24px;
}

.demo-icon__name {
  font-size: 10px;
  color: #969799;
  margin-top: 8px;
}

.demo-icon__grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.demo-icon__grid-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  font-size: 24px;
}
</style>
