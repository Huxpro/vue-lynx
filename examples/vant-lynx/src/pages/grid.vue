<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Grid from '../components/Grid/index.vue';
import GridItem from '../components/GridItem/index.vue';
import VanImage from '../components/Image/index.vue';
</script>

<template>
  <DemoPage title="Grid 宫格">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid>
          <GridItem v-for="i in 4" :key="i" icon="photo-o" text="文字" />
        </Grid>
      </view>

      <!-- 自定义列数 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义列数</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid :column-num="3">
          <GridItem v-for="i in 6" :key="i" icon="photo-o" text="文字" />
        </Grid>
      </view>

      <!-- 自定义内容 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义内容</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid :border="false" :column-num="3">
          <GridItem>
            <VanImage fit="contain" src="https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg" :width="80" :height="80" />
          </GridItem>
          <GridItem>
            <VanImage fit="contain" src="https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg" :width="80" :height="80" />
          </GridItem>
          <GridItem>
            <VanImage fit="contain" src="https://fastly.jsdelivr.net/npm/@vant/assets/apple-3.jpeg" :width="80" :height="80" />
          </GridItem>
        </Grid>
      </view>

      <!-- 正方形格子 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">正方形格子</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid square>
          <GridItem v-for="i in 8" :key="i" icon="photo-o" text="文字" />
        </Grid>
      </view>

      <!-- 格子间距 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">格子间距</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid :gutter="10">
          <GridItem v-for="i in 8" :key="i" icon="photo-o" text="文字" />
        </Grid>
      </view>

      <!-- 内容横排 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">内容横排</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid direction="horizontal" :column-num="3">
          <GridItem icon="photo-o" text="文字" />
          <GridItem icon="photo-o" text="文字" />
          <GridItem icon="photo-o" text="文字" />
        </Grid>
      </view>

      <!-- 页面导航 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">页面导航</text>
      <view :style="{ marginBottom: '16px' }">
        <Grid clickable :column-num="2">
          <GridItem icon="home-o" text="路由跳转" to="/" />
          <GridItem icon="search" text="URL 跳转" url="https://github.com" />
        </Grid>
      </view>

      <!-- 徽标提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">徽标提示</text>
      <view>
        <Grid :column-num="2">
          <GridItem icon="home-o" text="文字" dot />
          <GridItem icon="search" text="文字" badge="99+" />
        </Grid>
      </view>
    </view>
  </DemoPage>
</template>
