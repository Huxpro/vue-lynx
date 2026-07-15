<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import UButton from '../ui/UButton.vue';
import ModalShell from './ModalShell.vue';

/** Port of app/components/ModalRename.vue. */
const props = defineProps<{ title?: string }>();

const emit = defineEmits<{ close: [result: string | false] }>();

const value = ref(props.title ?? '');
const trimmed = computed(() => value.value.trim());

function onInput(e: { detail?: { value?: string } }) {
  value.value = e.detail?.value ?? '';
}

function submit() {
  if (!trimmed.value) return;
  emit('close', trimmed.value);
}
</script>

<template>
  <ModalShell
    title="Rename chat"
    description="Choose a new title for this chat."
    :close="false"
    @dismiss="emit('close', false)"
  >
    <view class="rounded-md bg-default border border-accented px-3 py-2.5">
      <input
        :value="value"
        placeholder="Chat title"
        confirm-type="done"
        class="text-base text-highlighted w-full chat-input"
        @input="onInput"
        @confirm="submit"
      />
    </view>

    <template #footer>
      <UButton label="Save" :disabled="!trimmed" @tap="submit" />
      <UButton color="neutral" variant="ghost" label="Cancel" @tap="emit('close', false)" />
    </template>
  </ModalShell>
</template>
