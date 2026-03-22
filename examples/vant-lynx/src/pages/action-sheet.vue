<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ActionSheet from '../components/ActionSheet/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import { showToast } from '../components/Toast/toast';
import Toast from '../components/Toast/index.vue';

const showBasic = ref(false);
const showIcon = ref(false);
const showCancel = ref(false);
const showDescription = ref(false);
const showStatus = ref(false);
const showCustom = ref(false);

const simpleActions = computed(() => [
  { name: '选项一' },
  { name: '选项二' },
  { name: '选项三' },
]);

const iconActions = computed(() => [
  { name: '选项一', icon: 'cart-o' },
  { name: '选项二', icon: 'shop-o' },
  { name: '选项三', icon: 'star-o' },
]);

const statusActions = computed(() => [
  { name: '着色选项', color: '#ee0a24' },
  { name: '禁用选项', disabled: true },
  { name: '加载选项', loading: true },
]);

const descriptionActions = computed(() => [
  { name: '选项一' },
  { name: '选项二' },
  { name: '选项三', subname: '描述信息' },
]);

function onSelect(action: { name?: string }) {
  showBasic.value = false;
  showIcon.value = false;
  showCancel.value = false;
  showDescription.value = false;
  showStatus.value = false;
  showToast(action.name || '');
}
</script>

<template>
  <DemoPage title="ActionSheet 动作面板">
    <!-- 基础用法 -->
    <CellGroup title="基础用法" inset>
      <Cell title="基础用法" is-link @click="showBasic = true" />
      <Cell title="展示图标" is-link @click="showIcon = true" />
      <Cell title="展示取消按钮" is-link @click="showCancel = true" />
      <Cell title="展示描述信息" is-link @click="showDescription = true" />
    </CellGroup>

    <!-- 选项状态 -->
    <CellGroup title="选项状态" inset>
      <Cell title="选项状态" is-link @click="showStatus = true" />
    </CellGroup>

    <!-- 自定义面板 -->
    <CellGroup title="自定义面板" inset>
      <Cell title="自定义面板" is-link @click="showCustom = true" />
    </CellGroup>

    <!-- Basic ActionSheet -->
    <ActionSheet
      v-model:show="showBasic"
      :actions="simpleActions"
      @select="onSelect"
    />

    <!-- Icon ActionSheet -->
    <ActionSheet
      v-model:show="showIcon"
      :actions="iconActions"
      @select="onSelect"
    />

    <!-- Cancel ActionSheet -->
    <ActionSheet
      v-model:show="showCancel"
      :actions="simpleActions"
      cancel-text="取消"
      close-on-click-action
      @select="onSelect"
      @cancel="showToast('取消')"
    />

    <!-- Description ActionSheet -->
    <ActionSheet
      v-model:show="showDescription"
      title="标题"
      :actions="descriptionActions"
      cancel-text="取消"
      description="这是一段描述信息"
      close-on-click-action
      @select="onSelect"
    />

    <!-- Status ActionSheet -->
    <ActionSheet
      v-model:show="showStatus"
      :actions="statusActions"
      cancel-text="取消"
      close-on-click-action
      @select="onSelect"
    />

    <!-- Custom Panel ActionSheet -->
    <ActionSheet v-model:show="showCustom" title="标题">
      <view :style="{ padding: '16px', height: '160px' }">
        <text :style="{ fontSize: '14px', color: '#323233' }">内容</text>
      </view>
    </ActionSheet>

    <Toast />
  </DemoPage>
</template>
