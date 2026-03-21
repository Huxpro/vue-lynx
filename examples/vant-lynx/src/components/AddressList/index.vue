<!--
  Vant Feature Parity Report:
  - Props: 8/9 supported (list, modelValue, switchable, disabledList, disabledText,
    showAddButton, addButtonText, defaultTagText)
  - Events: 7/7 supported (update:modelValue, add, edit, select, clickItem,
    editDisabled, selectDisabled)
  - Slots: 0/3 supported
  - Gaps: rightIcon prop, item-bottom/tag/top slots, multi-select mode
-->
<script setup lang="ts">
/**
 * VantAddressList (Lynx port)
 * @see https://github.com/youzan/vant/blob/main/packages/vant/src/address-list/AddressList.tsx
 *
 * Feature parity: 8/9 props, 7/7 events.
 * Missing: rightIcon prop, item-bottom/tag/top slots, multi-select mode.
 *
 * Lynx differences:
 *   - Custom radio icons (no Radio/RadioGroup components)
 *   - Text "Edit" button instead of Vant's Icon edit
 *   - Single-select only (Vant supports Array modelValue for multi-select)
 */
import { computed } from 'vue-lynx';

export interface AddressItem {
  id: string | number;
  name: string;
  tel: string;
  address: string;
  isDefault?: boolean;
}

export interface AddressListProps {
  list?: AddressItem[];
  modelValue?: string | number;
  disabledList?: AddressItem[];
  disabledText?: string;
  switchable?: boolean;
  showAddButton?: boolean;
  addButtonText?: string;
  defaultTagText?: string;
}

const props = withDefaults(defineProps<AddressListProps>(), {
  list: () => [],
  disabledList: () => [],
  disabledText: '',
  switchable: true,
  showAddButton: true,
  addButtonText: 'Add New Address',
  defaultTagText: 'Default',
});

const emit = defineEmits<{
  'update:modelValue': [id: string | number];
  add: [];
  edit: [item: AddressItem, index: number];
  select: [item: AddressItem, index: number];
  clickItem: [item: AddressItem, index: number];
  editDisabled: [item: AddressItem, index: number];
  selectDisabled: [item: AddressItem, index: number];
}>();

function isSelected(item: AddressItem): boolean {
  return props.modelValue === item.id;
}

function onItemTap(item: AddressItem, index: number) {
  emit('clickItem', item, index);
  if (props.switchable) {
    emit('update:modelValue', item.id);
    emit('select', item, index);
  }
}

function onEditTap(item: AddressItem, index: number, event: any) {
  emit('edit', item, index);
}

function onDisabledItemTap(item: AddressItem, index: number) {
  emit('selectDisabled', item, index);
}

function onDisabledEditTap(item: AddressItem, index: number) {
  emit('editDisabled', item, index);
}

function onAddTap() {
  emit('add');
}

const radioIconStyle = (selected: boolean) => ({
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: selected ? '#1989fa' : '#c8c9cc',
  backgroundColor: selected ? '#1989fa' : '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
});

const itemStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  padding: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
};
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column' }">
    <!-- Enabled list -->
    <view v-if="list.length > 0" :style="{ display: 'flex', flexDirection: 'column' }">
      <view
        v-for="(item, index) in list"
        :key="item.id"
        :style="itemStyle"
        @tap="onItemTap(item, index)"
      >
        <!-- Radio icon -->
        <view v-if="switchable" :style="radioIconStyle(isSelected(item))">
          <text
            v-if="isSelected(item)"
            :style="{ fontSize: 12, color: '#fff' }"
          >&#10003;</text>
        </view>

        <!-- Content -->
        <view :style="contentStyle">
          <view :style="{ display: 'flex', flexDirection: 'row' as const, alignItems: 'center', marginBottom: 4 }">
            <text :style="{ fontSize: 16, color: '#323233', fontWeight: 'bold', marginRight: 8 }">{{ item.name }}</text>
            <text :style="{ fontSize: 14, color: '#323233' }">{{ item.tel }}</text>
            <view
              v-if="item.isDefault"
              :style="{
                marginLeft: 8,
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 1,
                paddingBottom: 1,
                backgroundColor: '#e8f4ff',
                borderRadius: 2,
              }"
            >
              <text :style="{ fontSize: 10, color: '#1989fa' }">{{ defaultTagText }}</text>
            </view>
          </view>
          <text :style="{ fontSize: 13, color: '#969799', lineHeight: 18 }">{{ item.address }}</text>
        </view>

        <!-- Edit button -->
        <text
          :style="{ fontSize: 14, color: '#969799', paddingLeft: 12 }"
          @tap="onEditTap(item, index, $event)"
        >Edit</text>
      </view>
    </view>

    <!-- Disabled list -->
    <view v-if="disabledList.length > 0" :style="{ display: 'flex', flexDirection: 'column', marginTop: 12 }">
      <view :style="{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 8 }">
        <text :style="{ fontSize: 14, color: '#969799' }">{{ disabledText || 'Disabled Addresses' }}</text>
      </view>
      <view
        v-for="(item, index) in disabledList"
        :key="item.id"
        :style="{ ...itemStyle, opacity: 0.6 }"
        @tap="onDisabledItemTap(item, index)"
      >
        <view :style="contentStyle">
          <view :style="{ display: 'flex', flexDirection: 'row' as const, alignItems: 'center', marginBottom: 4 }">
            <text :style="{ fontSize: 16, color: '#323233', fontWeight: 'bold', marginRight: 8 }">{{ item.name }}</text>
            <text :style="{ fontSize: 14, color: '#323233' }">{{ item.tel }}</text>
          </view>
          <text :style="{ fontSize: 13, color: '#969799', lineHeight: 18 }">{{ item.address }}</text>
        </view>
        <text
          :style="{ fontSize: 14, color: '#969799', paddingLeft: 12 }"
          @tap="onDisabledEditTap(item, index)"
        >Edit</text>
      </view>
    </view>

    <!-- Add button -->
    <view
      v-if="showAddButton"
      :style="{
        margin: 16,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ee0a24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
      @tap="onAddTap"
    >
      <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">{{ addButtonText }}</text>
    </view>
  </view>
</template>
