<script setup lang="ts">
import { createNamespace } from '../../utils/create';
import Cell from '../Cell/index.vue';
import Radio from '../Radio/index.vue';
import Tag from '../Tag/index.vue';
import Icon from '../Icon/index.vue';
import type { ContactListItem } from './types';

export interface ContactListItemProps {
  contact: ContactListItem;
  checked: boolean;
  disabled?: boolean;
  defaultTagText?: string;
}

const props = withDefaults(defineProps<ContactListItemProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  select: [contact: ContactListItem];
  edit: [contact: ContactListItem];
}>();

const [, bem] = createNamespace('contact-list-item');

const onEdit = () => {
  emit('edit', props.contact);
};

const onSelect = () => {
  if (!props.disabled) {
    emit('select', props.contact);
  }
};
</script>

<template>
  <Cell
    :class="bem({ disabled })"
    is-link
    center
    @click="onSelect"
  >
    <template #icon>
      <Radio
        :class="bem('radio')"
        :name="contact.id"
        :model-value="checked"
        :disabled="disabled"
        @click.stop
      />
    </template>
    <template #title>
      <text>{{ contact.name }}，{{ contact.tel }}</text>
      <Tag
        v-if="contact.isDefault && defaultTagText"
        type="primary"
        round
        :class="bem('tag')"
      >
        {{ defaultTagText }}
      </Tag>
    </template>
    <template #right-icon>
      <Icon name="edit" :class="bem('edit')" @click.stop="onEdit" />
    </template>
  </Cell>
</template>
