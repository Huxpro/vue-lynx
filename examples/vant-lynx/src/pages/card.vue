<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Card from '../components/Card/index.vue';
import Tag from '../components/Tag/index.vue';
import Button from '../components/Button/index.vue';

const imageURL = 'https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg';
</script>

<template>
  <DemoPage title="Card 商品卡片">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <Card
        num="2"
        price="2.00"
        desc="描述信息"
        title="商品名称"
        :thumb="imageURL"
      />

      <!-- 营销信息 -->
      <text class="demo-section-title" :style="{ marginTop: '16px' }">营销信息</text>
      <Card
        num="2"
        price="2.00"
        origin-price="10.00"
        tag="标签"
        desc="描述信息"
        title="商品名称"
        :thumb="imageURL"
      />

      <!-- 自定义内容 -->
      <text class="demo-section-title" :style="{ marginTop: '16px' }">自定义内容</text>
      <Card
        num="2"
        price="2.00"
        desc="描述信息"
        title="商品名称"
        :thumb="imageURL"
      >
        <template #tags>
          <view :style="{ display: 'flex', flexDirection: 'row' }">
            <Tag plain type="primary" :style="{ marginRight: '5px' }">标签</Tag>
            <Tag plain type="primary">标签</Tag>
          </view>
        </template>

        <template #footer>
          <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }">
            <Button round size="mini">按钮</Button>
            <Button round size="mini" :style="{ marginLeft: '5px' }">按钮</Button>
          </view>
        </template>
      </Card>
    </view>
  </DemoPage>
</template>
