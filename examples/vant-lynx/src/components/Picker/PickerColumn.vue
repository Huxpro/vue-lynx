<!--
  PickerColumn — scrollable column sub-component matching Vant's PickerColumn.tsx
  Uses transform: translateY() for GPU-composited animation, with momentum/inertia scrolling.
-->
<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue-lynx';
import { useTouch } from '../../composables/useTouch';
import { createNamespace } from '../../utils/create';
import type { Numeric } from '../../utils/format';
import type { PickerOption, PickerFieldNames } from './types';
import { findIndexOfEnabledOption, getFirstEnabledOption, isOptionExist } from './utils';

const [, bem] = createNamespace('picker-column');

const DEFAULT_DURATION = 200;
const MOMENTUM_TIME = 300;
const MOMENTUM_DISTANCE = 15;

const props = defineProps<{
  value?: Numeric;
  fields: Required<PickerFieldNames>;
  options: PickerOption[];
  readonly?: boolean;
  allowHtml?: boolean;
  optionHeight: number;
  swipeDuration: Numeric;
  visibleOptionNum: Numeric;
}>();

const emit = defineEmits<{
  change: [value: Numeric];
  clickOption: [option: PickerOption];
  scrollInto: [option: PickerOption];
}>();

const touch = useTouch();
const currentOffset = ref(0);
const currentDuration = ref(0);
const moving = ref(false);
let transitionEndTrigger: (() => void) | null = null;
let touchStartTime = 0;
let momentumOffset = 0;
let prevScrollIndex = -1;

const count = computed(() => props.options.length);

const baseOffset = computed(
  () => (props.optionHeight * (+props.visibleOptionNum - 1)) / 2,
);

function getOptionText(option: PickerOption): string {
  const text = option[props.fields.text];
  return text !== undefined && text !== null ? String(text) : '';
}

function getOptionValue(option: PickerOption): Numeric {
  return option[props.fields.value] ?? '';
}

function getIndexByOffset(offset: number): number {
  return Math.max(
    0,
    Math.min(count.value - 1, Math.round(-offset / props.optionHeight)),
  );
}

function updateValueByIndex(index: number) {
  index = findIndexOfEnabledOption(props.options, index);
  const offset = -index * props.optionHeight;

  if (moving.value && offset !== currentOffset.value) {
    transitionEndTrigger = () => {
      const option = props.options[index];
      if (option) {
        emit('change', getOptionValue(option));
      }
    };
  }

  currentOffset.value = offset;

  // If not moving, emit immediately
  if (!moving.value) {
    const option = props.options[index];
    if (option && getOptionValue(option) !== props.value) {
      emit('change', getOptionValue(option));
    }
  }
}

function momentum(distance: number, duration: number) {
  const speed = Math.abs(distance / duration);
  const swipeDuration = +props.swipeDuration;

  distance = currentOffset.value + (speed / 0.003) * (distance > 0 ? 1 : -1);

  const index = getIndexByOffset(distance);
  currentDuration.value = swipeDuration;
  updateValueByIndex(index);
}

function stopMomentum() {
  moving.value = false;
  currentDuration.value = 0;

  if (transitionEndTrigger) {
    transitionEndTrigger();
    transitionEndTrigger = null;
  }
}

function onTouchStart(event: any) {
  if (props.readonly) return;

  touch.start(event);
  touchStartTime = Date.now();
  momentumOffset = currentOffset.value;
  currentDuration.value = 0;

  if (moving.value) {
    // If momentum is in progress, stop at current position
    // We approximate the current visual position since getComputedStyle
    // is not available in Lynx background thread
    moving.value = false;
    transitionEndTrigger = null;
  }

  prevScrollIndex = -1;
}

function onTouchMove(event: any) {
  if (props.readonly) return;

  touch.move(event);

  if (touch.isVertical()) {
    moving.value = true;
    const newOffset = momentumOffset + touch.deltaY.value;

    // Clamp with rubber band effect
    const minOffset = -(count.value * props.optionHeight);
    const maxOffset = props.optionHeight;
    currentOffset.value = Math.max(minOffset, Math.min(maxOffset, newOffset));

    // Track momentum timing
    const now = Date.now();
    if (now - touchStartTime > MOMENTUM_TIME) {
      touchStartTime = now;
      momentumOffset = currentOffset.value;
    }

    // Emit scrollInto when nearest option changes
    const index = getIndexByOffset(currentOffset.value);
    if (index !== prevScrollIndex && index >= 0 && index < count.value) {
      prevScrollIndex = index;
      const option = props.options[index];
      if (option) {
        emit('scrollInto', option);
      }
    }
  }
}

function onTouchEnd() {
  if (props.readonly) return;

  const duration = Date.now() - touchStartTime;
  const distance = currentOffset.value - momentumOffset;
  const allowMomentum =
    duration < MOMENTUM_TIME && Math.abs(distance) > MOMENTUM_DISTANCE;

  if (allowMomentum) {
    momentum(distance, duration);
    return;
  }

  const index = getIndexByOffset(currentOffset.value);
  currentDuration.value = DEFAULT_DURATION;
  updateValueByIndex(index);

  // Ensure moving is eventually cleared
  setTimeout(() => {
    moving.value = false;
  }, DEFAULT_DURATION);
}

function onClickOption(index: number) {
  if (moving.value || props.readonly) return;

  const option = props.options[index];
  if (option && !option.disabled) {
    transitionEndTrigger = null;
    currentDuration.value = DEFAULT_DURATION;
    updateValueByIndex(index);
    emit('clickOption', option);

    // Emit scrollInto on click
    emit('scrollInto', option);
  }
}

// Handle transitionEnd to fire deferred change
function onTransitionEnd() {
  stopMomentum();
}

// Sync offset with external value prop
watchEffect(() => {
  if (moving.value) return;

  const index = props.options.findIndex(
    (option) => getOptionValue(option) === props.value,
  );

  const enabledIndex = findIndexOfEnabledOption(
    props.options,
    index !== -1 ? index : 0,
  );
  const offset = -enabledIndex * props.optionHeight;

  if (offset !== currentOffset.value) {
    currentDuration.value = 0;
    currentOffset.value = offset;
  }
});

// When options change, reset to valid index
watch(
  () => props.options,
  () => {
    if (moving.value) return;

    if (
      props.value !== undefined &&
      !isOptionExist(props.options, props.value, props.fields)
    ) {
      const firstEnabled = getFirstEnabledOption(props.options);
      if (firstEnabled) {
        emit('change', getOptionValue(firstEnabled));
      }
    }
  },
);

const wrapperStyle = computed(() => ({
  transform: `translateY(${currentOffset.value + baseOffset.value}px)`,
  transitionDuration: `${currentDuration.value}ms`,
  transitionProperty: currentDuration.value ? 'transform' : 'none',
  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.68, 1)',
}));

defineExpose({ stopMomentum });
</script>

<template>
  <view
    :class="bem()"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view
      :class="bem('wrapper')"
      :style="wrapperStyle"
      @transitionend="onTransitionEnd"
    >
      <view
        v-for="(option, index) in options"
        :key="index"
        :class="bem('item', { disabled: option.disabled })"
        :style="{ height: `${optionHeight}px` }"
        @tap="onClickOption(index)"
      >
        <slot
          name="option"
          :option="option"
          :index="index"
        >
          <text :class="bem('item-text')">{{ getOptionText(option) }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
