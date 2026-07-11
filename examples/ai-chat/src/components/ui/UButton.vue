<script setup lang="ts">
import { computed } from 'vue-lynx';

import Icon from './Icon.vue';

/**
 * Lynx re-implementation of the UButton subset the template uses.
 * No hover/focus states (not supported by Lynx CSS) — press feedback is
 * omitted, matching PRD's styling constraints note.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    icon?: string;
    trailingIcon?: string;
    color?: 'primary' | 'neutral' | 'error' | 'success';
    variant?: 'solid' | 'ghost' | 'outline' | 'soft' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    square?: boolean;
    block?: boolean;
    disabled?: boolean;
    active?: boolean;
    round?: boolean;
  }>(),
  { color: 'primary', variant: 'solid', size: 'md' },
);

const emit = defineEmits<{ tap: [] }>();

const SIZES = {
  xs: { pad: 'px-2 py-1', text: 'text-xs', icon: 14, gap: 'gap-1' },
  sm: { pad: 'px-2.5 py-1.5', text: 'text-sm', icon: 16, gap: 'gap-1.5' },
  md: { pad: 'px-3 py-2', text: 'text-sm', icon: 18, gap: 'gap-1.5' },
  lg: { pad: 'px-3.5 py-2.5', text: 'text-base', icon: 20, gap: 'gap-2' },
  xl: { pad: 'px-4 py-3', text: 'text-base', icon: 22, gap: 'gap-2' },
} as const;

const classes = computed(() => {
  const s = SIZES[props.size];
  const list: string[] = [
    'flex flex-row items-center justify-center',
    props.round ? 'rounded-full' : 'rounded-md',
    s.gap,
    props.square ? squarePad.value : s.pad,
  ];
  if (props.block) list.push('w-full');
  if (props.disabled) list.push('opacity-50');

  const key = `${props.color}:${props.variant}`;
  const styles: Record<string, string> = {
    'primary:solid': 'bg-primary',
    'primary:ghost': '',
    'primary:soft': 'bg-elevated',
    'primary:link': '',
    'neutral:solid': 'bg-inverted',
    'neutral:ghost': props.active ? 'bg-elevated' : '',
    'neutral:soft': 'bg-elevated',
    'neutral:outline': 'ring-1 border border-accented',
    'neutral:link': '',
    'error:solid': 'bg-error',
    'error:ghost': '',
  };
  list.push(styles[key] ?? '');
  return list.join(' ');
});

const squarePad = computed(() => {
  const map = { xs: 'p-1', sm: 'p-1.5', md: 'p-2', lg: 'p-2.5', xl: 'p-3' } as const;
  return map[props.size];
});

const labelClass = computed(() => {
  const s = SIZES[props.size];
  const key = `${props.color}:${props.variant}`;
  const colors: Record<string, string> = {
    'primary:solid': 'text-inverted',
    'primary:ghost': 'text-primary',
    'primary:soft': 'text-primary',
    'primary:link': 'text-primary',
    'neutral:solid': 'text-inverted',
    'neutral:ghost': 'text-default',
    'neutral:soft': 'text-default',
    'neutral:outline': 'text-default',
    'neutral:link': 'text-muted',
    'error:solid': 'text-inverted',
    'error:ghost': 'text-error',
  };
  return `${s.text} font-medium ${colors[key] ?? 'text-default'}`;
});

const iconTone = computed(() => {
  const key = `${props.color}:${props.variant}`;
  const tones: Record<string, string> = {
    'primary:solid': 'inverted',
    'primary:ghost': 'primary',
    'primary:soft': 'primary',
    'primary:link': 'primary',
    'neutral:solid': 'inverted',
    'neutral:ghost': 'default',
    'neutral:soft': 'default',
    'neutral:outline': 'default',
    'neutral:link': 'muted',
    'error:solid': 'inverted',
    'error:ghost': 'error',
  };
  return tones[key] ?? 'default';
});

const iconSize = computed(() => SIZES[props.size].icon);

function onTap() {
  if (!props.disabled) emit('tap');
}
</script>

<template>
  <view :class="classes" @tap="onTap">
    <Icon v-if="icon" :name="icon" :tone="iconTone" :size="iconSize" />
    <slot />
    <text v-if="label" :class="labelClass">{{ label }}</text>
    <Icon v-if="trailingIcon" :name="trailingIcon" :tone="iconTone" :size="iconSize" />
  </view>
</template>
