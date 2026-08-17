<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Row from '../components/Row/index.vue';
import Col from '../components/Col/index.vue';
</script>

<template>
  <DemoPage title="Col">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Span -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Span</text>
      <view :style="{ marginBottom: 24 }">
        <Row>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Different Spans -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Different Spans</text>
      <view :style="{ marginBottom: 24 }">
        <Row>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="18">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 18</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- With Offset -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Offset</text>
      <view :style="{ marginBottom: 24 }">
        <Row>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
          <Col :span="8" :offset="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">offset: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- With Gutter -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Gutter (20px)</text>
      <view :style="{ marginBottom: 24 }">
        <Row :gutter="20">
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 8</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Full Width -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Full Width</text>
      <view :style="{ marginBottom: 24 }">
        <Row>
          <Col :span="24">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 24</text>
            </view>
          </Col>
        </Row>
      </view>
    </view>
  </DemoPage>
</template>
