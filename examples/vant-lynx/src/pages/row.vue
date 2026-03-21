<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Row from '../components/Row/index.vue';
import Col from '../components/Col/index.vue';
</script>

<template>
  <DemoPage title="Row">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24 }">
        <Row>
          <Col :span="24">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 24</text>
            </view>
          </Col>
        </Row>
        <view :style="{ height: 8 }" />
        <Row>
          <Col :span="12">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 12</text>
            </view>
          </Col>
          <Col :span="12">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 12</text>
            </view>
          </Col>
        </Row>
        <view :style="{ height: 8 }" />
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

      <!-- Gutter -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Gutter</text>
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

      <!-- Justify: Center -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Justify: Center</text>
      <view :style="{ marginBottom: 24 }">
        <Row justify="center">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Justify: End -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Justify: End</text>
      <view :style="{ marginBottom: 24 }">
        <Row justify="end">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Justify: Space Between -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Justify: Space Between</text>
      <view :style="{ marginBottom: 24 }">
        <Row justify="space-between">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Justify: Space Around -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Justify: Space Around</text>
      <view :style="{ marginBottom: 24 }">
        <Row justify="space-around">
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
          <Col :span="6">
            <view :style="{ backgroundColor: '#39a9ed', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">span: 6</text>
            </view>
          </Col>
        </Row>
      </view>

      <!-- Align -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Align: Center</text>
      <view :style="{ marginBottom: 24 }">
        <Row align="center">
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">Tall</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#66c6f2', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">Short</text>
            </view>
          </Col>
          <Col :span="8">
            <view :style="{ backgroundColor: '#39a9ed', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: 12 }">Taller</text>
            </view>
          </Col>
        </Row>
      </view>
    </view>
  </DemoPage>
</template>
