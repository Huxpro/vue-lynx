<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import AddressEdit from '../components/AddressEdit/index.vue';
const saveResult = ref('');

const editAddressInfo = {
  name: 'John Doe',
  tel: '13000000000',
  province: 'Zhejiang',
  city: 'Hangzhou',
  county: 'Xihu',
  addressDetail: 'No. 123 West Lake Rd',
  postalCode: '310000',
  isDefault: true,
};

function onSave(info: any) {
  saveResult.value = JSON.stringify(info, null, 2);
}

function onDelete(info: any) {
  saveResult.value = 'Deleted: ' + info.name;
}

function onChangeDetail(value: string) {
  // handle detail change
}
</script>

<template>
  <DemoPage title="AddressEdit">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- New Address -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">New Address</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <AddressEdit
          :show-postal="true"
          :show-set-default="true"
          save-button-text="Save Address"
          @save="onSave"
          @change-detail="onChangeDetail"
        />
      </view>

      <!-- Edit Address -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Edit Address</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <AddressEdit
          :address-info="editAddressInfo"
          :show-delete="true"
          :show-postal="true"
          :show-set-default="true"
          @save="onSave"
          @delete="onDelete"
        />
      </view>

      <view v-if="saveResult" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 12, color: '#323233' }">{{ saveResult }}</text>
      </view>
    </view>
  </DemoPage>
</template>
