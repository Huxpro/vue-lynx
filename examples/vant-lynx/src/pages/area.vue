<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Area from '../components/Area/index.vue';
const areaList = {
  province_list: {
    '110000': 'Beijing',
    '120000': 'Tianjin',
    '310000': 'Shanghai',
    '330000': 'Zhejiang',
    '440000': 'Guangdong',
  },
  city_list: {
    '110100': 'Beijing City',
    '120100': 'Tianjin City',
    '310100': 'Shanghai City',
    '330100': 'Hangzhou',
    '330200': 'Ningbo',
    '330300': 'Wenzhou',
    '440100': 'Guangzhou',
    '440300': 'Shenzhen',
  },
  county_list: {
    '110101': 'Dongcheng',
    '110102': 'Xicheng',
    '110105': 'Chaoyang',
    '120101': 'Heping',
    '120102': 'Hedong',
    '310101': 'Huangpu',
    '310104': 'Xuhui',
    '330102': 'Shangcheng',
    '330103': 'Xiacheng',
    '330201': 'Haishu',
    '330301': 'Lucheng',
    '440103': 'Liwan',
    '440104': 'Yuexiu',
    '440303': 'Luohu',
    '440304': 'Futian',
  },
};

const selectedCode = ref('');
const confirmResult = ref('');

function onConfirm(values: { code: string; name: string }[]) {
  confirmResult.value = values.map(v => v.name).join(' / ');
}

function onCancel() {
  confirmResult.value = 'Cancelled';
}
</script>

<template>
  <DemoPage title="Area">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Area
          v-model="selectedCode"
          title="Select Area"
          :area-list="areaList"
          @confirm="onConfirm"
          @cancel="onCancel"
        />
      </view>

      <view v-if="confirmResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Result: {{ confirmResult }}</text>
      </view>

      <!-- Two Columns -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Two Columns</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Area
          title="Province & City"
          :area-list="areaList"
          :columns-num="2"
        />
      </view>

      <!-- Loading State -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading State</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <Area
          title="Loading..."
          :area-list="areaList"
          :loading="true"
        />
      </view>
    </view>
  </DemoPage>
</template>
