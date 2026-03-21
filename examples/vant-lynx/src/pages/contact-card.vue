<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ContactCard from '../components/ContactCard/index.vue';
const cardType = ref<'add' | 'edit'>('add');
const name = ref('John Doe');
const tel = ref('130-0000-0000');

function onCardClick() {
  if (cardType.value === 'add') {
    cardType.value = 'edit';
  }
}
</script>

<template>
  <DemoPage title="ContactCard">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Add Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Add Type</text>
      <view :style="{ marginBottom: 16 }">
        <ContactCard
          type="add"
          add-text="Add Contact Info"
          @click="onCardClick"
        />
      </view>

      <!-- Edit Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Edit Type</text>
      <view :style="{ marginBottom: 16 }">
        <ContactCard
          type="edit"
          :name="name"
          :tel="tel"
          @click="onCardClick"
        />
      </view>

      <!-- Not Editable -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Not Editable</text>
      <view>
        <ContactCard
          type="edit"
          name="Jane Smith"
          tel="131-0000-0000"
          :editable="false"
        />
      </view>
    </view>
  </DemoPage>
</template>
