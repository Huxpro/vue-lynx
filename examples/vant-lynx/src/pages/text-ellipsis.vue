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
  <DemoPage title="TextEllipsis">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Basic Usage</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <TextEllipsis :content="text1" />
      </view>

      <!-- Expand & Collapse -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Expand & Collapse</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <TextEllipsis
          :content="text2"
          expand-text="expand"
          collapse-text="collapse"
        />
      </view>

      <!-- Custom Rows -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Custom Rows</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <TextEllipsis
          rows="3"
          :content="text3"
          expand-text="expand"
          collapse-text="collapse"
        />
      </view>

      <!-- Custom Collapse Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Custom Collapse Position</text>

      <!-- Head Area Collapse -->
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 8, marginLeft: 4 }">Head Area Collapse Position</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <TextEllipsis
          rows="1"
          :content="text3"
          expand-text="expand"
          collapse-text="collapse"
          position="start"
        />
      </view>

      <!-- Middle Area Collapse -->
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 8, marginLeft: 4 }">Middle Area Collapse Position</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <TextEllipsis
          rows="2"
          :content="text3"
          expand-text="expand"
          collapse-text="collapse"
          position="middle"
        />
      </view>

      <!-- Custom Action -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Custom Action</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <TextEllipsis :content="text1">
          <template #action="{ expanded }">
            {{ expanded ? 'collapse' : 'expand' }}
          </template>
        </TextEllipsis>
      </view>
    </view>
  </DemoPage>
</template>
