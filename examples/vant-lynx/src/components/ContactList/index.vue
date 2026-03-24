<!--
  Lynx Limitations:
  - overflow-y: scroll on group: Lynx has no overflow scroll, group renders without scroll
  - -webkit-overflow-scrolling: touch: not applicable in Lynx
  - van-safe-area-bottom class: safe area insets not available in Lynx
-->
<script setup lang="ts">
import { nextTick } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Cell from '../Cell/index.vue';
import Radio from '../Radio/index.vue';
import RadioGroup from '../RadioGroup/index.vue';
import Tag from '../Tag/index.vue';
import Icon from '../Icon/index.vue';
import Button from '../Button/index.vue';
import type { ContactListItem } from './types';
import './index.less';

export interface ContactListProps {
  list?: ContactListItem[];
  modelValue?: unknown;
  addText?: string;
  defaultTagText?: string;
}

const props = withDefaults(defineProps<ContactListProps>(), {
  list: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [id: unknown];
  select: [item: ContactListItem, index: number];
  add: [];
  edit: [item: ContactListItem, index: number];
}>();

const [name, bem] = createNamespace('contact-list');

// Flag to prevent Cell click from firing select when edit icon is tapped.
// In Vant web, this is handled by event.stopPropagation() on the edit icon.
let editClicked = false;

function onItemClick(item: ContactListItem, index: number) {
  if (editClicked) return;
  emit('update:modelValue', item.id);
  emit('select', item, index);
}

function onEdit(item: ContactListItem, index: number) {
  editClicked = true;
  emit('edit', item, index);
  nextTick(() => {
    editClicked = false;
  });
}

function onAdd() {
  emit('add');
}
</script>

<template>
  <view :class="bem()">
    <RadioGroup :model-value="modelValue" :class="bem('group')">
      <slot />
      <Cell
        v-for="(item, index) in list"
        :key="item.id"
        is-link
        center
        :class="bem('item')"
        :title-class="bem('item-title')"
        @click="onItemClick(item, index)"
      >
        <template #icon>
          <Radio :class="bem('radio')" :name="item.id" />
        </template>
        <template #default>
          <view :class="bem('name')">{{ item.name }}，{{ item.tel }}</view>
        </template>
        <template #right-icon>
          <Icon name="edit" :class="bem('edit')" @click.stop="onEdit(item, index)" />
        </template>
      </Cell>
    </RadioGroup>
    <view :class="bem('bottom')">
      <slot name="bottom" />
      <Button
        v-if="addText"
        round
        block
        type="primary"
        :class="bem('add')"
        :text="addText"
        @click="onAdd"
      />
    </view>
  </view>
</template>
