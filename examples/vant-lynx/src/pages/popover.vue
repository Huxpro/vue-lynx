<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Popover from '../components/Popover/index.vue';
import Button from '../components/Button/index.vue';
import Grid from '../components/Grid/index.vue';
import GridItem from '../components/GridItem/index.vue';
import Toast from '../components/Toast/index.vue';
import { showToast } from '../components/Toast/toast';

const showLight = ref(false);
const showDark = ref(false);
const showHorizontal = ref(false);
const showVertical = ref(false);
const showIcon = ref(false);
const showDisabled = ref(false);
const showCustom = ref(false);
const showPlacement = ref(false);
const showUncontrolled = ref(false);

const actions = [
  { text: '选项一' },
  { text: '选项二' },
  { text: '选项三' },
];

const shortActions = [
  { text: '选项一' },
  { text: '选项二' },
];

const actionsWithIcon = [
  { text: '选项一', icon: 'add-o' },
  { text: '选项二', icon: 'music-o' },
  { text: '选项三', icon: 'more-o' },
];

const actionsDisabled = [
  { text: '选项一', disabled: true },
  { text: '选项二', disabled: true },
  { text: '选项三' },
];

const onSelect = (action: { text: string }) => showToast(action.text);
</script>

<template>
  <DemoPage title="Popover 气泡弹出框">
    <view :style="{ padding: '16px' }">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px' }">
        <Popover
          v-model:show="showLight"
          :actions="actions"
          placement="bottom-start"
          @select="onSelect"
        >
          <template #reference>
            <Button type="primary" text="浅色风格" />
          </template>
        </Popover>

        <view :style="{ marginLeft: '16px' }">
          <Popover
            v-model:show="showDark"
            theme="dark"
            :actions="actions"
            @select="onSelect"
          >
            <template #reference>
              <Button type="primary" text="深色风格" />
            </template>
          </Popover>
        </view>
      </view>

      <!-- 弹出位置 -->
      <text class="demo-section-title">弹出位置</text>
      <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingTop: '60px', paddingBottom: '60px', marginBottom: '16px' }">
        <Popover
          v-model:show="showPlacement"
          theme="dark"
          :actions="shortActions"
          placement="top"
          @select="onSelect"
        >
          <template #reference>
            <view :style="{ width: '60px', height: '60px', backgroundColor: '#1989fa', borderRadius: '8px' }" />
          </template>
        </Popover>
      </view>

      <!-- 排列方向 -->
      <text class="demo-section-title">排列方向</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px' }">
        <Popover
          v-model:show="showHorizontal"
          :actions="actions"
          actions-direction="horizontal"
          placement="bottom-start"
          @select="onSelect"
        >
          <template #reference>
            <Button type="primary" text="水平排列" />
          </template>
        </Popover>

        <view :style="{ marginLeft: '16px' }">
          <Popover
            v-model:show="showVertical"
            :actions="actions"
            @select="onSelect"
          >
            <template #reference>
              <Button type="primary" text="垂直排列" />
            </template>
          </Popover>
        </view>
      </view>

      <!-- 选项配置 -->
      <text class="demo-section-title">选项配置</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px' }">
        <Popover
          v-model:show="showIcon"
          :actions="actionsWithIcon"
          placement="bottom-start"
          @select="onSelect"
        >
          <template #reference>
            <Button type="primary" text="展示图标" />
          </template>
        </Popover>

        <view :style="{ marginLeft: '16px' }">
          <Popover
            v-model:show="showDisabled"
            :actions="actionsDisabled"
            @select="onSelect"
          >
            <template #reference>
              <Button type="primary" text="禁用选项" />
            </template>
          </Popover>
        </view>
      </view>

      <!-- 自定义内容 -->
      <text class="demo-section-title">自定义内容</text>
      <view :style="{ marginBottom: '16px' }">
        <Popover
          v-model:show="showCustom"
          placement="bottom-start"
        >
          <Grid
            square
            clickable
            :border="false"
            :column-num="3"
            :style="{ width: '240px' }"
          >
            <GridItem
              v-for="i in 6"
              :key="i"
              icon="photo-o"
              text="选项"
              @click="showCustom = false"
            />
          </Grid>
          <template #reference>
            <Button type="primary" text="自定义内容" />
          </template>
        </Popover>
      </view>

      <!-- 非受控模式 -->
      <text class="demo-section-title">非受控模式</text>
      <view :style="{ marginBottom: '16px' }">
        <Popover
          :actions="actions"
          placement="top-start"
          @select="onSelect"
        >
          <template #reference>
            <Button type="primary" text="非受控模式" />
          </template>
        </Popover>
      </view>
    </view>
  </DemoPage>
  <Toast />
</template>
