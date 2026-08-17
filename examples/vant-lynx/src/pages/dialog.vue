<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Dialog from '../components/Dialog/index.vue';
import {
  showDialog,
  showConfirmDialog,
  dialogState,
} from '../components/Dialog/dialog';
import type { DialogAction } from '../components/Dialog/types';

// Component usage
const showComponentDialog = ref(false);

// --- Basic Usage ---
function onClickAlert() {
  showDialog({
    title: '标题',
    message: '代码是写出来给人看的，附带能在机器上运行。',
  });
}

function onClickAlert2() {
  showDialog({
    message: '生命远不止连轴转和忙到极限，人类的体验远比这辽阔、丰富得多。',
  });
}

function onClickConfirm() {
  showConfirmDialog({
    title: '标题',
    message: '如果解决方法是丑陋的，那就肯定还有更好的解决方法，只是还没有发现而已。',
  });
}

// --- Round Button Style ---
function onClickRound() {
  showDialog({
    theme: 'round-button',
    title: '标题',
    message: '代码是写出来给人看的，附带能在机器上运行。',
  });
}

function onClickRound2() {
  showDialog({
    theme: 'round-button',
    message: '生命远不止连轴转和忙到极限，人类的体验远比这辽阔、丰富得多。',
  });
}

// --- Before Close ---
function onClickBeforeClose() {
  const beforeClose = (action: DialogAction) =>
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(action === 'confirm'), 1000);
    });

  showConfirmDialog({
    title: '标题',
    message: '如果解决方法是丑陋的，那就肯定还有更好的解决方法，只是还没有发现而已。',
    beforeClose,
  });
}
</script>

<template>
  <DemoPage title="Dialog 弹出框">
    <!-- 基础用法 -->
    <CellGroup title="基础用法" inset>
      <Cell title="提示弹窗" is-link @click="onClickAlert" />
      <Cell title="提示弹窗（无标题）" is-link @click="onClickAlert2" />
      <Cell title="确认弹窗" is-link @click="onClickConfirm" />
    </CellGroup>

    <!-- 圆角按钮样式 -->
    <CellGroup title="圆角按钮样式" inset>
      <Cell title="提示弹窗" is-link @click="onClickRound" />
      <Cell title="提示弹窗（无标题）" is-link @click="onClickRound2" />
    </CellGroup>

    <!-- 异步关闭 -->
    <CellGroup title="异步关闭" inset>
      <Cell title="异步关闭" is-link @click="onClickBeforeClose" />
    </CellGroup>

    <!-- 使用 Dialog 组件 -->
    <CellGroup title="使用 Dialog 组件" inset>
      <Cell title="使用 Dialog 组件" is-link @click="showComponentDialog = true" />
    </CellGroup>

    <!-- Component usage dialog -->
    <Dialog
      v-model:show="showComponentDialog"
      title="标题"
      show-cancel-button
      message="代码是写出来给人看的，附带能在机器上运行。"
    />

    <!-- Imperative dialog (driven by dialogState) -->
    <Dialog
      v-model:show="dialogState.show"
      :title="dialogState.title"
      :message="dialogState.message"
      :theme="dialogState.theme"
      :show-cancel-button="dialogState.showCancelButton"
      :show-confirm-button="dialogState.showConfirmButton"
      :confirm-button-text="dialogState.confirmButtonText"
      :cancel-button-text="dialogState.cancelButtonText"
      :confirm-button-color="dialogState.confirmButtonColor"
      :cancel-button-color="dialogState.cancelButtonColor"
      :close-on-click-overlay="dialogState.closeOnClickOverlay"
      :before-close="dialogState.beforeClose"
      :callback="dialogState.callback"
      :overlay="dialogState.overlay"
      :class-name="dialogState.className"
      :message-align="dialogState.messageAlign"
      :width="dialogState.width"
    />
  </DemoPage>
</template>
