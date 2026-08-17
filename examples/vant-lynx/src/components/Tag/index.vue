<!--
  Vant Feature Parity Report (Tag):
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/tag/Tag.tsx
  - Props: 9/9 supported (type, size, color, plain, round, mark, textColor, closeable, show)
  - Events: 2/2 supported (click, close)
  - Slots: 1/1 supported (default)
  - Sub-components: Icon (cross) for closeable
  - Shapes: round, mark (right-side rounded), default (2px radius)
  - Sizes: Vant has default (no size), medium, large. We map all three.
  - Plain mode: white background with colored border and text
  - Show/hide: v-if controlled (no CSS transition in Lynx)
  - Gaps:
    - No CSS transition for show/hide (Lynx does not support Vue Transition component)
    - No CSS variable theming (inline styles only in Lynx)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface TagProps {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'large' | 'medium';
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
  click: [event: any];
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
// In Vant, default (no size prop) is the smallest; medium and large are explicit.
const sizeConfig: Record<string, { fontSize: number; padding: number; paddingH: number; lineHeight: number; radius?: number }> = {
  default: { fontSize: 12, padding: 0, paddingH: 4, lineHeight: 16 },
  medium: { fontSize: 12, padding: 2, paddingH: 6, lineHeight: 16 },
  large: { fontSize: 14, padding: 4, paddingH: 8, lineHeight: 20, radius: 4 },
};

const ROUND_RADIUS = 999;
const DEFAULT_RADIUS = 2;

const resolvedSize = computed(() => {
  // Vant only defines medium and large; anything else (including undefined) maps to default
  if (props.size === 'medium' || props.size === 'large') return props.size;
  return 'default';
});

const tagStyle = computed(() => {
  const typeColor = typeColorMap[props.type] || typeColorMap.default;
  const bgColor = props.color || typeColor;
  const sc = sizeConfig[resolvedSize.value];
  const baseRadius = sc.radius ?? DEFAULT_RADIUS;

  // Determine border-radius based on shape props
  // round and mark are independent in Vant; round takes full pill shape,
  // mark zeros the left side and rounds the right side
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
    // Mark shape: left side square (0), right side fully rounded
    borderTopLeftRadius = 0;
    borderBottomLeftRadius = 0;
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
    borderWidth: props.plain ? 1 : 0,
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

  // textColor prop takes highest priority
  // In plain mode: text color defaults to the type/custom color
  // In filled mode: text color defaults to white
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

function onTap(event: any) {
  emit('click', event);
}

function onClose(event: any) {
  event.stopPropagation?.();
  emit('close', event);
}
</script>

<template>
  <view v-if="show" :style="tagStyle" @tap="onTap">
    <slot />
    <view v-if="closeable" :style="{ marginLeft: 2 }" @tap="onClose">
      <Icon name="cross" :size="closeIconSize" :color="resolvedTextColor" />
    </view>
  </view>
</template>
