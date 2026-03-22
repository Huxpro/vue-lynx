<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Row from '../components/Row/index.vue';
import Col from '../components/Col/index.vue';
</script>

<template>
  <DemoPage title="Layout 布局">
    <view class="demo-layout-page">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <view class="demo-layout-section">
        <Row>
          <Col :span="8">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
        </Row>
        <Row>
          <Col :span="4">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 4</text>
            </view>
          </Col>
          <Col :span="10" :offset="4">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">offset: 4, span: 10</text>
            </view>
          </Col>
        </Row>
        <Row>
          <Col :span="12" :offset="12">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">offset: 12, span: 12</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 列间距 -->
      <text class="demo-section-title">列间距</text>
      <view class="demo-layout-section">
        <Row :gutter="20">
          <Col :span="8">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 行间距 -->
      <text class="demo-section-title">行间距</text>
      <view class="demo-layout-section">
        <Row :gutter="[20, 20]">
          <Col :span="12">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 12</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 列偏移 -->
      <text class="demo-section-title">列偏移</text>
      <view class="demo-layout-section">
        <Row>
          <Col :span="8">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 8</text>
            </view>
          </Col>
          <Col :span="8" :offset="8">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">offset: 8</text>
            </view>
          </Col>
        </Row>
        <Row>
          <Col :span="6" :offset="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">offset: 6</text>
            </view>
          </Col>
          <Col :span="6" :offset="6">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">offset: 6</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- 对齐方式 -->
      <text class="demo-section-title">对齐方式</text>
      <view class="demo-layout-section">
        <text class="demo-subtitle">center</text>
        <Row justify="center">
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
        </Row>
        <text class="demo-subtitle">end</text>
        <Row justify="end">
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
        </Row>
        <text class="demo-subtitle">space-between</text>
        <Row justify="space-between">
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
        </Row>
        <text class="demo-subtitle">space-around</text>
        <Row justify="space-around">
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--dark">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view class="demo-col demo-col--light">
              <text class="demo-col-text">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-layout-page {
  padding: 16px;
}
.demo-section-title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}
.demo-layout-section {
  margin-bottom: 16px;
}
.demo-subtitle {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}
.demo-col {
  border-radius: 4px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.demo-col--light {
  background-color: #39a9ed;
}
.demo-col--dark {
  background-color: #66c6f2;
}
.demo-col-text {
  font-size: 13px;
  color: #fff;
  text-align: center;
}
</style>
