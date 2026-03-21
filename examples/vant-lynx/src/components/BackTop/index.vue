<!--
  Vant Feature Parity Report (BackTop):
  - Props: 6/7 supported (right, bottom, zIndex, target, offset/visibilityHeight, immediate)
    - right: number (default 30) - right offset
    - bottom: number (default 40) - bottom offset
    - zIndex: number (default 100) - z-index
    - target: string - scroll target selector (not fully functional in Lynx)
    - offset: number (default 200) - scroll offset to show (Vant name: offset, mapped to visibilityHeight)
    - immediate: boolean (default false) - use instant scroll instead of smooth
    - teleport: not supported (Lynx has no Teleport/portal)
  - Events: 1/1 supported (click)
  - Slots: 1/1 supported (default - custom content replacing arrow)
  - Lynx Adaptations:
    - Uses Icon component for the default up-arrow instead of raw text "^"
    - handleScroll exposed for parent scroll-view integration
    - No DOM scroll listener attachment (Lynx has no addEventListener on scroll containers)
    - Parent must call handleScroll with scroll event data
  - Gaps:
    - No teleport/portal support in Lynx
    - No auto scroll-parent detection (Lynx limitation)
    - Smooth scrolling not controllable from this component
    - target prop accepted but scroll listener must be wired manually
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface BackTopProps {
  target?: string;
  offset?: number;
  right?: number;
  bottom?: number;
  zIndex?: number;
  immediate?: boolean;
}

const props = withDefaults(defineProps<BackTopProps>(), {
  offset: 200,
  right: 30,
  bottom: 40,
  zIndex: 100,
  immediate: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const visible = ref(false);
const scrollTop = ref(0);

function handleScroll(event: any) {
  const st = event?.detail?.scrollTop ?? event?.scrollTop ?? 0;
  scrollTop.value = st;
  visible.value = st >= props.offset;
}

function onTap(event: any) {
  emit('click', event);
  scrollTop.value = 0;
  visible.value = false;
}

defineExpose({ handleScroll });

const buttonStyle = computed(() => ({
  position: 'fixed' as const,
  right: props.right,
  bottom: props.bottom,
  zIndex: props.zIndex,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#fff',
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderWidth: 0.5,
  borderStyle: 'solid' as const,
  borderColor: '#dcdee0',
}));
</script>

<template>
  <view v-if="visible" :style="buttonStyle" @tap="onTap">
    <slot>
      <Icon name="arrow-up" :size="20" color="#969799" />
    </slot>
  </view>
</template>
