<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Checkbox from '../components/Checkbox/index.vue';
import CheckboxGroup from '../components/CheckboxGroup/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';

const basicChecked = ref(true);
const disabledUnchecked = ref(false);
const disabledChecked = ref(true);
const shapeValue = ref(['a']);
const customColorValue = ref(['a']);
const customSizeValue = ref(true);
const customIconChecked = ref(true);
const labelLeftValue = ref(['a']);
const labelDisabledValue = ref(['a']);
const groupValue = ref(['a', 'b']);
const horizontalGroupValue = ref(['a']);
const maxGroupValue = ref(['a']);
const toggleAllValue = ref<string[]>([]);
const cellGroupValue = ref<string[]>([]);
const checkAllChecked = ref(false);
const indeterminate = ref(true);

const checkboxGroupRef = ref<InstanceType<typeof CheckboxGroup>>();

function onToggleAll() {
  checkboxGroupRef.value?.toggleAll(true);
}

function onToggleNone() {
  checkboxGroupRef.value?.toggleAll(false);
}

function onToggleInvert() {
  checkboxGroupRef.value?.toggleAll();
}

function onCheckAllChange(val: boolean) {
  checkAllChecked.value = val;
  indeterminate.value = false;
  cellGroupValue.value = val ? ['a', 'b', 'c'] : [];
}

function onCellGroupChange(val: unknown[]) {
  const total = 3;
  const count = val.length;
  checkAllChecked.value = count === total;
  indeterminate.value = count > 0 && count < total;
}
</script>

<template>
  <DemoPage title="Checkbox">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Checkbox v-model="basicChecked">
          <text>复选框</text>
        </Checkbox>
      </view>

      <!-- 禁用状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用状态</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Checkbox v-model="disabledUnchecked" disabled>
          <text>复选框</text>
        </Checkbox>
        <view :style="{ marginTop: '12px' }">
          <Checkbox v-model="disabledChecked" disabled>
            <text>复选框</text>
          </Checkbox>
        </view>
      </view>

      <!-- 自定义形状 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义形状</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="shapeValue" shape="square">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b">
              <text>复选框 b</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>

      <!-- 自定义颜色 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义颜色</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="customColorValue" checked-color="#ee0a24">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b">
              <text>复选框 b</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>

      <!-- 自定义大小 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义大小</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Checkbox v-model="customSizeValue" icon-size="24px">
          <text>复选框</text>
        </Checkbox>
      </view>

      <!-- 自定义图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义图标</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Checkbox v-model="customIconChecked">
          <text>自定义图标</text>
          <template #icon="{ checked }">
            <image
              :src="checked ? 'https://fastly.jsdelivr.net/npm/@vant/assets/user-active.png' : 'https://fastly.jsdelivr.net/npm/@vant/assets/user-inactive.png'"
              :style="{ width: '20px', height: '20px' }"
            />
          </template>
        </Checkbox>
      </view>

      <!-- 左侧文本 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">左侧文本</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="labelLeftValue">
          <Checkbox name="a" label-position="left">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b" label-position="left">
              <text>复选框 b</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>

      <!-- 禁用文本点击 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用文本点击</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="labelDisabledValue">
          <Checkbox name="a" label-disabled>
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b" label-disabled>
              <text>复选框 b</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>

      <!-- 复选框组 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">复选框组</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="groupValue">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b">
              <text>复选框 b</text>
            </Checkbox>
          </view>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="c">
              <text>复选框 c</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>

      <!-- 水平排列 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">水平排列</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="horizontalGroupValue" direction="horizontal">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <Checkbox name="b">
            <text>复选框 b</text>
          </Checkbox>
          <Checkbox name="c">
            <text>复选框 c</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- 限制最大可选数 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">限制最大可选数</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup v-model="maxGroupValue" :max="2">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b">
              <text>复选框 b</text>
            </Checkbox>
          </view>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="c">
              <text>复选框 c</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>

      <!-- 全选与反选 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">全选与反选</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <CheckboxGroup ref="checkboxGroupRef" v-model="toggleAllValue">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="b">
              <text>复选框 b</text>
            </Checkbox>
          </view>
          <view :style="{ marginTop: '12px' }">
            <Checkbox name="c">
              <text>复选框 c</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
        <view :style="{ display: 'flex', flexDirection: 'row', marginTop: '16px', gap: '12px' }">
          <view
            :style="{ backgroundColor: '#1989fa', borderRadius: '4px', padding: '8px 16px' }"
            @tap="onToggleAll"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">全选</text>
          </view>
          <view
            :style="{ backgroundColor: '#1989fa', borderRadius: '4px', padding: '8px 16px' }"
            @tap="onToggleNone"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">取消</text>
          </view>
          <view
            :style="{ backgroundColor: '#1989fa', borderRadius: '4px', padding: '8px 16px' }"
            @tap="onToggleInvert"
          >
            <text :style="{ color: '#fff', fontSize: '14px' }">反选</text>
          </view>
        </view>
      </view>

      <!-- 搭配单元格组件使用 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">搭配单元格组件使用</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <CheckboxGroup v-model="cellGroupValue" @change="onCellGroupChange">
          <CellGroup>
            <Cell title="复选框 a" clickable @tap="cellGroupValue.includes('a') ? (cellGroupValue = cellGroupValue.filter(v => v !== 'a')) : (cellGroupValue = [...cellGroupValue, 'a'])">
              <template #right-icon>
                <Checkbox name="a" @click.stop />
              </template>
            </Cell>
            <Cell title="复选框 b" clickable @tap="cellGroupValue.includes('b') ? (cellGroupValue = cellGroupValue.filter(v => v !== 'b')) : (cellGroupValue = [...cellGroupValue, 'b'])">
              <template #right-icon>
                <Checkbox name="b" @click.stop />
              </template>
            </Cell>
            <Cell title="复选框 c" clickable @tap="cellGroupValue.includes('c') ? (cellGroupValue = cellGroupValue.filter(v => v !== 'c')) : (cellGroupValue = [...cellGroupValue, 'c'])">
              <template #right-icon>
                <Checkbox name="c" @click.stop />
              </template>
            </Cell>
          </CellGroup>
        </CheckboxGroup>
      </view>

      <!-- 不确定状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">不确定状态</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Checkbox
          :model-value="checkAllChecked"
          :indeterminate="indeterminate"
          @change="onCheckAllChange"
        >
          <text>全选</text>
        </Checkbox>
        <CheckboxGroup v-model="cellGroupValue" :style="{ marginTop: '12px' }" @change="onCellGroupChange">
          <Checkbox name="a">
            <text>复选框 a</text>
          </Checkbox>
          <view :style="{ marginTop: '8px' }">
            <Checkbox name="b">
              <text>复选框 b</text>
            </Checkbox>
          </view>
          <view :style="{ marginTop: '8px' }">
            <Checkbox name="c">
              <text>复选框 c</text>
            </Checkbox>
          </view>
        </CheckboxGroup>
      </view>
    </view>
  </DemoPage>
</template>
