<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import BackTop from '../components/BackTop/index.vue';
import Cell from '../components/Cell/index.vue';

const activeTab = ref(0);
const backTopRef1 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef2 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef3 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef4 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef5 = ref<InstanceType<typeof BackTop> | null>(null);

const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

function setTab(tab: number) {
  activeTab.value = tab;
}

function simulateScroll(refObj: any) {
  refObj?.handleScroll({ detail: { scrollTop: 300 } });
}

function simulateScrollReset(refObj: any) {
  refObj?.handleScroll({ detail: { scrollTop: 0 } });
}
</script>

<template>
  <DemoPage title="BackTop 回到顶部">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Tab Selector -->
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px', flexWrap: 'wrap' }">
        <view
          v-for="(label, idx) in ['基础用法', '自定义位置', '自定义内容', '设置滚动目标', '瞬间滚动']"
          :key="idx"
          :style="{
            paddingTop: '6px',
            paddingBottom: '6px',
            paddingLeft: '12px',
            paddingRight: '12px',
            marginRight: '8px',
            marginBottom: '8px',
            borderRadius: '4px',
            backgroundColor: activeTab === idx ? '#1989fa' : '#f7f8fa',
          }"
          @tap="setTab(idx)"
        >
          <text :style="{ fontSize: '12px', color: activeTab === idx ? '#fff' : '#323233' }">{{ label }}</text>
        </view>
      </view>

      <!-- 基础用法 -->
      <view v-if="activeTab === 0">
        <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
        <view :style="{ marginBottom: '12px' }">
          <view
            :style="{ padding: '10px', backgroundColor: '#1989fa', borderRadius: '4px', marginBottom: '8px' }"
            @tap="simulateScroll(backTopRef1)"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">模拟滚动（显示按钮）</text>
          </view>
          <view
            :style="{ padding: '10px', backgroundColor: '#f7f8fa', borderRadius: '4px', marginBottom: '8px' }"
            @tap="simulateScrollReset(backTopRef1)"
          >
            <text :style="{ color: '#323233', fontSize: '14px' }">重置滚动（隐藏按钮）</text>
          </view>
        </view>
        <Cell v-for="item in items" :key="item" :title="item" />
        <BackTop ref="backTopRef1" />
      </view>

      <!-- 自定义位置 -->
      <view v-if="activeTab === 1">
        <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义位置</text>
        <view :style="{ marginBottom: '12px' }">
          <view
            :style="{ padding: '10px', backgroundColor: '#1989fa', borderRadius: '4px' }"
            @tap="simulateScroll(backTopRef2)"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">模拟滚动（显示按钮）</text>
          </view>
        </view>
        <Cell v-for="item in items" :key="item" :title="item" />
        <BackTop ref="backTopRef2" right="15" bottom="100" />
      </view>

      <!-- 自定义内容 -->
      <view v-if="activeTab === 2">
        <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义内容</text>
        <view :style="{ marginBottom: '12px' }">
          <view
            :style="{ padding: '10px', backgroundColor: '#1989fa', borderRadius: '4px' }"
            @tap="simulateScroll(backTopRef3)"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">模拟滚动（显示按钮）</text>
          </view>
        </view>
        <Cell v-for="item in items" :key="item" :title="item" />
        <BackTop ref="backTopRef3">
          <view :style="{
            width: '80px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1989fa',
            borderRadius: '20px',
          }">
            <text :style="{ color: '#fff', fontSize: '14px' }">返回顶部</text>
          </view>
        </BackTop>
      </view>

      <!-- 设置滚动目标 -->
      <view v-if="activeTab === 3">
        <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">设置滚动目标</text>
        <view :style="{ marginBottom: '12px' }">
          <view
            :style="{ padding: '10px', backgroundColor: '#1989fa', borderRadius: '4px' }"
            @tap="simulateScroll(backTopRef4)"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">模拟滚动（显示按钮）</text>
          </view>
        </view>
        <Cell v-for="item in items" :key="item" :title="item" />
        <BackTop ref="backTopRef4" target=".back-top-wrapper" bottom="100" />
      </view>

      <!-- 瞬间滚动 -->
      <view v-if="activeTab === 4">
        <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">瞬间滚动</text>
        <view :style="{ marginBottom: '12px' }">
          <view
            :style="{ padding: '10px', backgroundColor: '#1989fa', borderRadius: '4px' }"
            @tap="simulateScroll(backTopRef5)"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">模拟滚动（显示按钮）</text>
          </view>
        </view>
        <Cell v-for="item in items" :key="item" :title="item" />
        <BackTop ref="backTopRef5" immediate />
      </view>
    </view>
  </DemoPage>
</template>
