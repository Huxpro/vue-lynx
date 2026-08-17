<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import ContactCard from '../components/ContactCard/index.vue';
</script>

<template>
  <DemoPage title="ContactCard 联系人卡片">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 添加联系人 -->
      <text class="demo-section-title">添加联系人</text>
      <ContactCard type="add" />

      <!-- 编辑联系人 -->
      <text class="demo-section-title" :style="{ marginTop: '16px' }">编辑联系人</text>
      <ContactCard
        type="edit"
        name="张三"
        tel="13000000000"
      />

      <!-- 不可编辑 -->
      <text class="demo-section-title" :style="{ marginTop: '16px' }">不可编辑</text>
      <ContactCard
        type="edit"
        name="张三"
        tel="13000000000"
        :editable="false"
      />
    </view>
  </DemoPage>
</template>
