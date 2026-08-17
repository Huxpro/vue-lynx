<script setup lang="ts">
import { computed } from 'vue-lynx';

import { useModels } from '../composables/useModels';
import { useOverlay } from '../composables/useOverlay';
import Icon from './ui/Icon.vue';

/** Port of app/components/ModelSelect.vue — USelectMenu becomes a sheet. */
const { model, models } = useModels();
const overlay = useOverlay();

const current = computed(() => models.find((m) => m.value === model.value));

async function openPicker() {
  const instance = overlay.open<string | false>('menu', {
    title: 'Model',
    groups: [
      models.map((m) => ({
        label: m.label,
        value: m.value,
        icon: m.icon,
        checked: m.value === model.value,
      })),
    ],
  });
  const choice = await instance.result;
  if (choice) model.value = choice;
}
</script>

<template>
  <view class="flex flex-row items-center gap-1.5 rounded-md px-2 py-1.5" @tap="openPicker">
    <Icon v-if="current" :name="current.icon" tone="muted" :size="14" />
    <text class="text-sm text-muted">{{ current?.label }}</text>
    <Icon name="i-lucide-chevron-down" tone="dimmed" :size="14" />
  </view>
</template>
