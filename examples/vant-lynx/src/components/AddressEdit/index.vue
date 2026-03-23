<!--
  Lynx Limitations:
  - <form> element: Lynx has no <form> element, Form uses <view> instead
  - nativeType="submit": No native form submission in Lynx, calls form.submit() manually
  - isMobile validator: Uses simplified regex, not Vant's locale-specific validator
  - v-show: Uses v-if instead (Lynx display:none behavior differs)
  - teleport: Popup teleport not supported in Lynx
  - showToast on area empty: Not called (toast import would add complexity for edge case)
-->
<script lang="ts">
import type { AddressEditInfo, AddressEditSearchItem } from './types';

const DEFAULT_DATA: AddressEditInfo = {
  name: '',
  tel: '',
  city: '',
  county: '',
  province: '',
  areaCode: '',
  isDefault: false,
  addressDetail: '',
};

function isMobile(value: string): boolean {
  value = value.replace(/[^-|\d]/g, '');
  return /^(\+?\d{3,4}[- ]?)?\d{5,}$/.test(value);
}
</script>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Form from '../Form/index.vue';
import Field from '../Field/index.vue';
import Cell from '../Cell/index.vue';
import Button from '../Button/index.vue';
import Switch from '../Switch/index.vue';
import Popup from '../Popup/index.vue';
import Area from '../Area/index.vue';
import AddressEditDetail from './AddressEditDetail.vue';
import type { FormExpose } from '../Form/types';
import type { FieldRule } from '../Field/types';
import './index.less';

const [, bem] = createNamespace('address-edit');

const props = withDefaults(
  defineProps<{
    areaList?: Record<string, Record<string, string>>;
    isSaving?: boolean;
    isDeleting?: boolean;
    validator?: (key: string, value: string) => string | undefined;
    showArea?: boolean;
    showDetail?: boolean;
    showDelete?: boolean;
    disableArea?: boolean;
    searchResult?: AddressEditSearchItem[];
    telMaxlength?: number | string;
    showSetDefault?: boolean;
    saveButtonText?: string;
    areaPlaceholder?: string;
    deleteButtonText?: string;
    showSearchResult?: boolean;
    detailRows?: number | string;
    detailMaxlength?: number | string;
    areaColumnsPlaceholder?: string[];
    addressInfo?: Partial<AddressEditInfo>;
    telValidator?: (val: string) => boolean;
  }>(),
  {
    areaList: undefined,
    isSaving: false,
    isDeleting: false,
    validator: undefined,
    showArea: true,
    showDetail: true,
    showDelete: false,
    disableArea: false,
    searchResult: undefined,
    telMaxlength: undefined,
    showSetDefault: false,
    saveButtonText: '',
    areaPlaceholder: '',
    deleteButtonText: '',
    showSearchResult: false,
    detailRows: 1,
    detailMaxlength: 200,
    areaColumnsPlaceholder: () => [],
    addressInfo: () => ({ ...DEFAULT_DATA }),
    telValidator: isMobile,
  },
);

const emit = defineEmits<{
  save: [info: AddressEditInfo];
  focus: [key: string];
  change: [data: { key: string; value: string }];
  delete: [info: AddressEditInfo];
  clickArea: [];
  changeArea: [options: { code: string; name: string }[]];
  changeDetail: [value: string];
  selectSearch: [item: AddressEditSearchItem];
  changeDefault: [checked: boolean];
}>();

const data = reactive<AddressEditInfo>({ ...DEFAULT_DATA });
const showAreaPopup = ref(false);
const detailFocused = ref(false);
const formRef = ref<FormExpose>();

const areaListLoaded = computed(
  () => props.areaList && typeof props.areaList === 'object' && Object.keys(props.areaList).length > 0,
);

const areaText = computed(() => {
  const { province, city, county, areaCode } = data;
  if (areaCode) {
    const arr = [province, city, county];
    if (province && province === city) {
      arr.splice(1, 1);
    }
    return arr.filter(Boolean).join('/');
  }
  return '';
});

const hideBottomFields = computed(
  () => props.searchResult?.length && detailFocused.value,
);

const onFocus = (key: string) => {
  detailFocused.value = key === 'addressDetail';
  emit('focus', key);
};

const onChange = (key: string, value: string) => {
  emit('change', { key, value });
};

const rules = computed<Record<string, FieldRule[]>>(() => {
  const { validator, telValidator } = props;

  const makeRule = (name: string, emptyMessage: string): FieldRule => ({
    validator: (value: string) => {
      if (validator) {
        const message = validator(name, value);
        if (message) {
          return message;
        }
      }
      if (!value) {
        return emptyMessage;
      }
      return true;
    },
  });

  return {
    name: [makeRule('name', '请填写姓名')],
    tel: [
      makeRule('tel', '请填写正确的电话号码'),
      { validator: telValidator, message: '请填写正确的电话号码' },
    ],
    areaCode: [makeRule('areaCode', '请选择所在地区')],
    addressDetail: [makeRule('addressDetail', '请填写详细地址')],
  };
});

const onSave = () => emit('save', { ...data });

const onFormSubmit = () => {
  onSave();
};

const handleSave = () => {
  formRef.value?.submit();
};

const onChangeDetail = (val: string) => {
  data.addressDetail = val;
  emit('changeDetail', val);
};

const onAreaConfirm = (values: { code: string; name: string }[]) => {
  showAreaPopup.value = false;
  if (values.length >= 3) {
    data.province = values[0].name;
    data.city = values[1].name;
    data.county = values[2].name;
    data.areaCode = values[2].code;
  }
  emit('changeArea', values);
};

const onAreaCancel = () => {
  showAreaPopup.value = false;
};

const onDelete = () => emit('delete', { ...data });

const setAreaCode = (code?: string) => {
  data.areaCode = code || '';
};

const onDetailBlur = () => {
  setTimeout(() => {
    detailFocused.value = false;
  });
};

const setAddressDetail = (value: string) => {
  data.addressDetail = value;
};

const onSelectSearch = (item: AddressEditSearchItem) => {
  emit('selectSearch', item);
};

const onChangeDefault = (checked: unknown) => {
  data.isDefault = checked as boolean;
  emit('changeDefault', checked as boolean);
};

defineExpose({
  setAreaCode,
  setAddressDetail,
});

watch(
  () => props.addressInfo,
  (value) => {
    Object.assign(data, DEFAULT_DATA, value);
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>

<template>
  <Form
    ref="formRef"
    :class="bem()"
    @submit="onFormSubmit"
  >
    <view :class="bem('fields')">
      <Field
        v-model="data.name"
        clearable
        label="姓名"
        :rules="rules.name"
        placeholder="姓名"
        :label-width="'4.1em'"
        @focus="() => onFocus('name')"
        @update:model-value="(val: string) => onChange('name', val)"
      />
      <Field
        v-model="data.tel"
        clearable
        type="tel"
        label="电话"
        :rules="rules.tel"
        :maxlength="telMaxlength"
        placeholder="电话"
        :label-width="'4.1em'"
        @focus="() => onFocus('tel')"
        @update:model-value="(val: string) => onChange('tel', val)"
      />
      <Field
        v-if="showArea"
        readonly
        label="地区"
        :is-link="!disableArea"
        :model-value="areaText"
        :rules="rules.areaCode"
        :placeholder="areaPlaceholder || '选择省 / 市 / 区'"
        :label-width="'4.1em'"
        @focus="() => onFocus('areaCode')"
        @click="() => { emit('clickArea'); if (!disableArea) showAreaPopup = true; }"
      />
      <AddressEditDetail
        :show="showDetail"
        :rows="detailRows"
        :rules="rules.addressDetail"
        :value="data.addressDetail"
        :focused="detailFocused"
        :maxlength="detailMaxlength"
        :search-result="searchResult"
        :show-search-result="showSearchResult"
        @blur="onDetailBlur"
        @focus="() => onFocus('addressDetail')"
        @input="onChangeDetail"
        @select-search="onSelectSearch"
      />
      <slot />
    </view>
    <Cell
      v-if="showSetDefault && !hideBottomFields"
      center
      :border="false"
      title="设为默认收货地址"
      :class="bem('default')"
    >
      <template #right-icon>
        <Switch
          :model-value="data.isDefault"
          @update:model-value="onChangeDefault"
        />
      </template>
    </Cell>
    <view v-if="!hideBottomFields" :class="bem('buttons')">
      <Button
        block
        round
        type="primary"
        :class="bem('button')"
        :loading="isSaving"
        @click="handleSave"
      >
        <text>{{ saveButtonText || '保存' }}</text>
      </Button>
      <Button
        v-if="showDelete"
        block
        round
        :class="bem('button')"
        :loading="isDeleting"
        @click="onDelete"
      >
        <text>{{ deleteButtonText || '删除' }}</text>
      </Button>
    </view>
    <Popup
      v-model:show="showAreaPopup"
      round
      position="bottom"
    >
      <Area
        v-model="data.areaCode"
        :loading="!areaListLoaded"
        :area-list="areaList"
        :columns-placeholder="areaColumnsPlaceholder"
        @confirm="onAreaConfirm"
        @cancel="onAreaCancel"
      />
    </Popup>
  </Form>
</template>
