<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import PullRefresh from '../components/PullRefresh/index.vue';
import Tab from '../components/Tab/index.vue';
import Tabs from '../components/Tabs/index.vue';
import Toast from '../components/Toast/index.vue';

const count = ref(0);
const loading1 = ref(false);
const loading2 = ref(false);
const loading3 = ref(false);
const showToast = ref(false);

const tips = computed(() => {
  if (count.value) {
    return `刷新次数: ${count.value}`;
  }
  return '下拉试试';
});

function onRefresh1() {
  setTimeout(() => {
    showToast.value = true;
    loading1.value = false;
    count.value++;
    setTimeout(() => { showToast.value = false; }, 1500);
  }, 1000);
}

function onRefresh2() {
  setTimeout(() => {
    loading2.value = false;
    count.value++;
  }, 1000);
}

function onRefresh3() {
  setTimeout(() => {
    showToast.value = true;
    loading3.value = false;
    count.value++;
    setTimeout(() => { showToast.value = false; }, 1500);
  }, 1000);
}
</script>

<template>
  <DemoPage title="PullRefresh">
    <Tabs>
      <Tab title="基础用法">
        <PullRefresh
          v-model="loading1"
          @refresh="onRefresh1"
        >
          <view :style="{ padding: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }">
            <text :style="{ fontSize: '14px', color: '#969799' }">{{ tips }}</text>
          </view>
        </PullRefresh>
      </Tab>

      <Tab title="成功提示">
        <PullRefresh
          v-model="loading2"
          success-text="刷新成功"
          @refresh="onRefresh2"
        >
          <view :style="{ padding: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }">
            <text :style="{ fontSize: '14px', color: '#969799' }">{{ tips }}</text>
          </view>
        </PullRefresh>
      </Tab>

      <Tab title="自定义提示">
        <PullRefresh
          v-model="loading3"
          head-height="80"
          @refresh="onRefresh3"
        >
          <template #pulling="{ distance }">
            <image
              src="https://fastly.jsdelivr.net/npm/@vant/assets/doge.png"
              :style="{ width: '140px', height: '72px', marginTop: '8px', borderRadius: '4px', transform: `scale(${distance / 80})` }"
            />
          </template>
          <template #loosing>
            <image
              src="https://fastly.jsdelivr.net/npm/@vant/assets/doge.png"
              :style="{ width: '140px', height: '72px', marginTop: '8px', borderRadius: '4px' }"
            />
          </template>
          <template #loading>
            <image
              src="https://fastly.jsdelivr.net/npm/@vant/assets/doge-fire.jpeg"
              :style="{ width: '140px', height: '72px', marginTop: '8px', borderRadius: '4px' }"
            />
          </template>
          <view :style="{ padding: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }">
            <text :style="{ fontSize: '14px', color: '#969799' }">{{ tips }}</text>
          </view>
        </PullRefresh>
      </Tab>
    </Tabs>

    <Toast v-if="showToast" message="刷新成功" />
  </DemoPage>
</template>
