<!--
  Vant Feature Parity Report:
  - Props: 4/4 supported (list, modelValue, addText, defaultTagText)
  - Events: 4/4 supported (update:modelValue, select, add, edit)
  - Slots: 0/0 supported (Vant ContactList has no slots)
  - Gaps: None - full prop and event parity achieved
-->
<script setup lang="ts">
/**
 * VantContactList (Lynx port)
 * @see https://github.com/youzan/vant/blob/main/packages/vant/src/contact-list/ContactList.tsx
 *
 * Feature parity: 4/4 props, 4/4 events. Full parity.
 * Lynx differences:
 *   - Custom radio icons instead of Vant's Radio/RadioGroup
 *   - Edit button is text "Edit" instead of Vant's Icon("edit")
 *   - Custom empty state instead of Vant's built-in empty handling
 *   - Uses Cell-like layout with inline styles
 */
import { computed } from 'vue-lynx';

export interface ContactItem {
  id: string | number;
  name: string;
  tel: string;
  isDefault?: boolean;
}

export interface ContactListProps {
  list?: ContactItem[];
  modelValue?: string | number;
  addText?: string;
  defaultTagText?: string;
}

const props = withDefaults(defineProps<ContactListProps>(), {
  list: () => [],
  addText: 'Add New Contact',
  defaultTagText: 'Default',
});

const emit = defineEmits<{
  'update:modelValue': [id: string | number];
  select: [item: ContactItem, index: number];
  add: [];
  edit: [item: ContactItem, index: number];
}>();

function isSelected(item: ContactItem): boolean {
  return props.modelValue === item.id;
}

function onSelectItem(item: ContactItem, index: number) {
  emit('update:modelValue', item.id);
  emit('select', item, index);
}

function onEditTap(item: ContactItem, index: number) {
  emit('edit', item, index);
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
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column' }">
    <!-- Contact list -->
    <view
      v-for="(item, index) in list"
      :key="item.id"
      :style="itemStyle"
      @tap="onSelectItem(item, index)"
    >
      <!-- Radio icon -->
      <view :style="radioIconStyle(isSelected(item))">
        <text
          v-if="isSelected(item)"
          :style="{ fontSize: 12, color: '#fff' }"
        >&#10003;</text>
      </view>

      <!-- Content -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column' }">
        <view :style="{ display: 'flex', flexDirection: 'row' as const, alignItems: 'center' }">
          <text :style="{ fontSize: 16, color: '#323233', fontWeight: 'bold', marginRight: 8 }">{{ item.name }}</text>
          <view
            v-if="item.isDefault"
            :style="{
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
        <text :style="{ fontSize: 14, color: '#969799', marginTop: 4 }">{{ item.tel }}</text>
      </view>

      <!-- Edit button -->
      <text
        :style="{ fontSize: 14, color: '#969799', paddingLeft: 12 }"
        @tap="onEditTap(item, index)"
      >Edit</text>
    </view>

    <!-- Empty state -->
    <view
      v-if="list.length === 0"
      :style="{
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <text :style="{ fontSize: 14, color: '#969799' }">No contacts</text>
    </view>

    <!-- Add button -->
    <view
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
      <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">{{ addText }}</text>
    </view>
  </view>
</template>
