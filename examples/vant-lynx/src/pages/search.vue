<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Search from '../components/Search/index.vue';
import Toast from '../components/Toast/index.vue';

const value1 = ref('');
const value2 = ref('');
const value3 = ref('');
const value4 = ref('');
const value5 = ref('');
const value6 = ref('');

const toastShow = ref(false);
const toastMessage = ref('');

const showToast = (msg: string) => {
  toastMessage.value = msg;
  toastShow.value = true;
};

const onSearch = (val: string) => showToast(val);
const onCancel = () => showToast('取消');
const onClickButton = () => showToast(value6.value);
</script>

<template>
  <DemoPage title="Search 搜索">
    <!-- 基础用法 -->
    <view class="demo-search-block">
      <text class="demo-search-title">基础用法</text>
      <Search v-model="value1" placeholder="请输入搜索关键词" />
    </view>

    <!-- 事件监听 -->
    <view class="demo-search-block">
      <text class="demo-search-title">事件监听</text>
      <Search
        v-model="value5"
        placeholder="请输入搜索关键词"
        show-action
        @search="onSearch"
        @cancel="onCancel"
      />
    </view>

    <!-- 搜索框内容对齐 -->
    <view class="demo-search-block">
      <text class="demo-search-title">搜索框内容对齐</text>
      <Search
        v-model="value4"
        placeholder="请输入搜索关键词"
        input-align="center"
      />
    </view>

    <!-- 禁用搜索框 -->
    <view class="demo-search-block">
      <text class="demo-search-title">禁用搜索框</text>
      <Search v-model="value3" placeholder="请输入搜索关键词" :disabled="true" />
    </view>

    <!-- 自定义背景色 -->
    <view class="demo-search-block">
      <text class="demo-search-title">自定义背景色</text>
      <Search
        v-model="value2"
        placeholder="请输入搜索关键词"
        shape="round"
        background="#4fc08d"
      />
    </view>

    <!-- 自定义按钮 -->
    <view class="demo-search-block">
      <text class="demo-search-title">自定义按钮</text>
      <Search
        v-model="value6"
        show-action
        label="地址"
        placeholder="请输入搜索关键词"
        @search="onSearch"
      >
        <template #action>
          <view @tap="onClickButton">
            <text>搜索</text>
          </view>
        </template>
      </Search>
    </view>

    <Toast v-model:show="toastShow" :message="toastMessage" />
  </DemoPage>
</template>

<style>
.demo-search-block {
  display: flex;
  flex-direction: column;
}

.demo-search-title {
  font-size: 14px;
  color: #969799;
  padding: 12px 16px 4px;
}
</style>
