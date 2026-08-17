<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import ShareSheet from '../components/ShareSheet/index.vue';
import type { ShareSheetOption } from '../components/ShareSheet/types';

const showBasic = ref(false);
const showMultiLine = ref(false);
const showCustomIcon = ref(false);
const showWithDesc = ref(false);

const options = computed(() => [
  { name: '微信', icon: 'wechat' },
  { name: '微博', icon: 'weibo' },
  { name: '复制链接', icon: 'link' },
  { name: '分享海报', icon: 'poster' },
  { name: '二维码', icon: 'qrcode' },
]);

const multiLineOptions = computed(() => [
  [
    { name: '微信', icon: 'wechat' },
    { name: '朋友圈', icon: 'wechat-moments' },
    { name: '微博', icon: 'weibo' },
    { name: 'QQ', icon: 'qq' },
  ],
  [
    { name: '复制链接', icon: 'link' },
    { name: '分享海报', icon: 'poster' },
    { name: '二维码', icon: 'qrcode' },
    { name: '小程序码', icon: 'weapp-qrcode' },
  ],
]);

const customIconOptions = computed(() => [
  {
    name: '名称',
    icon: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-icon-fire.png',
  },
  {
    name: '名称',
    icon: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-icon-light.png',
  },
  {
    name: '名称',
    icon: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-icon-water.png',
  },
  { name: '名称', icon: 'label' },
]);

const optionsWithDesc = computed(() => [
  { name: '微信', icon: 'wechat' },
  { name: '微博', icon: 'weibo' },
  {
    name: '复制链接',
    icon: 'link',
    description: '描述信息',
  },
  { name: '分享海报', icon: 'poster' },
  { name: '二维码', icon: 'qrcode' },
]);

const onSelect = (option: ShareSheetOption) => {
  showBasic.value = false;
  showMultiLine.value = false;
  showCustomIcon.value = false;
  showWithDesc.value = false;
};
</script>

<template>
  <DemoPage title="ShareSheet 分享面板">
    <view :class="'demo-block'">
      <text :class="'demo-block__title'">基础用法</text>
      <Cell title="显示分享面板" is-link @click="showBasic = true" />
      <ShareSheet
        v-model:show="showBasic"
        title="立即分享给好友"
        :options="options"
        @select="onSelect"
      />
    </view>

    <view :class="'demo-block'">
      <text :class="'demo-block__title'">展示多行选项</text>
      <Cell title="显示分享面板" is-link @click="showMultiLine = true" />
      <ShareSheet
        v-model:show="showMultiLine"
        title="立即分享给好友"
        :options="multiLineOptions"
        @select="onSelect"
      />
    </view>

    <view :class="'demo-block'">
      <text :class="'demo-block__title'">自定义图标</text>
      <Cell title="显示分享面板" is-link @click="showCustomIcon = true" />
      <ShareSheet
        v-model:show="showCustomIcon"
        :options="customIconOptions"
        @select="onSelect"
      />
    </view>

    <view :class="'demo-block'">
      <text :class="'demo-block__title'">展示描述信息</text>
      <Cell title="显示分享面板" is-link @click="showWithDesc = true" />
      <ShareSheet
        v-model:show="showWithDesc"
        title="立即分享给好友"
        :options="optionsWithDesc"
        description="描述信息"
        @select="onSelect"
      />
    </view>
  </DemoPage>
</template>
