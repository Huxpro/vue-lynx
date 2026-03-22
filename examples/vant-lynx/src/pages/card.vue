<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Card from '../components/Card/index.vue';
import Tag from '../components/Tag/index.vue';
import Button from '../components/Button/index.vue';
</script>

<template>
  <DemoPage title="Card">
    <view :style="{ display: 'flex', flexDirection: 'column', padding: '16px' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">Basic Usage</text>
      <view :style="{ marginBottom: '16px' }">
        <Card
          num="2"
          price="2.00"
          desc="Description"
          title="Product Name"
          thumb="https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg"
        />
      </view>

      <!-- Discount Info -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">Discount Info</text>
      <view :style="{ marginBottom: '16px' }">
        <Card
          num="2"
          price="2.00"
          origin-price="10.00"
          tag="Tag"
          desc="Description"
          title="Product Name"
          thumb="https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg"
        />
      </view>

      <!-- Custom Content -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">Custom Content</text>
      <view :style="{ marginBottom: '16px' }">
        <Card
          num="2"
          price="2.00"
          desc="Description"
          title="Product Name"
          thumb="https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg"
        >
          <template #tags>
            <Tag plain type="primary" :style="{ marginRight: '5px' }">Tag</Tag>
            <Tag plain type="primary">Tag</Tag>
          </template>

          <template #footer>
            <Button round size="mini">Button</Button>
            <Button round size="mini">Button</Button>
          </template>
        </Card>
      </view>
    </view>
  </DemoPage>
</template>
