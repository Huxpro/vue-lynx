<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import ContactList from '../components/ContactList/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const selectedId = ref('1');

const list = [
  { id: '1', name: 'John Doe', tel: '130-0000-0000', isDefault: true },
  { id: '2', name: 'Jane Smith', tel: '131-0000-0000' },
  { id: '3', name: 'Bob Wang', tel: '132-0000-0000' },
];

function onAdd() {
  // navigate to add contact
}

function onEdit(item: any, index: number) {
  // navigate to edit contact
}

function onSelect(item: any, index: number) {
  // handle contact selection
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">ContactList</text>
    </view>

    <ContactList
      v-model="selectedId"
      :list="list"
      default-tag-text="Default"
      @add="onAdd"
      @edit="onEdit"
      @select="onSelect"
    />

    <view :style="{ padding: 16 }">
      <view :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected ID: {{ selectedId }}</text>
      </view>
    </view>
  </view>
</template>
