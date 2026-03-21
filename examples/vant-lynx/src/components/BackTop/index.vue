<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue-lynx';

export interface BackTopProps {
  target?: string;
  visibilityHeight?: number;
  right?: number;
  bottom?: number;
  zIndex?: number;
  teleport?: string;
}

const props = withDefaults(defineProps<BackTopProps>(), {
  visibilityHeight: 200,
  right: 30,
  bottom: 40,
  zIndex: 100,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const visible = ref(false);
const scrollTop = ref(0);

function handleScroll(event: any) {
  const st = event?.detail?.scrollTop ?? event?.scrollTop ?? 0;
  scrollTop.value = st;
  visible.value = st >= props.visibilityHeight;
}

function onTap(event: any) {
  emit('click', event);
  // Scroll to top - in Lynx this would interact with the scroll container
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

const arrowStyle = computed(() => ({
  fontSize: 20,
  color: '#969799',
  textAlign: 'center' as const,
  lineHeight: 40,
}));
</script>

<template>
  <view v-if="visible" :style="buttonStyle" @tap="onTap">
    <slot>
      <text :style="arrowStyle">^</text>
    </slot>
  </view>
</template>
