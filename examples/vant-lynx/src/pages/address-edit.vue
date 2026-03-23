<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import AddressEdit from '../components/AddressEdit/index.vue';

const areaList = {
  province_list: {
    '110000': '北京市',
    '330000': '浙江省',
  },
  city_list: {
    '110100': '北京市',
    '330100': '杭州市',
  },
  county_list: {
    '110101': '东城区',
    '110102': '西城区',
    '330102': '上城区',
    '330103': '下城区',
  },
};

const searchResult = ref<{ name?: string; address?: string }[]>([]);

const onSave = () => {
  // showToast('save');
};

const onDelete = () => {
  // showToast('delete');
};

const onChangeDetail = (val: string) => {
  if (val) {
    searchResult.value = [
      { name: '黄龙万科中心', address: '杭州市西湖区' },
      { name: '黄龙万科中心G座' },
      { name: '黄龙万科中心H座', address: '杭州市西湖区' },
    ];
  } else {
    searchResult.value = [];
  }
};
</script>

<template>
  <DemoPage title="AddressEdit 地址编辑">
    <view :style="{ paddingBottom: '20px' }">
      <AddressEdit
        :area-list="areaList"
        show-delete
        show-set-default
        show-search-result
        :search-result="searchResult"
        :area-columns-placeholder="['请选择', '请选择', '请选择']"
        @save="onSave"
        @delete="onDelete"
        @change-detail="onChangeDetail"
      />
    </view>
  </DemoPage>
</template>
