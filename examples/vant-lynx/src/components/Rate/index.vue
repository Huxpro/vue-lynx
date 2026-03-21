<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface RateProps {
  modelValue?: number;
  count?: number;
  size?: number;
  gutter?: number;
  color?: string;
  voidColor?: string;
  disabled?: boolean;
  readonly?: boolean;
  allowHalf?: boolean;
}

const props = withDefaults(defineProps<RateProps>(), {
  modelValue: 0,
  count: 5,
  size: 20,
  gutter: 4,
  color: '#ee0a24',
  voidColor: '#c8c9cc',
  disabled: false,
  readonly: false,
  allowHalf: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

type StarStatus = 'full' | 'half' | 'void';

const stars = computed(() => {
  const result: { status: StarStatus; index: number }[] = [];
  for (let i = 1; i <= props.count; i++) {
    if (props.modelValue >= i) {
      result.push({ status: 'full', index: i });
    } else if (props.allowHalf && props.modelValue + 0.5 >= i) {
      result.push({ status: 'half', index: i });
    } else {
      result.push({ status: 'void', index: i });
    }
  }
  return result;
});

function getStarColor(status: StarStatus): string {
  return status === 'void' ? props.voidColor : props.color;
}

function onSelectFull(index: number) {
  if (props.disabled || props.readonly) return;
  const newValue = index === props.modelValue ? 0 : index;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}

function onSelectHalf(index: number) {
  if (props.disabled || props.readonly) return;
  const value = index - 0.5;
  const newValue = value === props.modelValue ? 0 : value;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', opacity: disabled ? 0.5 : 1 }">
    <view
      v-for="star in stars"
      :key="star.index"
      :style="{
        position: 'relative',
        marginRight: star.index < count ? gutter : 0,
      }"
      @tap="onSelectFull(star.index)"
    >
      <text
        :style="{
          fontSize: size,
          color: getStarColor(star.status),
          lineHeight: size,
        }"
      >{{ star.status === 'void' ? '\u2606' : '\u2605' }}</text>
      <view
        v-if="allowHalf"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          overflow: 'hidden',
        }"
        @tap.stop="onSelectHalf(star.index)"
      >
        <text
          :style="{
            fontSize: size,
            color: star.status !== 'void' ? color : voidColor,
            lineHeight: size,
          }"
        >{{ star.status !== 'void' ? '\u2605' : '\u2606' }}</text>
      </view>
    </view>
  </view>
</template>
