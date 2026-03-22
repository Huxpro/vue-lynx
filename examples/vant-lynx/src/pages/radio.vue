<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Radio from '../components/Radio/index.vue';
import RadioGroup from '../components/RadioGroup/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';

const radio1 = ref('1');
const radio2 = ref('2');
const radioHorizontal = ref('1');
const radioSquare = ref('1');
const radioDot = ref('1');
const radio3 = ref('1');
const radioIconSize = ref('1');
const radio4 = ref('1');
const radioLeftLabel = ref('1');
const radioLabel = ref('1');
const radio5 = ref('1');
</script>

<template>
  <DemoPage title="Radio 单选框">
    <view :style="{ padding: '16px' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radio1">
          <Radio name="1">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 水平排列 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">水平排列</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radioHorizontal" direction="horizontal">
          <Radio name="1">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 禁用状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用状态</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radio2" disabled>
          <Radio name="1">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 自定义形状 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义形状</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radioSquare" shape="square">
          <Radio name="1">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
        <view :style="{ height: '20px' }" />
        <RadioGroup v-model="radioDot" shape="dot">
          <Radio name="1">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 自定义颜色 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义颜色</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radio3">
          <Radio name="1" checked-color="#ee0a24">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2" checked-color="#ee0a24">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 自定义大小 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义大小</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radioIconSize">
          <Radio name="1" icon-size="24px">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2" icon-size="24px">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 自定义图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义图标</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radio4">
          <Radio name="1">
            <template #icon="{ checked }">
              <text :style="{ fontSize: '20px', color: checked ? '#1989fa' : '#c8c9cc' }">{{ checked ? '◉' : '○' }}</text>
            </template>
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2">
            <template #icon="{ checked }">
              <text :style="{ fontSize: '20px', color: checked ? '#1989fa' : '#c8c9cc' }">{{ checked ? '◉' : '○' }}</text>
            </template>
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 左侧文本 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">左侧文本</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radioLeftLabel">
          <Radio name="1" label-position="left">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2" label-position="left">
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 禁用文本点击 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用文本点击</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <RadioGroup v-model="radioLabel">
          <Radio name="1" label-disabled>
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 1</text>
          </Radio>
          <view :style="{ height: '8px' }" />
          <Radio name="2" label-disabled>
            <text :style="{ fontSize: '14px', color: '#323233' }">单选框 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- 搭配单元格组件使用 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">搭配单元格组件使用</text>
      <view :style="{ marginBottom: '16px' }">
        <RadioGroup v-model="radio5">
          <CellGroup inset>
            <Cell clickable title="单选框 1" @click="radio5 = '1'">
              <template #right-icon>
                <Radio name="1" />
              </template>
            </Cell>
            <Cell clickable title="单选框 2" @click="radio5 = '2'">
              <template #right-icon>
                <Radio name="2" />
              </template>
            </Cell>
          </CellGroup>
        </RadioGroup>
      </view>
    </view>
  </DemoPage>
</template>
