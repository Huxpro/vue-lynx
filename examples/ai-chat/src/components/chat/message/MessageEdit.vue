<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue-lynx';
import type { ShadowElement } from 'vue-lynx';

import { useNativeInputValue } from '../../../composables/useNativeInputValue';
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
const inputRef = useTemplateRef<ShadowElement>('inputRef');
useNativeInputValue(inputRef, () => editingText.value);
const canSave = computed(
  () => editingText.value.trim().length > 0 && editingText.value !== props.text,
);

</script>

<template>
  <view class="flex flex-col gap-2 w-full">
    <input
      ref="inputRef"
      v-model="editingText"
      class="edit-input text-base text-highlighted"
      confirm-type="done"
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
