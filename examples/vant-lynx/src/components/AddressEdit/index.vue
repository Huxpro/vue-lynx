<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface AddressInfo {
  name?: string;
  tel?: string;
  province?: string;
  city?: string;
  county?: string;
  areaCode?: string;
  addressDetail?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface AreaList {
  province_list?: Record<string, string>;
  city_list?: Record<string, string>;
  county_list?: Record<string, string>;
}

export interface AddressEditProps {
  addressInfo?: AddressInfo;
  addressText?: string;
  areaList?: AreaList;
  showPostal?: boolean;
  showDelete?: boolean;
  showSetDefault?: boolean;
  showSearchResult?: boolean;
  showArea?: boolean;
  telValidator?: (tel: string) => boolean;
  areaColumnsPlaceholder?: string[];
  saveButtonText?: string;
  deleteButtonText?: string;
}

const props = withDefaults(defineProps<AddressEditProps>(), {
  addressInfo: () => ({}),
  addressText: '',
  areaList: () => ({}),
  showPostal: false,
  showDelete: false,
  showSetDefault: false,
  showSearchResult: false,
  showArea: true,
  saveButtonText: 'Save',
  deleteButtonText: 'Delete',
});

const emit = defineEmits<{
  save: [info: AddressInfo];
  delete: [info: AddressInfo];
  changeDetail: [value: string];
  changeArea: [values: string[]];
  clickArea: [];
}>();

const name = ref(props.addressInfo.name ?? '');
const tel = ref(props.addressInfo.tel ?? '');
const province = ref(props.addressInfo.province ?? '');
const city = ref(props.addressInfo.city ?? '');
const county = ref(props.addressInfo.county ?? '');
const areaCode = ref(props.addressInfo.areaCode ?? '');
const addressDetail = ref(props.addressInfo.addressDetail ?? '');
const postalCode = ref(props.addressInfo.postalCode ?? '');
const isDefault = ref(props.addressInfo.isDefault ?? false);

watch(
  () => props.addressInfo,
  (info) => {
    name.value = info.name ?? '';
    tel.value = info.tel ?? '';
    province.value = info.province ?? '';
    city.value = info.city ?? '';
    county.value = info.county ?? '';
    areaCode.value = info.areaCode ?? '';
    addressDetail.value = info.addressDetail ?? '';
    postalCode.value = info.postalCode ?? '';
    isDefault.value = info.isDefault ?? false;
  },
  { deep: true },
);

const areaText = computed(() => {
  const parts = [province.value, city.value, county.value].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '';
});

const showAreaError = ref(false);
const showNameError = ref(false);
const showTelError = ref(false);

function validateTel(telValue: string): boolean {
  if (props.telValidator) {
    return props.telValidator(telValue);
  }
  return /^1[3-9]\d{9}$/.test(telValue) || telValue.length >= 5;
}

function getAddressInfo(): AddressInfo {
  return {
    name: name.value,
    tel: tel.value,
    province: province.value,
    city: city.value,
    county: county.value,
    areaCode: areaCode.value,
    addressDetail: addressDetail.value,
    postalCode: postalCode.value,
    isDefault: isDefault.value,
  };
}

function onSave() {
  showNameError.value = false;
  showTelError.value = false;
  showAreaError.value = false;

  if (!name.value.trim()) {
    showNameError.value = true;
    return;
  }

  if (!tel.value.trim() || !validateTel(tel.value)) {
    showTelError.value = true;
    return;
  }

  if (props.showArea && !areaText.value) {
    showAreaError.value = true;
    return;
  }

  emit('save', getAddressInfo());
}

function onDelete() {
  emit('delete', getAddressInfo());
}

function onDetailInput(event: any) {
  const value = event?.detail?.value ?? event?.target?.value ?? '';
  addressDetail.value = value;
  emit('changeDetail', value);
}

function onAreaTap() {
  emit('clickArea');
}

function onToggleDefault() {
  isDefault.value = !isDefault.value;
}

const fieldContainerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  padding: 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const labelStyle = {
  fontSize: 14,
  color: '#323233',
  width: 88,
  marginRight: 12,
};

const inputStyle = {
  flex: 1,
  fontSize: 14,
  color: '#323233',
  height: 24,
};

const errorTextStyle = {
  fontSize: 12,
  color: '#ee0a24',
  paddingLeft: 116,
  paddingBottom: 8,
  backgroundColor: '#fff',
};
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Name field -->
    <view :style="fieldContainerStyle">
      <text :style="{ ...labelStyle, color: showNameError ? '#ee0a24' : '#323233' }">Name</text>
      <input
        :value="name"
        placeholder="Enter name"
        :style="inputStyle"
        @input="(e: any) => { name = e?.detail?.value ?? e?.target?.value ?? '' }"
      />
    </view>
    <text v-if="showNameError" :style="errorTextStyle">Please enter name</text>

    <!-- Tel field -->
    <view :style="fieldContainerStyle">
      <text :style="{ ...labelStyle, color: showTelError ? '#ee0a24' : '#323233' }">Tel</text>
      <input
        :value="tel"
        placeholder="Enter phone number"
        type="tel"
        :style="inputStyle"
        @input="(e: any) => { tel = e?.detail?.value ?? e?.target?.value ?? '' }"
      />
    </view>
    <text v-if="showTelError" :style="errorTextStyle">Please enter valid phone number</text>

    <!-- Area field -->
    <view v-if="showArea" :style="fieldContainerStyle" @tap="onAreaTap">
      <text :style="{ ...labelStyle, color: showAreaError ? '#ee0a24' : '#323233' }">Area</text>
      <text
        :style="{
          flex: 1,
          fontSize: 14,
          color: areaText ? '#323233' : '#c8c9cc',
        }"
      >{{ areaText || 'Select area' }}</text>
      <text :style="{ fontSize: 14, color: '#969799' }">&#x203A;</text>
    </view>
    <text v-if="showAreaError" :style="errorTextStyle">Please select area</text>

    <!-- Address Detail field -->
    <view :style="fieldContainerStyle">
      <text :style="labelStyle">Detail</text>
      <input
        :value="addressDetail"
        placeholder="Enter detailed address"
        :style="inputStyle"
        @input="onDetailInput"
      />
    </view>

    <!-- Postal Code field -->
    <view v-if="showPostal" :style="fieldContainerStyle">
      <text :style="labelStyle">Postal</text>
      <input
        :value="postalCode"
        placeholder="Enter postal code"
        :style="inputStyle"
        @input="(e: any) => { postalCode = e?.detail?.value ?? e?.target?.value ?? '' }"
      />
    </view>

    <!-- Set Default -->
    <view
      v-if="showSetDefault"
      :style="{
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: '#fff',
        marginTop: 12,
      }"
      @tap="onToggleDefault"
    >
      <text :style="{ fontSize: 14, color: '#323233' }">Set as default address</text>
      <view
        :style="{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: isDefault ? '#1989fa' : '#e5e5e5',
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'center',
          padding: 2,
        }"
      >
        <view
          :style="{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#fff',
            marginLeft: isDefault ? 18 : 0,
          }"
        />
      </view>
    </view>

    <!-- Save button -->
    <view
      :style="{
        margin: 16,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1989fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
      @tap="onSave"
    >
      <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">{{ saveButtonText }}</text>
    </view>

    <!-- Delete button -->
    <view
      v-if="showDelete"
      :style="{
        marginLeft: 16,
        marginRight: 16,
        marginBottom: 16,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'solid' as const,
        borderColor: '#ee0a24',
      }"
      @tap="onDelete"
    >
      <text :style="{ fontSize: 16, color: '#ee0a24' }">{{ deleteButtonText }}</text>
    </view>
  </view>
</template>
