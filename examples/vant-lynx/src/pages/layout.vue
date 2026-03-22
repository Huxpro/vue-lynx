<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Row from '../components/Row/index.vue';
import Col from '../components/Col/index.vue';

const lightBlue = '#39a9ed';
const darkBlue = '#66c6f2';
</script>

<template>
  <DemoPage title="Layout 布局">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px' }">
        <Row>
          <Col :span="8">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
        </Row>
        <Row :style="{ marginTop: '10px' }">
          <Col :span="4">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 4</text>
            </view>
          </Col>
          <Col :span="10" :offset="4">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">offset: 4, span: 10</text>
            </view>
          </Col>
        </Row>
        <Row :style="{ marginTop: '10px' }">
          <Col :span="12" :offset="12">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">offset: 12, span: 12</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 设置列元素间距 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">设置列元素间距</text>
      <view :style="{ marginBottom: '16px' }">
        <Row :gutter="20">
          <Col :span="8">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 设置垂直间距 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">设置垂直间距</text>
      <view :style="{ marginBottom: '16px' }">
        <Row :gutter="[20, 20]">
          <Col :span="12">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 12</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 对齐方式 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">对齐方式</text>
      <view :style="{ marginBottom: '8px' }">
        <text :style="{ fontSize: '12px', color: '#969799', marginBottom: '4px' }">center</text>
        <Row justify="center">
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
      <view :style="{ marginBottom: '8px' }">
        <text :style="{ fontSize: '12px', color: '#969799', marginBottom: '4px' }">end</text>
        <Row justify="end">
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
      <view :style="{ marginBottom: '8px' }">
        <text :style="{ fontSize: '12px', color: '#969799', marginBottom: '4px' }">space-between</text>
        <Row justify="space-between">
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
      <view>
        <text :style="{ fontSize: '12px', color: '#969799', marginBottom: '4px' }">space-around</text>
        <Row justify="space-around">
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: darkBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: lightBlue, borderRadius: '4px', height: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex' }">
              <text :style="{ fontSize: '13px', color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
    </view>
  </DemoPage>
</template>
