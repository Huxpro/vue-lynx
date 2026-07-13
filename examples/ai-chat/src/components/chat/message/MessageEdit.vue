<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import type { UIMessage } from '../../../types/ai';
import UButton from '../../ui/UButton.vue';

/** Port of app/components/chat/message/MessageEdit.vue (UTextarea -> input). */
const props = defineProps<{
  message: UIMessage;
  text: string;
}>();

const emit = defineEmits<{
  save: [message: UIMessage, text: string];
  cancel: [];
}>();

const editingText = ref(props.text);
const canSave = computed(
  () => editingText.value.trim().length > 0 && editingText.value !== props.text,
);

function onInput(e: { detail?: { value?: string } }) {
  editingText.value = e.detail?.value ?? '';
}
</script>

<template>
  <view class="flex flex-col gap-2 w-full">
    <input
      :value="editingText"
      class="edit-input text-base text-highlighted"
      confirm-type="done"
      @input="onInput"
      @confirm="canSave && emit('save', message, editingText)"
    />

    <view class="flex flex-row justify-end gap-1.5">
      <UButton size="sm" variant="soft" color="neutral" label="Cancel" @tap="emit('cancel')" />
      <UButton
        size="sm"
        color="neutral"
        label="Save"
        :disabled="!canSave"
        @tap="emit('save', message, editingText)"
      />
    </view>
  </view>
</template>

<style>
.edit-input {
  height: 36px;
  width: 100%;
  background-color: transparent;
  border: none;
  color: var(--ui-text-highlighted);
  caret-color: var(--ui-primary);
}
</style>
