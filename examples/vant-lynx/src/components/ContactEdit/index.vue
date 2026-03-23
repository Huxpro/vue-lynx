<!--
  Lynx Limitations:
  - <form> element: Lynx has no <form> element, Form uses <view> instead
  - nativeType="submit": No native form submission in Lynx, calls form.submit() manually
  - isMobile validator: Uses simplified regex, not Vant's locale-specific validator
-->
<script lang="ts">
import type { ContactEditInfo } from './types';

const DEFAULT_CONTACT: ContactEditInfo = {
  tel: '',
  name: '',
};

function isMobile(value: string): boolean {
  value = value.replace(/[^-|\d]/g, '');
  return /^(\+?\d{3,4}[- ]?)?\d{5,}$/.test(value);
}
</script>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Form from '../Form/index.vue';
import Field from '../Field/index.vue';
import Button from '../Button/index.vue';
import Switch from '../Switch/index.vue';
import Cell from '../Cell/index.vue';
import type { FormExpose } from '../Form/types';
import './index.less';

const [, bem] = createNamespace('contact-edit');

const props = withDefaults(
  defineProps<{
    isEdit?: boolean;
    isSaving?: boolean;
    isDeleting?: boolean;
    showSetDefault?: boolean;
    setDefaultLabel?: string;
    contactInfo?: ContactEditInfo;
    telValidator?: (val: string) => boolean;
  }>(),
  {
    isEdit: false,
    isSaving: false,
    isDeleting: false,
    showSetDefault: false,
    setDefaultLabel: '',
    contactInfo: () => ({ ...DEFAULT_CONTACT }),
    telValidator: isMobile,
  },
);

const emit = defineEmits<{
  save: [contact: ContactEditInfo];
  delete: [contact: ContactEditInfo];
  changeDefault: [checked: boolean];
}>();

const contact = reactive<ContactEditInfo>({
  ...DEFAULT_CONTACT,
  ...props.contactInfo,
});

const formRef = ref<FormExpose>();

const onSave = () => {
  if (!props.isSaving) {
    emit('save', { ...contact });
  }
};

const onDelete = () => emit('delete', { ...contact });

const onChangeDefault = (checked: unknown) => {
  contact.isDefault = checked as boolean;
  emit('changeDefault', checked as boolean);
};

const onFormSubmit = () => {
  onSave();
};

const onFormFailed = () => {
  // validation failed, do nothing
};

const handleSave = () => {
  formRef.value?.submit();
};

watch(
  () => props.contactInfo,
  (value) => {
    Object.assign(contact, DEFAULT_CONTACT, value);
  },
);
</script>

<template>
  <Form
    ref="formRef"
    :class="bem()"
    @submit="onFormSubmit"
    @failed="onFormFailed"
  >
    <view :class="bem('fields')">
      <Field
        v-model="contact.name"
        clearable
        label="姓名"
        :rules="[{ required: true, message: '请填写姓名' }]"
        maxlength="30"
        placeholder="姓名"
        :label-width="'4.1em'"
      />
      <Field
        v-model="contact.tel"
        clearable
        type="tel"
        label="电话"
        :rules="[{ validator: telValidator, message: '请填写正确的电话号码' }]"
        placeholder="电话"
        :label-width="'4.1em'"
      />
    </view>
    <Cell
      v-if="showSetDefault"
      :title="setDefaultLabel"
      :class="bem('switch-cell')"
      :border="false"
    >
      <template #right-icon>
        <Switch
          :model-value="contact.isDefault"
          @update:model-value="onChangeDefault"
        />
      </template>
    </Cell>
    <view :class="bem('buttons')">
      <Button
        block
        round
        type="primary"
        :class="bem('button')"
        :loading="isSaving"
        @click="handleSave"
      >
        <text>保存</text>
      </Button>
      <Button
        v-if="isEdit"
        block
        round
        :class="bem('button')"
        :loading="isDeleting"
        @click="onDelete"
      >
        <text>删除</text>
      </Button>
    </view>
  </Form>
</template>
