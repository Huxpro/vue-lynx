<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import ContactCard from '../components/ContactCard/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

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
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">ContactCard</text>
    </view>

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
  </view>
</template>
