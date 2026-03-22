<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Notify from '../components/Notify/index.vue';
import {
  showNotify,
  closeNotify,
  notifyState,
} from '../components/Notify/notify';

// Component usage state
const showComponentNotify = ref(false);
let componentTimer: ReturnType<typeof setTimeout> | null = null;

// 基本用法
function onShowBasic() {
  showNotify('通知内容');
}

// 通知类型
function onShowPrimary() {
  showNotify({ type: 'primary', message: '通知内容' });
}

function onShowSuccess() {
  showNotify({ type: 'success', message: '通知内容' });
}

function onShowDanger() {
  showNotify({ type: 'danger', message: '通知内容' });
}

function onShowWarning() {
  showNotify({ type: 'warning', message: '通知内容' });
}

// 自定义配置
function onShowCustomColor() {
  showNotify({
    message: '自定义颜色',
    color: '#ad0000',
    background: '#ffe1e1',
  });
}

function onShowCustomPosition() {
  showNotify({
    message: '自定义位置',
    position: 'bottom',
  });
}

function onShowCustomDuration() {
  showNotify({
    message: '自定义时长',
    duration: 1000,
  });
}

// 使用 Notify 组件
function onShowComponent() {
  showComponentNotify.value = true;
  if (componentTimer) clearTimeout(componentTimer);
  componentTimer = setTimeout(() => {
    showComponentNotify.value = false;
  }, 2000);
}
</script>

<template>
  <DemoPage title="Notify 消息通知">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- 基本用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">基本用法</text>
      <CellGroup>
        <Cell title="基础用法" is-link @click="onShowBasic" :border="false" />
      </CellGroup>

      <!-- 通知类型 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">通知类型</text>
      <CellGroup>
        <Cell title="主要通知" is-link @click="onShowPrimary" />
        <Cell title="成功通知" is-link @click="onShowSuccess" />
        <Cell title="危险通知" is-link @click="onShowDanger" />
        <Cell title="警告通知" is-link @click="onShowWarning" :border="false" />
      </CellGroup>

      <!-- 自定义配置 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">自定义配置</text>
      <CellGroup>
        <Cell title="自定义颜色" is-link @click="onShowCustomColor" />
        <Cell title="自定义位置" is-link @click="onShowCustomPosition" />
        <Cell title="自定义时长" is-link @click="onShowCustomDuration" :border="false" />
      </CellGroup>

      <!-- 使用 Notify 组件 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">使用 Notify 组件</text>
      <CellGroup>
        <Cell title="使用 Notify 组件" is-link @click="onShowComponent" :border="false" />
      </CellGroup>
    </view>

    <!-- Imperative API driven notify -->
    <Notify
      :show="notifyState.show"
      :type="notifyState.type"
      :message="notifyState.message"
      :color="notifyState.color"
      :background="notifyState.background"
      :position="notifyState.position"
      :class-name="notifyState.className"
      :lock-scroll="notifyState.lockScroll"
      :z-index="notifyState.zIndex"
      @update:show="(val: boolean) => { notifyState.show = val; }"
    />

    <!-- Component usage notify -->
    <Notify
      :show="showComponentNotify"
      type="success"
      message="通知内容"
      @update:show="(val: boolean) => { showComponentNotify = val; }"
    />
  </DemoPage>
</template>
