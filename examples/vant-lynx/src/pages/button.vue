<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Button from '../components/Button/index.vue';
</script>

<template>
  <DemoPage title="Button">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Button Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Button Type</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary" text="Primary" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="success" text="Success" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="default" text="Default" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="warning" text="Warning" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="danger" text="Danger" />
        </view>
      </view>

      <!-- Plain -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Plain</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" plain text="Primary" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" plain text="Success" />
        </view>
      </view>

      <!-- Hairline -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Hairline</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" plain hairline text="Hairline" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" plain hairline text="Hairline" />
        </view>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" disabled text="Disabled" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" disabled text="Disabled" />
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
        <view :style="{ marginRight: 8 }">
          <Button type="success" loading loading-type="spinner" />
        </view>
      </view>

      <!-- Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Icon</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" icon="plus" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" icon="plus" text="Button" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" icon="plus" text="Button" icon-position="right" />
        </view>
      </view>

      <!-- Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Shape</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" round text="Round" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" square text="Square" />
        </view>
      </view>

      <!-- Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Size</text>
      <view :style="{ display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" size="large" text="Large" />
        </view>
        <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 8 }">
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="normal" text="Normal" />
          </view>
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="small" text="Small" />
          </view>
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="mini" text="Mini" />
          </view>
        </view>
      </view>

      <!-- Block -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 8 }">Block</text>
      <view :style="{ marginBottom: 8 }">
        <Button type="primary" block text="Block Button" />
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 8 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button color="#7232dd" text="Custom" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button color="#7232dd" plain text="Custom" />
        </view>
      </view>
    </view>
  </DemoPage>
</template>
