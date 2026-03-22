<!--
  Lynx Limitations:
  - Vue <Transition>: Lynx does not support Vue Transition component; show/hide uses v-if without animation
  - CSS class-based styling: Lynx uses inline styles; CSS variables in index.less are defined for theming reference only
  - ::before pseudo-element: Plain mode border uses borderWidth/borderColor inline styles instead of ::before
  - ::after pseudo-element: Mark mode 2px spacer not rendered (visual-only detail)
  - HAPTICS_FEEDBACK: No haptic feedback on close icon tap in Lynx
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import type { TagType, TagSize } from './types';

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

// Vant type -> background color mapping
const typeColorMap: Record<string, string> = {
  default: '#969799',
  primary: '#1989fa',
  success: '#07c160',
  warning: '#ff976a',
  danger: '#ee0a24',
};

// Vant size configs
const sizeConfig: Record<string, { fontSize: string; padding: string; paddingH: string; lineHeight: string; radius?: string }> = {
  default: { fontSize: '12px', padding: '0px', paddingH: '4px', lineHeight: '16px' },
  medium: { fontSize: '12px', padding: '2px', paddingH: '6px', lineHeight: '16px' },
  large: { fontSize: '14px', padding: '4px', paddingH: '8px', lineHeight: '20px', radius: '4px' },
};

const ROUND_RADIUS = '999px';
const DEFAULT_RADIUS = '2px';

const resolvedSize = computed(() => {
  if (props.size === 'medium' || props.size === 'large') return props.size;
  return 'default';
});

const tagStyle = computed(() => {
  const typeColor = typeColorMap[props.type] || typeColorMap.default;
  const bgColor = props.color || typeColor;
  const sc = sizeConfig[resolvedSize.value];
  const baseRadius = sc.radius ?? DEFAULT_RADIUS;

  let borderTopLeftRadius = baseRadius;
  let borderTopRightRadius = baseRadius;
  let borderBottomLeftRadius = baseRadius;
  let borderBottomRightRadius = baseRadius;

  if (props.round) {
    borderTopLeftRadius = ROUND_RADIUS;
    borderTopRightRadius = ROUND_RADIUS;
    borderBottomLeftRadius = ROUND_RADIUS;
    borderBottomRightRadius = ROUND_RADIUS;
  } else if (props.mark) {
    borderTopLeftRadius = '0px';
    borderBottomLeftRadius = '0px';
    borderTopRightRadius = ROUND_RADIUS;
    borderBottomRightRadius = ROUND_RADIUS;
  }

  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingTop: sc.padding,
    paddingBottom: sc.padding,
    paddingLeft: sc.paddingH,
    paddingRight: sc.paddingH,
    backgroundColor: props.plain ? '#fff' : bgColor,
    borderWidth: props.plain ? '1px' : '0px',
    borderStyle: 'solid' as const,
    borderColor: props.plain ? bgColor : 'transparent',
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  };
});

const resolvedTextColor = computed(() => {
  const typeColor = typeColorMap[props.type] || typeColorMap.default;
  if (props.textColor) return props.textColor;
  if (props.plain) return props.color || typeColor;
  return '#fff';
});

const textStyle = computed(() => {
  const sc = sizeConfig[resolvedSize.value];
  return {
    fontSize: sc.fontSize,
    lineHeight: sc.lineHeight,
    color: resolvedTextColor.value,
  };
});

const closeIconSize = computed(() => {
  return sizeConfig[resolvedSize.value].fontSize;
});

function onClose(event: any) {
  event.stopPropagation?.();
  emit('close', event);
}
</script>

<template>
  <view v-if="show" :style="tagStyle">
    <text :style="textStyle"><slot /></text>
    <view v-if="closeable" :style="{ marginLeft: '2px' }" @tap="onClose">
      <Icon name="cross" :size="closeIconSize" :color="resolvedTextColor" />
    </view>
  </view>
</template>
