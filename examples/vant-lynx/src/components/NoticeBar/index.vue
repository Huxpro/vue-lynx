<!--
  Lynx Limitations:
  - getBoundingClientRect: Lynx lacks synchronous DOM measurement; uses ref-based measurement with fallback
  - onPopupReopen: No popup reopen composable in Lynx
  - pageshow event: No pageshow/visibilitychange event in Lynx
  - onActivated: No keep-alive activation hook in Lynx
  - v-show: Uses v-if since Lynx display:none behavior differs
  - transitionend: May not fire reliably in Lynx; uses setTimeout fallback for animation loop
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Icon from '../Icon/index.vue';
import type { NoticeBarMode } from './types';
import './index.less';

const [, bem] = createNamespace('notice-bar');

interface NoticeBarProps {
  text?: string;
  mode?: NoticeBarMode | '';
  color?: string;
  delay?: number | string;
  speed?: number | string;
  leftIcon?: string;
  wrapable?: boolean;
  background?: string;
  scrollable?: boolean | null;
}

const props = withDefaults(defineProps<NoticeBarProps>(), {
  delay: 1,
  speed: 60,
  wrapable: false,
  scrollable: null,
});

const emit = defineEmits<{
  close: [event: any];
  replay: [];
}>();

// --- State ---
const show = ref(true);
const offset = ref(0);
const duration = ref(0);

let wrapWidth = 0;
let contentWidth = 0;
let startTimer: ReturnType<typeof setTimeout> | undefined;

const wrapRef = ref<any>(null);
const contentRef = ref<any>(null);

// --- Computed ---
const ellipsis = computed(() => props.scrollable === false && !props.wrapable);

const barClasses = computed(() => bem([{ wrapable: props.wrapable }]));

const contentClasses = computed(() => {
  const cls = bem('content');
  return ellipsis.value ? `${cls} van-ellipsis` : cls;
});

// Inline styles ONLY for dynamic color/background props
const barStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.color) style.color = props.color;
  if (props.background) style.background = props.background;
  return Object.keys(style).length ? style : undefined;
});

const contentStyle = computed(() => {
  const style: Record<string, string> = {};
  if (offset.value) {
    style.transform = `translateX(${offset.value}px)`;
  }
  if (duration.value) {
    style.transitionDuration = `${duration.value}s`;
  }
  return Object.keys(style).length ? style : undefined;
});

// --- Right icon ---
const rightIconName = computed(() => {
  if (props.mode === 'closeable') return 'cross';
  if (props.mode === 'link') return 'arrow';
  return '';
});

// --- Marquee Animation ---
function onTransitionEnd() {
  offset.value = wrapWidth;
  duration.value = 0;

  // Use double raf equivalent (two setTimeout(0)) to ensure animation restarts
  setTimeout(() => {
    setTimeout(() => {
      offset.value = -contentWidth;
      duration.value = (contentWidth + wrapWidth) / +props.speed;
      emit('replay');
    }, 0);
  }, 0);
}

function measureAndStart() {
  const { delay, speed, scrollable } = props;
  const ms = +(delay) * 1000;

  wrapWidth = 0;
  contentWidth = 0;
  offset.value = 0;
  duration.value = 0;

  clearTimeout(startTimer);
  startTimer = setTimeout(() => {
    if (scrollable === false) return;

    // Try to measure via DOM refs (works in web/test env)
    const wrapEl = wrapRef.value?.$el || wrapRef.value;
    const contentEl = contentRef.value?.$el || contentRef.value;

    let ww = 0;
    let cw = 0;

    if (wrapEl?.getBoundingClientRect) {
      ww = wrapEl.getBoundingClientRect().width || 0;
    }
    if (contentEl?.getBoundingClientRect) {
      cw = contentEl.getBoundingClientRect().width || 0;
    }

    // Fallback: estimate from text length if measurement returns 0
    if (cw === 0 && props.text) {
      cw = props.text.length * 8;
      ww = ww || 300;
    }

    if (scrollable || cw > ww) {
      // Double raf equivalent
      setTimeout(() => {
        setTimeout(() => {
          wrapWidth = ww;
          contentWidth = cw;
          offset.value = -cw;
          duration.value = cw / +speed;
        }, 0);
      }, 0);
    }
  }, ms);
}

function reset() {
  measureAndStart();
}

function onClickRightIcon(event: any) {
  if (props.mode === 'closeable') {
    show.value = false;
    emit('close', event);
  }
}

// --- Lifecycle ---
onMounted(() => {
  measureAndStart();
});

onUnmounted(() => {
  clearTimeout(startTimer);
});

watch(() => [props.text, props.scrollable], () => {
  reset();
});

defineExpose({ reset });
</script>

<template>
  <view v-if="show" :class="barClasses" :style="barStyle">
    <!-- Left icon -->
    <view v-if="leftIcon || $slots['left-icon']" :class="bem('left-icon')">
      <slot name="left-icon">
        <Icon :name="leftIcon" size="16px" />
      </slot>
    </view>

    <!-- Content wrap (marquee container) -->
    <view ref="wrapRef" :class="bem('wrap')">
      <view
        ref="contentRef"
        :class="contentClasses"
        :style="contentStyle"
        @transitionend="onTransitionEnd"
      >
        <slot>
          <text>{{ text }}</text>
        </slot>
      </view>
    </view>

    <!-- Right icon -->
    <view
      v-if="rightIconName || $slots['right-icon']"
      :class="bem('right-icon')"
      @tap="onClickRightIcon"
    >
      <slot name="right-icon">
        <Icon :name="rightIconName" size="16px" />
      </slot>
    </view>
  </view>
</template>
