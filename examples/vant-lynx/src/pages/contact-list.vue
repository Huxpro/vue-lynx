<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ContactList from '../components/ContactList/index.vue';

const selectedId = ref('1');
const selectLog = ref('');

const list = [
  { id: '1', name: 'John Doe', tel: '130-0000-0000', isDefault: true },
  { id: '2', name: 'Jane Smith', tel: '131-0000-0000' },
  { id: '3', name: 'Bob Wang', tel: '132-0000-0000' },
];

function onAdd() {
  selectLog.value = 'Add button clicked';
}

function onEdit(item: any, index: number) {
  selectLog.value = `Edit: ${item.name}`;
}

function onSelect(item: any, index: number) {
  selectLog.value = `Selected: ${item.name}`;
}
</script>

<template>
  <DemoPage title="ContactList">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">Select a contact from the list</text>
    </view>

    <ContactList
      v-model="selectedId"
      :list="list"
      default-tag-text="Default"
      @add="onAdd"
      @edit="onEdit"
      @select="onSelect"
    />

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <view :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected ID: {{ selectedId }}</text>
      </view>
      <view v-if="selectLog" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ selectLog }}</text>
      </view>
    </view>
  </DemoPage>
</template>
