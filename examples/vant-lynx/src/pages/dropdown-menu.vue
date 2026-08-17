<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DropdownMenu from '../components/DropdownMenu/index.vue';
import DropdownItem from '../components/DropdownItem/index.vue';
import Cell from '../components/Cell/index.vue';
import Switch from '../components/Switch/index.vue';
import Button from '../components/Button/index.vue';
import type { DropdownItemOption } from '../components/DropdownItem/types';

const value1 = ref(0);
const value2 = ref('a');
const switch1 = ref(true);
const switch2 = ref(false);
const itemRef = ref();

const option1: DropdownItemOption[] = [
  { text: '全部商品', value: 0 },
  { text: '新款商品', value: 1 },
  { text: '活动商品', value: 2 },
];

const option2: DropdownItemOption[] = [
  { text: '默认排序', value: 'a' },
  { text: '好评排序', value: 'b' },
  { text: '销量排序', value: 'c' },
];

function onConfirm() {
  itemRef.value?.toggle();
}
</script>

<template>
  <DemoPage title="DropdownMenu 下拉菜单">
    <!-- 基础用法 -->
    <text :style="{ fontSize: '14px', color: '#969799', marginTop: '16px', marginBottom: '8px', paddingLeft: '16px' }">基础用法</text>
    <DropdownMenu>
      <DropdownItem v-model="value1" :options="option1" />
      <DropdownItem v-model="value2" :options="option2" />
    </DropdownMenu>

    <!-- 自定义菜单内容 -->
    <text :style="{ fontSize: '14px', color: '#969799', marginTop: '24px', marginBottom: '8px', paddingLeft: '16px' }">自定义菜单内容</text>
    <DropdownMenu>
      <DropdownItem v-model="value1" :options="option1" />
      <DropdownItem title="筛选" ref="itemRef">
        <Cell center title="包邮">
          <template #value>
            <Switch v-model="switch1" />
          </template>
        </Cell>
        <Cell center title="团购">
          <template #value>
            <Switch v-model="switch2" />
          </template>
        </Cell>
        <view :style="{ padding: '5px 16px' }">
          <Button
            type="primary"
            block
            round
            :style="{ height: '40px' }"
            @tap="onConfirm"
          >
            <text>确认</text>
          </Button>
        </view>
      </DropdownItem>
    </DropdownMenu>

    <!-- 自定义选中态颜色 -->
    <text :style="{ fontSize: '14px', color: '#969799', marginTop: '24px', marginBottom: '8px', paddingLeft: '16px' }">自定义选中态颜色</text>
    <DropdownMenu active-color="#ee0a24">
      <DropdownItem v-model="value1" :options="option1" />
      <DropdownItem v-model="value2" :options="option2" />
    </DropdownMenu>

    <!-- 横向滚动 -->
    <text :style="{ fontSize: '14px', color: '#969799', marginTop: '24px', marginBottom: '8px', paddingLeft: '16px' }">横向滚动</text>
    <DropdownMenu :swipe-threshold="4">
      <DropdownItem v-model="value1" :options="option1" />
      <DropdownItem v-model="value2" :options="option2" />
      <DropdownItem v-model="value2" :options="option2" />
      <DropdownItem v-model="value2" :options="option2" />
      <DropdownItem v-model="value2" :options="option2" />
    </DropdownMenu>

    <!-- 向上展开 -->
    <text :style="{ fontSize: '14px', color: '#969799', marginTop: '24px', marginBottom: '8px', paddingLeft: '16px' }">向上展开</text>
    <DropdownMenu direction="up">
      <DropdownItem v-model="value1" :options="option1" />
      <DropdownItem v-model="value2" :options="option2" />
    </DropdownMenu>

    <!-- 禁用菜单 -->
    <text :style="{ fontSize: '14px', color: '#969799', marginTop: '24px', marginBottom: '8px', paddingLeft: '16px' }">禁用菜单</text>
    <DropdownMenu>
      <DropdownItem v-model="value1" disabled :options="option1" />
      <DropdownItem v-model="value2" disabled :options="option2" />
    </DropdownMenu>
  </DemoPage>
</template>
