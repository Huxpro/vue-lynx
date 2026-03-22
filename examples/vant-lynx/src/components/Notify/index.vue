<!--
  Vant Feature Parity Report:
  - Props: 9/11 supported (show, type, message, color, background, duration, position, className [accepted but N/A], zIndex)
  - Missing: lockScroll (N/A in Lynx - no body scroll), teleport (N/A in Lynx)
  - Events: 4/4 supported (update:show, click, opened, close)
  - Slots: 1/1 (default)
  - Auto-close: Timer-based auto-close using duration prop (0 = no auto-close)
  - Position: top/bottom support
  - Animation: Slide from top/bottom using CSS transition on transform (no Transition + v-show)
-->
<script setup lang="ts">
import { computed, watch, ref, onBeforeUnmount, useSlots } from 'vue-lynx';

export type NotifyType = 'primary' | 'success' | 'warning' | 'danger';
export type NotifyPosition = 'top' | 'bottom';

export interface NotifyProps {
  show?: boolean;
  type?: NotifyType;
  message?: string | number;
  duration?: number;
  color?: string;
  background?: string;
  position?: NotifyPosition;
  className?: unknown;
  lockScroll?: boolean;
  zIndex?: number | string;
}

const props = withDefaults(defineProps<NotifyProps>(), {
  show: false,
  type: 'danger',
  message: '',
  duration: 3000,
  position: 'top',
  lockScroll: false,
  zIndex: 2000,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  click: [event: any];
  opened: [];
  close: [];
}>();

const slots = useSlots();

const ANIM_DURATION = 300;

const hasRendered = ref(false);
const animVisible = ref(false);
let animTimer: ReturnType<typeof setTimeout> | null = null;

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function startTimer() {
  clearTimer();
  if (props.duration > 0) {
    timer = setTimeout(() => {
      emit('update:show', false);
      emit('close');
    }, props.duration);
  }
}

watch(
  () => props.show,
  (val) => {
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }

    if (val) {
      hasRendered.value = true;
      startTimer();
      setTimeout(() => { animVisible.value = true; }, 16);
      animTimer = setTimeout(() => { emit('opened'); }, ANIM_DURATION + 50);
    } else {
      clearTimer();
      animVisible.value = false;
    }
  },
  { immediate: true },
);

// Restart timer when duration changes while visible
watch(
  () => props.duration,
  () => {
    if (props.show) {
      startTimer();
    }
  },
);

onBeforeUnmount(() => {
  clearTimer();
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
});

const typeColorMap: Record<string, { color: string; background: string }> = {
  primary: { color: '#fff', background: '#1989fa' },
  success: { color: '#fff', background: '#07c160' },
  warning: { color: '#fff', background: '#ff976a' },
  danger: { color: '#fff', background: '#ee0a24' },
};

const resolvedColor = computed(
  () => props.color ?? typeColorMap[props.type ?? 'danger'].color,
);

const resolvedBackground = computed(
  () => props.background ?? typeColorMap[props.type ?? 'danger'].background,
);

const barStyle = computed(() => {
  const isTop = props.position === 'top';
  const hiddenTransform = isTop ? 'translateY(-100%)' : 'translateY(100%)';
  return {
    position: 'fixed' as const,
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    left: 0,
    right: 0,
    zIndex: Number(props.zIndex) || 2000,
    backgroundColor: resolvedBackground.value,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: `transform ${ANIM_DURATION / 1000}s ease`,
    transform: animVisible.value ? 'translateY(0)' : hiddenTransform,
    pointerEvents: animVisible.value ? ('auto' as const) : ('none' as const),
  };
});

const textStyle = computed(() => ({
  fontSize: 14,
  color: resolvedColor.value,
  textAlign: 'center' as const,
  lineHeight: 20,
}));

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view v-if="hasRendered" :style="barStyle" @tap="onTap">
    <slot>
      <text :style="textStyle">{{ message }}</text>
    </slot>
  </view>
</template>
