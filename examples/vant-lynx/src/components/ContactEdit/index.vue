<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface ContactInfo {
  name?: string;
  tel?: string;
  isDefault?: boolean;
}

export interface ContactEditProps {
  contactInfo?: ContactInfo;
  isEdit?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  telValidator?: (tel: string) => boolean;
  showSetDefault?: boolean;
  setDefaultLabel?: string;
}

const props = withDefaults(defineProps<ContactEditProps>(), {
  contactInfo: () => ({}),
  isEdit: false,
  isSaving: false,
  isDeleting: false,
  showSetDefault: false,
  setDefaultLabel: 'Set as default contact',
});

const emit = defineEmits<{
  save: [info: ContactInfo];
  delete: [info: ContactInfo];
  changeDefault: [value: boolean];
}>();

const name = ref(props.contactInfo.name ?? '');
const tel = ref(props.contactInfo.tel ?? '');
const isDefault = ref(props.contactInfo.isDefault ?? false);

watch(
  () => props.contactInfo,
  (info) => {
    name.value = info.name ?? '';
    tel.value = info.tel ?? '';
    isDefault.value = info.isDefault ?? false;
  },
  { deep: true },
);

const showNameError = ref(false);
const showTelError = ref(false);

function validateTel(telValue: string): boolean {
  if (props.telValidator) {
    return props.telValidator(telValue);
  }
  return telValue.length >= 5;
}

function getContactInfo(): ContactInfo {
  return {
    name: name.value,
    tel: tel.value,
    isDefault: isDefault.value,
  };
}

function onSave() {
  showNameError.value = false;
  showTelError.value = false;

  if (!name.value.trim()) {
    showNameError.value = true;
    return;
  }

  if (!tel.value.trim() || !validateTel(tel.value)) {
    showTelError.value = true;
    return;
  }

  emit('save', getContactInfo());
}

function onDelete() {
  emit('delete', getContactInfo());
}

function onToggleDefault() {
  isDefault.value = !isDefault.value;
  emit('changeDefault', isDefault.value);
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
      <text :style="{ fontSize: 14, color: '#323233' }">{{ setDefaultLabel }}</text>
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
        backgroundColor: isSaving ? '#7fb8f5' : '#1989fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isSaving ? 0.7 : 1,
      }"
      @tap="onSave"
    >
      <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">{{ isSaving ? 'Saving...' : 'Save' }}</text>
    </view>

    <!-- Delete button -->
    <view
      v-if="isEdit"
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
        opacity: isDeleting ? 0.7 : 1,
      }"
      @tap="onDelete"
    >
      <text :style="{ fontSize: 16, color: '#ee0a24' }">{{ isDeleting ? 'Deleting...' : 'Delete' }}</text>
    </view>
  </view>
</template>
