<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Popup from '../components/Popup/index.vue';
import Button from '../components/Button/index.vue';

// Basic Usage
const showBasic = ref(false);

// Position
const showTop = ref(false);
const showBottom = ref(false);
const showLeft = ref(false);
const showRight = ref(false);

// Close Icon
const showCloseIcon = ref(false);
const showCloseIconTopLeft = ref(false);
const showCloseIconBottomLeft = ref(false);

// Round Corner
const showRoundBottom = ref(false);
const showRoundCenter = ref(false);

// Listen To Events
const showEvent = ref(false);
</script>

<template>
  <DemoPage title="Popup">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px' }">
        <Button type="primary" @tap="showBasic = true">
          <text :style="{ fontSize: '16px', color: '#fff' }">展示弹出层</text>
        </Button>
      </view>

      <!-- Position -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">弹出位置</text>
      <view :style="{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showTop = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">顶部弹出</text>
          </Button>
        </view>
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showBottom = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">底部弹出</text>
          </Button>
        </view>
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showLeft = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">左侧弹出</text>
          </Button>
        </view>
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showRight = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">右侧弹出</text>
          </Button>
        </view>
      </view>

      <!-- Close Icon -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">关闭图标</text>
      <view :style="{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showCloseIcon = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">关闭图标</text>
          </Button>
        </view>
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showCloseIconTopLeft = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">自定义图标位置</text>
          </Button>
        </view>
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showCloseIconBottomLeft = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">自定义关闭图标</text>
          </Button>
        </view>
      </view>

      <!-- Round Corner -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">圆角弹窗</text>
      <view :style="{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showRoundBottom = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">圆角弹窗（底部）</text>
          </Button>
        </view>
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" @tap="showRoundCenter = true">
            <text :style="{ fontSize: '16px', color: '#fff' }">圆角弹窗（居中）</text>
          </Button>
        </view>
      </view>

      <!-- Listen To Events -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">监听事件</text>
      <view :style="{ marginBottom: '16px' }">
        <Button type="primary" @tap="showEvent = true">
          <text :style="{ fontSize: '16px', color: '#fff' }">监听事件</text>
        </Button>
      </view>

      <!-- Get Container (Teleport) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">指定挂载节点</text>
      <view :style="{ marginBottom: '16px' }">
        <text :style="{ fontSize: '14px', color: '#646566' }">Lynx 环境不支持 teleport</text>
      </view>
    </view>

    <!-- Basic Usage Popup -->
    <Popup v-model:show="showBasic" position="center">
      <view :style="{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <!-- Position Popups -->
    <Popup v-model:show="showTop" position="top">
      <view :style="{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <Popup v-model:show="showBottom" position="bottom">
      <view :style="{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <Popup v-model:show="showLeft" position="left">
      <view :style="{ width: '30%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <Popup v-model:show="showRight" position="right">
      <view :style="{ width: '30%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <!-- Close Icon Popups -->
    <Popup v-model:show="showCloseIcon" position="bottom" closeable>
      <view :style="{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <Popup
      v-model:show="showCloseIconTopLeft"
      position="bottom"
      closeable
      close-icon-position="top-left"
    >
      <view :style="{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <Popup
      v-model:show="showCloseIconBottomLeft"
      position="bottom"
      closeable
      close-icon="close"
      close-icon-position="top-left"
    >
      <view :style="{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <!-- Round Corner Popups -->
    <Popup v-model:show="showRoundBottom" position="bottom" round>
      <view :style="{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <Popup v-model:show="showRoundCenter" position="center" round>
      <view :style="{ padding: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>

    <!-- Listen To Events Popup -->
    <Popup
      v-model:show="showEvent"
      position="bottom"
      closeable
      @open="() => {}"
      @close="() => {}"
      @opened="() => {}"
      @closed="() => {}"
    >
      <view :style="{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: '16px', color: '#323233' }">内容</text>
      </view>
    </Popup>
  </DemoPage>
</template>
