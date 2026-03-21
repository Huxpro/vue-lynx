<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Tag from '../components/Tag/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

const showTag = ref(true);
function onClose() { showTag.value = false; }
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Tag</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Type</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Tag type="primary"><text :style="{ fontSize: 10, color: '#fff' }">Primary</text></Tag>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Tag type="success"><text :style="{ fontSize: 10, color: '#fff' }">Success</text></Tag>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Tag type="danger"><text :style="{ fontSize: 10, color: '#fff' }">Danger</text></Tag>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Tag type="warning"><text :style="{ fontSize: 10, color: '#fff' }">Warning</text></Tag>
        </view>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Plain</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Tag type="primary" plain><text :style="{ fontSize: 10, color: '#1989fa' }">Primary</text></Tag>
        </view>
        <view :style="{ marginRight: 8 }">
          <Tag type="success" plain><text :style="{ fontSize: 10, color: '#07c160' }">Success</text></Tag>
        </view>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round & Mark</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Tag type="primary" round><text :style="{ fontSize: 10, color: '#fff' }">Round</text></Tag>
        </view>
        <view :style="{ marginRight: 8 }">
          <Tag type="primary" mark><text :style="{ fontSize: 10, color: '#fff' }">Mark</text></Tag>
        </view>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Closeable</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <Tag v-if="showTag" type="primary" closeable @close="onClose">
          <text :style="{ fontSize: 10, color: '#fff' }">Closeable</text>
        </Tag>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Size</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }">
        <view :style="{ marginRight: 8 }">
          <Tag type="primary" size="small"><text :style="{ fontSize: 10, color: '#fff' }">Small</text></Tag>
        </view>
        <view :style="{ marginRight: 8 }">
          <Tag type="primary" size="medium"><text :style="{ fontSize: 12, color: '#fff' }">Medium</text></Tag>
        </view>
        <view :style="{ marginRight: 8 }">
          <Tag type="primary" size="large"><text :style="{ fontSize: 14, color: '#fff' }">Large</text></Tag>
        </view>
      </view>
    </view>
  </view>
</template>
