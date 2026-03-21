<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Row from '../components/Row/index.vue';
import Col from '../components/Col/index.vue';
</script>

<template>
  <DemoPage title="Layout">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Row>
          <Col :span="24">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 24</text>
            </view>
          </Col>
        </Row>
        <view :style="{ height: 8 }" />
        <Row>
          <Col :span="12">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view :style="{ backgroundColor: '#66b8f0', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 12</text>
            </view>
          </Col>
        </Row>
        <view :style="{ height: 8 }" />
        <Row>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#66b8f0', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Gutter -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Column Spacing (Gutter)</text>
      <view :style="{ marginBottom: 16 }">
        <Row :gutter="20">
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Offset -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Column Offset</text>
      <view :style="{ marginBottom: 16 }">
        <Row>
          <Col :span="12" :offset="12">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">offset: 12, span: 12</text>
            </view>
          </Col>
        </Row>
        <view :style="{ height: 8 }" />
        <Row>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6" :offset="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">offset: 6</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Justify Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Flex Justify</text>
      <view :style="{ marginBottom: 8 }">
        <text :style="{ fontSize: 12, color: '#969799', marginBottom: 4 }">center</text>
        <Row justify="center">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66b8f0', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
      <view :style="{ marginBottom: 8 }">
        <text :style="{ fontSize: 12, color: '#969799', marginBottom: 4 }">space-between</text>
        <Row justify="space-between">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66b8f0', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
      <view>
        <text :style="{ fontSize: 12, color: '#969799', marginBottom: 4 }">space-around</text>
        <Row justify="space-around">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66b8f0', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', borderRadius: 4, padding: 10 }">
              <text :style="{ fontSize: 14, color: '#fff', textAlign: 'center' }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>
    </view>
  </DemoPage>
</template>
