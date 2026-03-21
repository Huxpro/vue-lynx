<!--
  Vant Feature Parity Report:
  - Props: 5/7 supported (modelValue, areaList, columnsNum, columnsPlaceholder,
    loading, readonly, visibleOptionNum)
  - Events: 4/4 supported (update:modelValue, confirm, cancel, change)
  - Slots: 0/6 supported
  - Gaps: title/optionHeight/swipeDuration props (Picker-inherited),
    title/cancel/confirm/toolbar/columns-top/columns-bottom slots,
    no scroll-based wheel picker (uses flat list)
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface AreaList {
  province_list?: Record<string, string>;
  city_list?: Record<string, string>;
  county_list?: Record<string, string>;
}

export interface AreaProps {
  modelValue?: string;
  title?: string;
  areaList?: AreaList;
  columnsNum?: number;
  columnsPlaceholder?: string[];
  loading?: boolean;
  readonly?: boolean;
  visibleOptionNum?: number;
}

const props = withDefaults(defineProps<AreaProps>(), {
  modelValue: '',
  title: '',
  areaList: () => ({}),
  columnsNum: 3,
  columnsPlaceholder: () => [],
  loading: false,
  readonly: false,
  visibleOptionNum: 6,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  confirm: [values: { code: string; name: string }[]];
  cancel: [];
  change: [values: { code: string; name: string }[], columnIndex: number];
}>();

// Parse area data into structured columns
const provinces = computed(() => {
  const list = props.areaList.province_list ?? {};
  return Object.entries(list).map(([code, name]) => ({ code, name }));
});

const selectedProvinceCode = ref('');
const selectedCityCode = ref('');
const selectedCountyCode = ref('');

// Initialize from modelValue
function initFromCode(code: string) {
  if (!code) {
    selectedProvinceCode.value = provinces.value[0]?.code ?? '';
    selectedCityCode.value = '';
    selectedCountyCode.value = '';
    return;
  }
  const provinceCode = code.slice(0, 2);
  for (const p of provinces.value) {
    if (p.code.startsWith(provinceCode)) {
      selectedProvinceCode.value = p.code;
      break;
    }
  }
  if (code.length >= 4) {
    const cityPrefix = code.slice(0, 4);
    for (const c of cities.value) {
      if (c.code.startsWith(cityPrefix)) {
        selectedCityCode.value = c.code;
        break;
      }
    }
  }
  if (code.length >= 6) {
    selectedCountyCode.value = code;
  }
}

watch(() => props.modelValue, initFromCode, { immediate: true });

const cities = computed(() => {
  if (!selectedProvinceCode.value) return [];
  const prefix = selectedProvinceCode.value.slice(0, 2);
  const list = props.areaList.city_list ?? {};
  return Object.entries(list)
    .filter(([code]) => code.startsWith(prefix))
    .map(([code, name]) => ({ code, name }));
});

const counties = computed(() => {
  if (!selectedCityCode.value) return [];
  const prefix = selectedCityCode.value.slice(0, 4);
  const list = props.areaList.county_list ?? {};
  return Object.entries(list)
    .filter(([code]) => code.startsWith(prefix))
    .map(([code, name]) => ({ code, name }));
});

function onSelectProvince(item: { code: string; name: string }) {
  if (props.readonly || props.loading) return;
  selectedProvinceCode.value = item.code;
  selectedCityCode.value = cities.value[0]?.code ?? '';
  selectedCountyCode.value = '';
  emitChange(0);
}

function onSelectCity(item: { code: string; name: string }) {
  if (props.readonly || props.loading) return;
  selectedCityCode.value = item.code;
  selectedCountyCode.value = '';
  emitChange(1);
}

function onSelectCounty(item: { code: string; name: string }) {
  if (props.readonly || props.loading) return;
  selectedCountyCode.value = item.code;
  emitChange(2);
}

function getSelectedValues(): { code: string; name: string }[] {
  const values: { code: string; name: string }[] = [];
  const selectedProvince = provinces.value.find(p => p.code === selectedProvinceCode.value);
  if (selectedProvince) values.push(selectedProvince);

  if (props.columnsNum >= 2) {
    const selectedCity = cities.value.find(c => c.code === selectedCityCode.value);
    if (selectedCity) values.push(selectedCity);
  }

  if (props.columnsNum >= 3) {
    const selectedCounty = counties.value.find(c => c.code === selectedCountyCode.value);
    if (selectedCounty) values.push(selectedCounty);
  }

  return values;
}

function emitChange(columnIndex: number) {
  emit('change', getSelectedValues(), columnIndex);
}

function onConfirm() {
  if (props.readonly || props.loading) return;
  const values = getSelectedValues();
  const lastCode = values[values.length - 1]?.code ?? '';
  emit('update:modelValue', lastCode);
  emit('confirm', values);
}

function onCancel() {
  emit('cancel');
}

const toolbarStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between' as const,
  height: 44,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const columnStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
};

function isSelectedItem(code: string, selectedCode: string): boolean {
  return code === selectedCode;
}

const itemStyle = (selected: boolean) => ({
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
</script>

<template>
  <view :style="{ backgroundColor: '#fff' }">
    <!-- Toolbar -->
    <view :style="toolbarStyle">
      <text :style="{ fontSize: 14, color: '#969799', padding: 4 }" @tap="onCancel">Cancel</text>
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
      <text :style="{ fontSize: 14, color: '#1989fa', padding: 4 }" @tap="onConfirm">Confirm</text>
    </view>

    <!-- Columns -->
    <view
      :style="{
        display: 'flex',
        flexDirection: 'row' as const,
        height: visibleOptionNum * 44,
        backgroundColor: '#fff',
      }"
    >
      <!-- Province column -->
      <view :style="columnStyle">
        <view
          v-for="item in provinces"
          :key="item.code"
          :style="itemStyle(isSelectedItem(item.code, selectedProvinceCode))"
          @tap="onSelectProvince(item)"
        >
          <text
            :style="{
              fontSize: 14,
              color: isSelectedItem(item.code, selectedProvinceCode) ? '#323233' : '#969799',
              fontWeight: isSelectedItem(item.code, selectedProvinceCode) ? 'bold' : 'normal',
            }"
          >{{ item.name }}</text>
        </view>
        <view
          v-if="provinces.length === 0 && columnsPlaceholder[0]"
          :style="{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }"
        >
          <text :style="{ fontSize: 14, color: '#c8c9cc' }">{{ columnsPlaceholder[0] }}</text>
        </view>
      </view>

      <!-- City column -->
      <view v-if="columnsNum >= 2" :style="columnStyle">
        <view
          v-for="item in cities"
          :key="item.code"
          :style="itemStyle(isSelectedItem(item.code, selectedCityCode))"
          @tap="onSelectCity(item)"
        >
          <text
            :style="{
              fontSize: 14,
              color: isSelectedItem(item.code, selectedCityCode) ? '#323233' : '#969799',
              fontWeight: isSelectedItem(item.code, selectedCityCode) ? 'bold' : 'normal',
            }"
          >{{ item.name }}</text>
        </view>
        <view
          v-if="cities.length === 0 && columnsPlaceholder[1]"
          :style="{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }"
        >
          <text :style="{ fontSize: 14, color: '#c8c9cc' }">{{ columnsPlaceholder[1] }}</text>
        </view>
      </view>

      <!-- County column -->
      <view v-if="columnsNum >= 3" :style="columnStyle">
        <view
          v-for="item in counties"
          :key="item.code"
          :style="itemStyle(isSelectedItem(item.code, selectedCountyCode))"
          @tap="onSelectCounty(item)"
        >
          <text
            :style="{
              fontSize: 14,
              color: isSelectedItem(item.code, selectedCountyCode) ? '#323233' : '#969799',
              fontWeight: isSelectedItem(item.code, selectedCountyCode) ? 'bold' : 'normal',
            }"
          >{{ item.name }}</text>
        </view>
        <view
          v-if="counties.length === 0 && columnsPlaceholder[2]"
          :style="{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }"
        >
          <text :style="{ fontSize: 14, color: '#c8c9cc' }">{{ columnsPlaceholder[2] }}</text>
        </view>
      </view>
    </view>

    <!-- Loading overlay -->
    <view
      v-if="loading"
      :style="{
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <text :style="{ fontSize: 14, color: '#969799' }">Loading...</text>
    </view>
  </view>
</template>
