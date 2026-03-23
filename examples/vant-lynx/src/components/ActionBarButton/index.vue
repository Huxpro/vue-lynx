<!--
  Lynx Limitations:
  - to/url/replace: No vue-router in Lynx; route props accepted for API compat but no-op
  - Wraps our Button component matching Vant's pattern
-->
<script setup lang="ts">
import { computed, inject } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Button from '../Button/index.vue';
import { ACTION_BAR_KEY } from '../ActionBar/types';
import type { ButtonType } from '../Button/types';
import './index.less';

export interface ActionBarButtonProps {
  type?: ButtonType;
  text?: string;
  icon?: string;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  to?: string | Record<string, unknown>;
  url?: string;
  replace?: boolean;
}

const props = withDefaults(defineProps<ActionBarButtonProps>(), {
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const [, bem] = createNamespace('action-bar-button');

const parent = inject(ACTION_BAR_KEY, null);
let childIndex = -1;
if (parent) {
  childIndex = parent.registerChild({ isButton: true });
}

const isFirst = computed(() => {
  if (parent && childIndex >= 0) {
    const prev = parent.children[childIndex - 1];
    return !(prev && prev.isButton);
  }
  return true;
});

const isLast = computed(() => {
  if (parent && childIndex >= 0) {
    const next = parent.children[childIndex + 1];
    return !(next && next.isButton);
  }
  return true;
});

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <Button
    :class="bem([type, { last: isLast, first: isFirst }])"
    size="large"
    :type="type"
    :icon="icon"
    :color="color"
    :loading="loading"
    :disabled="disabled"
    @click="onTap"
  >
    <slot>{{ text }}</slot>
  </Button>
</template>
