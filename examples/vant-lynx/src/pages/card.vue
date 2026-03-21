<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Card from '../components/Card/index.vue';
const clickResult = ref('');

function onCardClick() {
  clickResult.value = 'Card clicked!';
}

function onThumbClick() {
  clickResult.value = 'Thumb clicked!';
}
</script>

<template>
  <DemoPage title="Card">
    <view :style="{ display: 'flex', flexDirection: 'column', padding: 12 }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Card
          title="Product Name"
          desc="Description of the product"
          price="2.00"
          num="2"
        />
      </view>

      <!-- With Origin Price -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Discount Info</text>
      <view :style="{ marginBottom: 16 }">
        <Card
          title="Product Name"
          desc="Description of the product"
          price="2.00"
          origin-price="10.00"
          num="1"
          tag="Sale"
        />
      </view>

      <!-- Custom Currency -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Currency</text>
      <view :style="{ marginBottom: 16 }">
        <Card
          title="International Product"
          desc="Ships worldwide"
          price="29.99"
          currency="$"
          num="1"
        />
      </view>

      <!-- Click Events -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Click Events</text>
      <view :style="{ marginBottom: 16 }">
        <Card
          title="Clickable Card"
          desc="Tap the card or thumbnail"
          price="5.00"
          num="1"
          @click="onCardClick"
          @click-thumb="onThumbClick"
        />
      </view>
      <view v-if="clickResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ clickResult }}</text>
      </view>

      <!-- Centered Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Centered Content</text>
      <view :style="{ marginBottom: 16 }">
        <Card
          title="Centered Card"
          desc="Content is vertically centered"
          price="8.00"
          centered
        />
      </view>
    </view>
  </DemoPage>
</template>
