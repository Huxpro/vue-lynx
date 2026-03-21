<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import AddressList from '../components/AddressList/index.vue';

const selectedId = ref('1');
const actionLog = ref('');

const list = [
  {
    id: '1',
    name: 'John Doe',
    tel: '130-0000-0000',
    address: 'No. 123 West Lake Rd, Xihu District, Hangzhou, Zhejiang',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    tel: '131-0000-0000',
    address: 'No. 456 Nanjing Rd, Huangpu District, Shanghai',
  },
  {
    id: '3',
    name: 'Bob Wang',
    tel: '132-0000-0000',
    address: 'No. 789 Changan St, Dongcheng District, Beijing',
  },
];

const disabledList = [
  {
    id: '4',
    name: 'Alice Chen',
    tel: '133-0000-0000',
    address: 'No. 321 Overseas Address (not supported)',
  },
];

function onAdd() {
  actionLog.value = 'Add address clicked';
}

function onEdit(item: any, index: number) {
  actionLog.value = `Edit: ${item.name}`;
}

function onSelect(item: any, index: number) {
  actionLog.value = `Selected: ${item.name}`;
}
</script>

<template>
  <DemoPage title="AddressList">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">Select an address from the list</text>
    </view>

    <AddressList
      v-model="selectedId"
      :list="list"
      :disabled-list="disabledList"
      default-tag-text="Default"
      disabled-text="Cannot deliver to these addresses"
      @add="onAdd"
      @edit="onEdit"
      @select="onSelect"
    />

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <view :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected ID: {{ selectedId }}</text>
      </view>
      <view v-if="actionLog" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ actionLog }}</text>
      </view>
    </view>
  </DemoPage>
</template>
