<!--
  Lynx Limitations:
  - teleport: Lynx has no Teleport/portal support; prop accepted for API parity but is a no-op
  - target: No auto scroll-parent detection in Lynx; parent must call handleScroll manually
  - Smooth scrolling: Cannot be controlled from this component; parent scroll-view handles scroll behavior
  - CSS transition (scale): Lynx does not reliably support transform: scale() transitions; uses v-if for show/hide
  - :active pseudo-class: Uses touchstart/touchend for pressed feedback instead
  - box-shadow: Lynx does not support box-shadow; uses border as approximation
  - cursor: pointer: Not applicable in Lynx
  - KeepAlive: onActivated/onDeactivated not relevant in Lynx context
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
    return `${value}px`;
  }
  return String(value);
};

interface BackTopProps {
  right?: string | number;
  bottom?: string | number;
  zIndex?: string | number;
  target?: string;
  offset?: string | number;
  immediate?: boolean;
  teleport?: string;
}

const props = withDefaults(defineProps<BackTopProps>(), {
  offset: 200,
  immediate: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const visible = ref(false);
const pressed = ref(false);

function handleScroll(event: any) {
  const st = event?.detail?.scrollTop ?? event?.scrollTop ?? 0;
  visible.value = st >= +props.offset;
}

function onTap(event: any) {
  emit('click', event);
}

function onTouchStart() {
  pressed.value = true;
}

function onTouchEnd() {
  pressed.value = false;
}

defineExpose({ handleScroll });

const buttonStyle = computed(() => {
  const style: Record<string, any> = {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '999px',
    backgroundColor: '#1989fa',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  };

  if (props.right !== undefined) {
    style.right = addUnit(props.right);
  } else {
    style.right = '30px';
  }

  if (props.bottom !== undefined) {
    style.bottom = addUnit(props.bottom);
  } else {
    style.bottom = '40px';
  }

  if (props.zIndex !== undefined) {
    style.zIndex = +props.zIndex;
  } else {
    style.zIndex = 100;
  }

  if (pressed.value) {
    style.opacity = 0.7;
  }

  return style;
});

const iconStyle = computed(() => ({
  fontSize: '20px',
  fontWeight: 'bold' as const,
}));
</script>

<template>
  <view
    v-if="visible"
    :style="buttonStyle"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <slot>
      <Icon name="back-top" :size="20" color="#fff" />
    </slot>
  </view>
</template>
