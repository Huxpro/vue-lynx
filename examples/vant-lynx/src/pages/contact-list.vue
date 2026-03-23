<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ContactList from '../components/ContactList/index.vue';

const chosenContactId = ref('1');

const list = [
  {
    id: '1',
    name: '张三',
    tel: '13000000000',
    isDefault: true,
  },
  {
    id: '2',
    name: '李四',
    tel: '13100000000',
  },
];

function onAdd() {
  console.log('add');
}

function onEdit(contact: any, index: number) {
  console.log('edit', contact.id, index);
}

function onSelect(contact: any, index: number) {
  console.log('select', contact.id, index);
}
</script>

<template>
  <DemoPage title="ContactList 联系人列表">
    <!-- 基础用法 -->
    <ContactList
      v-model="chosenContactId"
      :list="list"
      default-tag-text="默认"
      @add="onAdd"
      @edit="onEdit"
      @select="onSelect"
    />
  </DemoPage>
</template>
