<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import PasswordInput from '../components/PasswordInput/index.vue';
import NumberKeyboard from '../components/NumberKeyboard/index.vue';

const current = ref<'basic' | 'custom' | 'gutter' | 'mask' | 'info'>('basic');

const valueBasic = ref('123');
const valueCustom = ref('12');
const valueGutter = ref('12');
const valueMask = ref('123');
const valueInfo = ref('123');

const focusedBasic = ref(true);
const focusedCustom = ref(false);
const focusedGutter = ref(false);
const focusedMask = ref(false);
const focusedInfo = ref(false);

const errorInfo = ref('');

function setFocus(section: typeof current.value) {
  focusedBasic.value = false;
  focusedCustom.value = false;
  focusedGutter.value = false;
  focusedMask.value = false;
  focusedInfo.value = false;
  current.value = section;
  if (section === 'basic') focusedBasic.value = true;
  else if (section === 'custom') focusedCustom.value = true;
  else if (section === 'gutter') focusedGutter.value = true;
  else if (section === 'mask') focusedMask.value = true;
  else if (section === 'info') focusedInfo.value = true;
}

function getCurrentValue() {
  if (current.value === 'basic') return valueBasic;
  if (current.value === 'custom') return valueCustom;
  if (current.value === 'gutter') return valueGutter;
  if (current.value === 'mask') return valueMask;
  return valueInfo;
}

function getMaxLength() {
  if (current.value === 'custom' || current.value === 'gutter') return 4;
  return 6;
}

function onInput(key: string) {
  const val = getCurrentValue();
  if (val.value.length < getMaxLength()) {
    val.value += key;
  }
  if (current.value === 'info' && val.value.length === 6 && val.value !== '123456') {
    errorInfo.value = 'Password Mistake';
  }
}

function onDelete() {
  const val = getCurrentValue();
  val.value = val.value.slice(0, -1);
  if (current.value === 'info') {
    errorInfo.value = '';
  }
}
</script>

<template>
  <DemoPage title="PasswordInput 密码输入框">
    <!-- 基础用法 -->
    <view class="van-doc-demo-block">
      <text class="van-doc-demo-block__title">基础用法</text>
      <PasswordInput
        :value="valueBasic"
        :focused="focusedBasic"
        @focus="setFocus('basic')"
      />
    </view>

    <!-- 自定义长度 -->
    <view class="van-doc-demo-block">
      <text class="van-doc-demo-block__title">自定义长度</text>
      <PasswordInput
        :value="valueCustom"
        :length="4"
        :focused="focusedCustom"
        @focus="setFocus('custom')"
      />
    </view>

    <!-- 格子间距 -->
    <view class="van-doc-demo-block">
      <text class="van-doc-demo-block__title">格子间距</text>
      <PasswordInput
        :value="valueGutter"
        :length="4"
        :gutter="10"
        :focused="focusedGutter"
        @focus="setFocus('gutter')"
      />
    </view>

    <!-- 明文展示 -->
    <view class="van-doc-demo-block">
      <text class="van-doc-demo-block__title">明文展示</text>
      <PasswordInput
        :value="valueMask"
        :mask="false"
        :focused="focusedMask"
        @focus="setFocus('mask')"
      />
    </view>

    <!-- 提示信息 -->
    <view class="van-doc-demo-block">
      <text class="van-doc-demo-block__title">提示信息</text>
      <PasswordInput
        :value="valueInfo"
        info="密码为 6 位数字"
        :error-info="errorInfo"
        :focused="focusedInfo"
        @focus="setFocus('info')"
      />
    </view>

    <!-- Number Keyboard -->
    <NumberKeyboard
      :show="focusedBasic || focusedCustom || focusedGutter || focusedMask || focusedInfo"
      @input="onInput"
      @delete="onDelete"
      @close="() => { focusedBasic = false; focusedCustom = false; focusedGutter = false; focusedMask = false; focusedInfo = false; }"
    />
  </DemoPage>
</template>
