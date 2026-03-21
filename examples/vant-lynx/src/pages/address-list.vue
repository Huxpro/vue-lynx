<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import AddressList from '../components/AddressList/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const selectedId = ref('1');

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
  // navigate to address edit
}

function onEdit(item: any, index: number) {
  // navigate to edit address
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">AddressList</text>
    </view>

    <AddressList
      v-model="selectedId"
      :list="list"
      :disabled-list="disabledList"
      default-tag-text="Default"
      @add="onAdd"
      @edit="onEdit"
    />

    <view :style="{ padding: 16 }">
      <view :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected ID: {{ selectedId }}</text>
      </view>
    </view>
  </view>
</template>
