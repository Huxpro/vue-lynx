<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import ActionBar from '../components/ActionBar/index.vue';
import ActionBarIcon from '../components/ActionBarIcon/index.vue';
import ActionBarButton from '../components/ActionBarButton/index.vue';
import Toast from '../components/Toast/index.vue';
import { ref } from 'vue-lynx';

const toastShow = ref(false);
const toastMessage = ref('');

function showToast(msg: string) {
  toastMessage.value = msg;
  toastShow.value = true;
}

function onClickIcon() {
  showToast('点击图标');
}

function onClickButton() {
  showToast('点击按钮');
}
</script>

<template>
  <DemoPage title="ActionBar 动作栏">
    <view class="demo-action-bar">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <view class="demo-action-bar__block">
        <ActionBar :safe-area-inset-bottom="false">
          <ActionBarIcon icon="chat-o" text="客服" @click="onClickIcon" />
          <ActionBarIcon icon="cart-o" text="购物车" @click="onClickIcon" />
          <ActionBarIcon icon="shop-o" text="店铺" @click="onClickIcon" />
          <ActionBarButton type="danger" text="立即购买" @click="onClickButton" />
        </ActionBar>
      </view>

      <!-- 徽标提示 -->
      <text class="demo-section-title">徽标提示</text>
      <view class="demo-action-bar__block">
        <ActionBar :safe-area-inset-bottom="false">
          <ActionBarIcon icon="chat-o" dot text="客服" />
          <ActionBarIcon icon="cart-o" badge="5" text="购物车" />
          <ActionBarIcon icon="shop-o" badge="12" text="店铺" />
          <ActionBarButton type="warning" text="加入购物车" />
          <ActionBarButton type="danger" text="立即购买" />
        </ActionBar>
      </view>

      <!-- 自定义图标颜色 -->
      <text class="demo-section-title">自定义图标颜色</text>
      <view class="demo-action-bar__block">
        <ActionBar :safe-area-inset-bottom="false">
          <ActionBarIcon icon="chat-o" text="客服" color="#ee0a24" />
          <ActionBarIcon icon="cart-o" text="购物车" />
          <ActionBarIcon icon="star" text="已收藏" color="#ff5000" />
          <ActionBarButton type="warning" text="加入购物车" />
          <ActionBarButton type="danger" text="立即购买" />
        </ActionBar>
      </view>

      <!-- 自定义按钮颜色 -->
      <text class="demo-section-title">自定义按钮颜色</text>
      <view class="demo-action-bar__block">
        <ActionBar :safe-area-inset-bottom="false">
          <ActionBarIcon icon="chat-o" text="客服" />
          <ActionBarIcon icon="cart-o" text="购物车" />
          <ActionBarButton color="#be99ff" type="warning" text="加入购物车" />
          <ActionBarButton color="#7232dd" type="danger" text="立即购买" />
        </ActionBar>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-action-bar {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.demo-action-bar__block {
  margin-bottom: 16px;
}

.demo-action-bar__block .van-action-bar {
  position: relative;
}
</style>
