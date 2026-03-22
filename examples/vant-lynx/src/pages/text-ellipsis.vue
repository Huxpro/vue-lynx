<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import TextEllipsis from '../components/TextEllipsis/index.vue';

const text1 =
  'Take your time and be patient. Life itself will eventually answer all those questions it once raised for you.';
const text2 =
  "The fleeting time of one's life is everything that belongs to a person. Only this thing truly belongs to you. Everything else is just a momentary pleasure or misfortune, which will soon be gone with the passing of time.";
const text3 =
  "That day, I turned twenty-one. In the golden age of my life, I was full of dreams. I wanted to love, to eat, and to instantly transform into one of these clouds, part alight, part darkened. It was only later that I understood life is but a slow, drawn-out process of getting your balls crushed. Day by day, you get older. Day by day, your dreams fade. In the end you are no different from a crushed ox. But I hadn't foreseen any of it on my twenty-first birthday. I thought I would be vigorous forever, and that nothing could ever crush me.";
</script>

<template>
  <DemoPage title="TextEllipsis 文本省略">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <TextEllipsis :content="text1" />
      </view>

      <!-- 展开/收起 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">展开/收起</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <TextEllipsis
          :content="text2"
          expand-text="展开"
          collapse-text="收起"
        />
      </view>

      <!-- 自定义展示行数 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义展示行数</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <TextEllipsis
          rows="3"
          :content="text3"
          expand-text="展开"
          collapse-text="收起"
        />
      </view>

      <!-- 自定义省略位置 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义省略位置</text>

      <!-- 头部省略 -->
      <text :style="{ fontSize: '12px', color: '#969799', marginBottom: '8px', marginLeft: '4px' }">头部省略</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <TextEllipsis
          rows="1"
          :content="text3"
          expand-text="展开"
          collapse-text="收起"
          position="start"
        />
      </view>

      <!-- 中部省略 -->
      <text :style="{ fontSize: '12px', color: '#969799', marginBottom: '8px', marginLeft: '4px' }">中部省略</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <TextEllipsis
          rows="2"
          :content="text3"
          expand-text="展开"
          collapse-text="收起"
          position="middle"
        />
      </view>

      <!-- 自定义操作内容 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义操作内容</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px' }">
        <TextEllipsis :content="text1">
          <template #action="{ expanded }">
            {{ expanded ? '收起' : '展开' }}
          </template>
        </TextEllipsis>
      </view>
    </view>
  </DemoPage>
</template>
