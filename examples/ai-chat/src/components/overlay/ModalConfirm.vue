<script setup lang="ts">
import UButton from '../ui/UButton.vue';
import ModalShell from './ModalShell.vue';

/** Port of app/components/ModalConfirm.vue (delete confirmation). */
defineProps<{
  title: string;
  description: string;
  color?: 'error' | 'success' | 'neutral';
}>();

const emit = defineEmits<{ close: [result: boolean] }>();
</script>

<template>
  <ModalShell :title="title" :description="description" :close="false" :dismissible="false">
    <template #footer>
      <UButton :color="color ?? 'error'" label="Delete" @tap="emit('close', true)" />
      <UButton color="neutral" variant="ghost" label="Cancel" @tap="emit('close', false)" />
    </template>
  </ModalShell>
</template>
