<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Field from '../components/Field/index.vue';
import Button from '../components/Button/index.vue';

// Basic Usage
const basicValue = ref('');

// Custom Type
const textValue = ref('');
const phoneValue = ref('');
const digitValue = ref('');
const numberValue = ref('');
const passwordValue = ref('');

// Disabled
const readonlyValue = ref('Input Readonly');
const disabledValue = ref('Input Disabled');

// Show Icon
const iconValue1 = ref('');
const iconValue2 = ref('');

// Required
const requiredValue = ref('');

// Error Info
const errorValue = ref('');
const errorMsgValue = ref('');

// Insert Button
const smsValue = ref('');

// Format Value
const formatValue1 = ref('');
const formatValue2 = ref('');

// Autosize
const autosizeValue = ref('');
const autosizeValue2 = ref('');

// Show Word Limit
const wordLimitValue = ref('');

// Input Align
const alignValue = ref('');

// Label Align
const labelAlignValue1 = ref('');
const labelAlignValue2 = ref('');
const labelAlignValue3 = ref('');

function formatOnlyLetters(value: string) {
  return value.replace(/[^a-zA-Z]/g, '');
}
</script>

<template>
  <DemoPage title="Field 输入框">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">基础用法</text>
      <CellGroup>
        <Field v-model="basicValue" label="文本" placeholder="请输入文本" :border="false" />
      </CellGroup>

      <!-- 自定义类型 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">自定义类型</text>
      <CellGroup>
        <Field v-model="textValue" label="文本" placeholder="请输入文本" />
        <Field v-model="phoneValue" label="手机号" type="tel" placeholder="请输入手机号" />
        <Field v-model="digitValue" label="整数" type="digit" placeholder="请输入整数" />
        <Field v-model="numberValue" label="数字" type="number" placeholder="请输入数字（支持小数）" />
        <Field v-model="passwordValue" label="密码" type="password" placeholder="请输入密码" :border="false" />
      </CellGroup>

      <!-- 禁用输入框 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">禁用输入框</text>
      <CellGroup>
        <Field v-model="readonlyValue" label="文本" :readonly="true" />
        <Field v-model="disabledValue" label="文本" :disabled="true" :border="false" />
      </CellGroup>

      <!-- 显示图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">显示图标</text>
      <CellGroup>
        <Field v-model="iconValue1" label="文本" left-icon="smile-o" right-icon="warning-o" placeholder="显示图标" />
        <Field v-model="iconValue2" label="文本" clearable left-icon="shop-o" placeholder="显示清除图标" :border="false" />
      </CellGroup>

      <!-- 必填星号 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">必填星号</text>
      <CellGroup>
        <Field v-model="requiredValue" label="文本" :required="true" placeholder="请输入文本" :border="false" />
      </CellGroup>

      <!-- 错误提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">错误提示</text>
      <CellGroup>
        <Field v-model="errorValue" label="用户名" :error="true" placeholder="请输入用户名" />
        <Field v-model="errorMsgValue" label="手机号" placeholder="请输入手机号" error-message="手机号格式错误" :border="false" />
      </CellGroup>

      <!-- 插入按钮 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">插入按钮</text>
      <CellGroup>
        <Field v-model="smsValue" label="短信验证码" center clearable placeholder="请输入短信验证码" :border="false">
          <template #button>
            <Button size="small" type="primary">
              <text :style="{ color: '#fff', fontSize: '12px' }">发送验证码</text>
            </Button>
          </template>
        </Field>
      </CellGroup>

      <!-- 格式化输入内容 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">格式化输入内容</text>
      <CellGroup>
        <Field v-model="formatValue1" label="文本" :formatter="formatOnlyLetters" placeholder="在输入时执行格式化" />
        <Field v-model="formatValue2" label="文本" :formatter="formatOnlyLetters" format-trigger="onBlur" placeholder="在失焦时执行格式化" :border="false" />
      </CellGroup>

      <!-- 高度自适应 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">高度自适应</text>
      <CellGroup>
        <Field v-model="autosizeValue" label="留言" type="textarea" placeholder="请输入留言" :autosize="true" :rows="1" />
        <Field v-model="autosizeValue2" label="留言" type="textarea" placeholder="请输入留言" :autosize="{ maxHeight: 150, minHeight: 50 }" :border="false" />
      </CellGroup>

      <!-- 显示字数统计 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">显示字数统计</text>
      <CellGroup>
        <Field v-model="wordLimitValue" label="留言" type="textarea" placeholder="请输入留言" :maxlength="50" show-word-limit :rows="2" :border="false" />
      </CellGroup>

      <!-- 输入框内容对齐 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">输入框内容对齐</text>
      <CellGroup>
        <Field v-model="alignValue" label="文本" placeholder="输入框内容右对齐" input-align="right" :border="false" />
      </CellGroup>

      <!-- 输入框文本位置 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">输入框文本位置</text>
      <CellGroup>
        <Field v-model="labelAlignValue1" label="文本" placeholder="顶部对齐" label-align="top" />
        <Field v-model="labelAlignValue2" label="文本" placeholder="左对齐" label-align="left" />
        <Field v-model="labelAlignValue3" label="文本" placeholder="右对齐" label-align="right" :border="false" />
      </CellGroup>
    </view>
  </DemoPage>
</template>
