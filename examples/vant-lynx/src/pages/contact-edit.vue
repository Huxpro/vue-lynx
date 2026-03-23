<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DemoBlock from '../components/DemoBlock/index.vue';
import ContactEdit from '../components/ContactEdit/index.vue';
import type { ContactEditInfo } from '../components/ContactEdit/types';

const editingContact = ref<ContactEditInfo>({
  tel: '',
  name: '',
});

const onSave = (info: ContactEditInfo) => {
  console.log('save', info);
};

const onDelete = (info: ContactEditInfo) => {
  console.log('delete', info);
};
</script>

<template>
  <DemoPage title="ContactEdit 联系人编辑">
    <DemoBlock title="基础用法">
      <ContactEdit
        is-edit
        show-set-default
        :contact-info="editingContact"
        set-default-label="设为默认联系人"
        @save="onSave"
        @delete="onDelete"
      />
    </DemoBlock>
  </DemoPage>
</template>
