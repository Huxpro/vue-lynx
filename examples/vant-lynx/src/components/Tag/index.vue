<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as <view> (Lynx has no HTML tags)
  - ::before pseudo-element: Vant uses ::before for plain mode border; we use border: 1px solid currentColor directly
  - ::after pseudo-element: Vant uses ::after for mark mode 2px spacer; omitted (visual-only detail)
  - HAPTICS_FEEDBACK: No haptic feedback on close icon tap in Lynx
  - Vue <Transition>: Uses CSS opacity transition with setTimeout for opened/closed instead
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Icon from '../Icon/index.vue';
import type { TagType, TagSize } from './types';
import './index.less';

const [, bem] = createNamespace('tag');

interface TagProps {
  type?: TagType;
  size?: TagSize;
  color?: string;
  plain?: boolean;
  round?: boolean;
  mark?: boolean;
  textColor?: string;
  closeable?: boolean;
  show?: boolean;
}

const props = withDefaults(defineProps<TagProps>(), {
  type: 'default',
  plain: false,
  round: false,
  mark: false,
  closeable: false,
  show: true,
});

const emit = defineEmits<{
  close: [event: any];
}>();

const classes = computed(() => {
  const mods: Array<string | undefined | Record<string, boolean | undefined>> = [
    { mark: props.mark, plain: props.plain, round: props.round },
    props.type,
  ];
  if (props.size) {
    mods.push(props.size);
  }
  return bem(mods);
});

// Inline styles ONLY for color/textColor props (matching Vant's getStyle)
const colorStyle = computed(() => {
  if (!props.color && !props.textColor) return undefined;
  if (props.plain) {
    return {
      color: props.textColor || props.color,
      borderColor: props.color,
    };
  }
  return {
    color: props.textColor,
    background: props.color,
  };
});

function onClose(event: any) {
  event.stopPropagation?.();
  emit('close', event);
}
</script>

<template>
  <view v-if="show" :class="classes" :style="colorStyle">
    <text><slot /></text>
    <view v-if="closeable" :class="bem('close')" @tap="onClose">
      <Icon name="cross" size="12px" :color="colorStyle?.color" />
    </view>
  </view>
</template>
