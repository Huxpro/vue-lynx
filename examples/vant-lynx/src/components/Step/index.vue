<!--
  Vant Feature Parity Report:
  - Props: 1/1 (index)
  - Events: via parent Steps click-step
  - Slots: 1/3 (default; missing: active-icon, inactive-icon, finish-icon)
  - inject: ✅ from Steps parent
  - Gaps:
    - No custom icon slots
    - Uses text characters instead of Icon component for finish/active icons
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface StepProps {
  index?: number;
}

const props = withDefaults(defineProps<StepProps>(), {
  index: 0,
});

const steps = inject<{
  active: Ref<number>;
  direction: Ref<'horizontal' | 'vertical'>;
  activeColor: Ref<string>;
  inactiveColor: Ref<string>;
  activeIcon: Ref<string | undefined>;
  finishIcon: Ref<string | undefined>;
  onClickStep: (index: number) => void;
}>('steps')!;

const status = computed(() => {
  const active = steps.active.value;
  if (props.index < active) return 'finish';
  if (props.index === active) return 'process';
  return 'waiting';
});

const isHorizontal = computed(() => steps.direction.value === 'horizontal');

const circleColor = computed(() => {
  if (status.value === 'waiting') return steps.inactiveColor.value;
  return steps.activeColor.value;
});

const textColor = computed(() => {
  if (status.value === 'waiting') return steps.inactiveColor.value;
  if (status.value === 'process') return steps.activeColor.value;
  return '#323233';
});

const lineColor = computed(() => {
  if (status.value === 'finish') return steps.activeColor.value;
  return '#ebedf0';
});

const stepStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: isHorizontal.value ? ('column' as const) : ('row' as const),
  alignItems: isHorizontal.value ? 'center' : 'flex-start',
}));

const iconAreaStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}));

const circleStyle = computed(() => ({
  width: status.value === 'process' ? 16 : 8,
  height: status.value === 'process' ? 16 : 8,
  borderRadius: status.value === 'process' ? 8 : 4,
  backgroundColor: status.value === 'process' ? steps.activeColor.value : 'transparent',
  borderWidth: status.value === 'process' ? 0 : 1,
  borderStyle: 'solid' as const,
  borderColor: circleColor.value,
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}));

const finishIconStyle = computed(() => ({
  fontSize: 12,
  color: steps.activeColor.value,
}));

const lineStyle = computed(() => {
  if (isHorizontal.value) {
    return {
      flex: 1,
      height: 1,
      backgroundColor: lineColor.value,
    };
  }
  return {
    width: 1,
    flex: 1,
    backgroundColor: lineColor.value,
    marginLeft: status.value === 'process' ? 7.5 : 3.5,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 20,
  };
});

const textStyle = computed(() => ({
  fontSize: 12,
  color: textColor.value,
  marginTop: isHorizontal.value ? 8 : 0,
  marginLeft: isHorizontal.value ? 0 : 8,
  lineHeight: 18,
}));

function onTap() {
  steps.onClickStep(props.index);
}
</script>

<template>
  <view :style="stepStyle" @tap="onTap">
    <!-- Icon + line row (horizontal) -->
    <view v-if="isHorizontal" :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }">
      <view :style="lineStyle" v-if="index > 0" />
      <view :style="iconAreaStyle">
        <view :style="circleStyle">
          <text v-if="status === 'finish' && steps.finishIcon.value" :style="finishIconStyle">{{ steps.finishIcon.value }}</text>
          <text v-else-if="status === 'finish'" :style="finishIconStyle">&#10003;</text>
          <text v-else-if="status === 'process' && steps.activeIcon.value" :style="{ fontSize: 10, color: '#fff' }">{{ steps.activeIcon.value }}</text>
        </view>
      </view>
      <view :style="lineStyle" v-if="index < 999" />
    </view>

    <!-- Vertical layout -->
    <view v-else :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
      <view :style="iconAreaStyle">
        <view :style="circleStyle">
          <text v-if="status === 'finish' && steps.finishIcon.value" :style="finishIconStyle">{{ steps.finishIcon.value }}</text>
          <text v-else-if="status === 'finish'" :style="finishIconStyle">&#10003;</text>
          <text v-else-if="status === 'process' && steps.activeIcon.value" :style="{ fontSize: 10, color: '#fff' }">{{ steps.activeIcon.value }}</text>
        </view>
      </view>
      <view :style="lineStyle" />
    </view>

    <!-- Text content -->
    <text :style="textStyle">
      <slot />
    </text>
  </view>
</template>
