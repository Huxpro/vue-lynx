<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface TagProps {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'large' | 'medium' | 'small';
  plain?: boolean;
  round?: boolean;
  mark?: boolean;
  closeable?: boolean;
  show?: boolean;
  color?: string;
  textColor?: string;
}

const props = withDefaults(defineProps<TagProps>(), {
  type: 'default',
  size: 'small',
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

const typeConfig = {
  default: { bg: '#969799', color: '#fff' },
  primary: { bg: '#1989fa', color: '#fff' },
  success: { bg: '#07c160', color: '#fff' },
  warning: { bg: '#ff976a', color: '#fff' },
  danger: { bg: '#ee0a24', color: '#fff' },
};

const sizeConfig = {
  large: { fontSize: 14, padding: 4, paddingH: 8 },
  medium: { fontSize: 12, padding: 2, paddingH: 6 },
  small: { fontSize: 10, padding: 0, paddingH: 4 },
};

const tagStyle = computed(() => {
  if (!props.show) return { display: 'none' };

  const tc = typeConfig[props.type];
  const sc = sizeConfig[props.size];
  const bg = props.color || tc.bg;

  return {
    display: 'inline-flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingTop: sc.padding,
    paddingBottom: sc.padding,
    paddingLeft: sc.paddingH,
    paddingRight: sc.paddingH,
    backgroundColor: props.plain ? '#fff' : bg,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: bg,
    borderRadius: props.round ? 999 : (props.mark ? 0 : 2),
    borderTopLeftRadius: props.mark ? 0 : undefined,
    borderBottomLeftRadius: props.mark ? 0 : undefined,
    borderTopRightRadius: props.mark ? 999 : undefined,
    borderBottomRightRadius: props.mark ? 999 : undefined,
  };
});

const textStyle = computed(() => {
  const tc = typeConfig[props.type];
  const sc = sizeConfig[props.size];
  const bg = props.color || tc.bg;

  return {
    fontSize: sc.fontSize,
    color: props.textColor || (props.plain ? bg : tc.color),
    lineHeight: sc.fontSize * 1.4,
  };
});

function onTap(event: any) {
  emit('click', event);
}

function onClose(event: any) {
  emit('close', event);
}
</script>

<template>
  <view v-if="show" :style="tagStyle" @tap="onTap">
    <slot />
    <text
      v-if="closeable"
      :style="{ ...textStyle, marginLeft: 2 }"
      @tap="onClose"
    >&times;</text>
  </view>
</template>
