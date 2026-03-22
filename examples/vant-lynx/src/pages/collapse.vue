<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Collapse from '../components/Collapse/index.vue';
import CollapseItem from '../components/CollapseItem/index.vue';
import Icon from '../components/Icon/index.vue';

const active1 = ref([0]);
const active2 = ref(0);
const active3 = ref<number[]>([0]);
const active4 = ref<number[]>([]);
const active5 = ref(['1']);

const collapseRef = ref<InstanceType<typeof Collapse>>();
</script>

<template>
  <DemoPage title="Collapse 折叠面板">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">基础用法</text>
      <Collapse v-model="active1">
        <CollapseItem title="标题1" :name="0">
          <text :style="{ fontSize: '14px', color: '#969799' }">代码是写出来给人看的，附带能在机器上运行。</text>
        </CollapseItem>
        <CollapseItem title="标题2" :name="1">
          <text :style="{ fontSize: '14px', color: '#969799' }">技术无非就是那些开发它的人的共同灵魂。</text>
        </CollapseItem>
        <CollapseItem title="标题3" :name="2">
          <text :style="{ fontSize: '14px', color: '#969799' }">在代码阅读过程中人们说的最多的一句话是"我不会再犯这种错误了"。</text>
        </CollapseItem>
      </Collapse>

      <!-- 手风琴 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">手风琴</text>
      <Collapse v-model="active2" accordion>
        <CollapseItem title="标题1" :name="0">
          <text :style="{ fontSize: '14px', color: '#969799' }">代码是写出来给人看的，附带能在机器上运行。</text>
        </CollapseItem>
        <CollapseItem title="标题2" :name="1">
          <text :style="{ fontSize: '14px', color: '#969799' }">技术无非就是那些开发它的人的共同灵魂。</text>
        </CollapseItem>
        <CollapseItem title="标题3" :name="2">
          <text :style="{ fontSize: '14px', color: '#969799' }">在代码阅读过程中人们说的最多的一句话是"我不会再犯这种错误了"。</text>
        </CollapseItem>
      </Collapse>

      <!-- 禁用状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">禁用状态</text>
      <Collapse v-model="active3">
        <CollapseItem title="标题1" :name="0">
          <text :style="{ fontSize: '14px', color: '#969799' }">代码是写出来给人看的，附带能在机器上运行。</text>
        </CollapseItem>
        <CollapseItem title="标题2" :name="1" disabled>
          <text :style="{ fontSize: '14px', color: '#969799' }">技术无非就是那些开发它的人的共同灵魂。</text>
        </CollapseItem>
        <CollapseItem title="标题3" :name="2" disabled>
          <text :style="{ fontSize: '14px', color: '#969799' }">在代码阅读过程中人们说的最多的一句话是"我不会再犯这种错误了"。</text>
        </CollapseItem>
      </Collapse>

      <!-- 自定义标题内容 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">自定义标题内容</text>
      <Collapse v-model="active4">
        <CollapseItem :name="0">
          <template #title>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">标题1</text>
              <Icon name="question" size="16" color="#1989fa" />
            </view>
          </template>
          <text :style="{ fontSize: '14px', color: '#969799' }">代码是写出来给人看的，附带能在机器上运行。</text>
        </CollapseItem>
        <CollapseItem title="标题2" icon="location" value="内容" :name="1">
          <text :style="{ fontSize: '14px', color: '#969799' }">技术无非就是那些开发它的人的共同灵魂。</text>
        </CollapseItem>
      </Collapse>

      <!-- 全部展开与全部切换 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">全部展开与全部切换</text>
      <view :style="{ display: 'flex', flexDirection: 'row', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px', gap: '8px' }">
        <text
          :style="{ fontSize: '14px', color: '#1989fa', paddingTop: '6px', paddingBottom: '6px', paddingLeft: '12px', paddingRight: '12px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#1989fa', borderRadius: '4px' }"
          @tap="collapseRef?.toggleAll?.(true)"
        >全部展开</text>
        <text
          :style="{ fontSize: '14px', color: '#1989fa', paddingTop: '6px', paddingBottom: '6px', paddingLeft: '12px', paddingRight: '12px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#1989fa', borderRadius: '4px' }"
          @tap="collapseRef?.toggleAll?.(false)"
        >全部收起</text>
        <text
          :style="{ fontSize: '14px', color: '#1989fa', paddingTop: '6px', paddingBottom: '6px', paddingLeft: '12px', paddingRight: '12px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#1989fa', borderRadius: '4px' }"
          @tap="collapseRef?.toggleAll?.()"
        >全部切换</text>
      </view>
      <Collapse ref="collapseRef" v-model="active5">
        <CollapseItem title="标题1" name="1">
          <text :style="{ fontSize: '14px', color: '#969799' }">代码是写出来给人看的，附带能在机器上运行。</text>
        </CollapseItem>
        <CollapseItem title="标题2" name="2">
          <text :style="{ fontSize: '14px', color: '#969799' }">技术无非就是那些开发它的人的共同灵魂。</text>
        </CollapseItem>
        <CollapseItem title="标题3" name="3">
          <text :style="{ fontSize: '14px', color: '#969799' }">在代码阅读过程中人们说的最多的一句话是"我不会再犯这种错误了"。</text>
        </CollapseItem>
      </Collapse>
    </view>
  </DemoPage>
</template>
