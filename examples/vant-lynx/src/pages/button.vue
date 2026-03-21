<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Button</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Button Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Button Type</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary"><text :style="{ fontSize: 16, color: '#fff' }">Primary</text></Button>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="success"><text :style="{ fontSize: 16, color: '#fff' }">Success</text></Button>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="default"><text :style="{ fontSize: 16, color: '#323233' }">Default</text></Button>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="warning"><text :style="{ fontSize: 16, color: '#fff' }">Warning</text></Button>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="danger"><text :style="{ fontSize: 16, color: '#fff' }">Danger</text></Button>
        </view>
      </view>

      <!-- Plain -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Plain</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" plain><text :style="{ fontSize: 16, color: '#1989fa' }">Primary</text></Button>
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" plain><text :style="{ fontSize: 16, color: '#07c160' }">Success</text></Button>
        </view>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" disabled><text :style="{ fontSize: 16, color: '#fff' }">Disabled</text></Button>
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" disabled><text :style="{ fontSize: 16, color: '#fff' }">Disabled</text></Button>
        </view>
      </view>

      <!-- Loading -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" loading />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" loading loading-text="Loading..." />
        </view>
      </view>

      <!-- Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Shape</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" round><text :style="{ fontSize: 16, color: '#fff' }">Round</text></Button>
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" square><text :style="{ fontSize: 16, color: '#fff' }">Square</text></Button>
        </view>
      </view>

      <!-- Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Size</text>
      <view :style="{ display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" size="large"><text :style="{ fontSize: 16, color: '#fff' }">Large</text></Button>
        </view>
        <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 8 }">
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="normal"><text :style="{ fontSize: 16, color: '#fff' }">Normal</text></Button>
          </view>
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="small"><text :style="{ fontSize: 14, color: '#fff' }">Small</text></Button>
          </view>
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="mini"><text :style="{ fontSize: 12, color: '#fff' }">Mini</text></Button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
