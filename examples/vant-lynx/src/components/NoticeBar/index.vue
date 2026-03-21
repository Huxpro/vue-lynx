<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

export interface NoticeBarProps {
  mode?: 'closeable' | 'link' | '';
  text?: string;
  color?: string;
  background?: string;
  leftIcon?: string;
  delay?: number;
  speed?: number;
  scrollable?: boolean;
  wrapable?: boolean;
}

const props = withDefaults(defineProps<NoticeBarProps>(), {
  mode: '',
  text: '',
  color: '#ed6a0c',
  background: '#fffbe8',
  delay: 1,
  speed: 60,
  scrollable: false,
  wrapable: false,
});

const emit = defineEmits<{
  click: [event: any];
  close: [event: any];
  replay: [];
}>();

const visible = ref(true);

const barStyle = computed(() => ({
  display: visible.value ? 'flex' : 'none',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minHeight: 40,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: props.background,
}));

const textStyle = computed(() => ({
  flex: 1,
  fontSize: 14,
  color: props.color,
  lineHeight: 24,
  overflow: 'hidden' as const,
}));

const iconStyle = computed(() => ({
  fontSize: 16,
  color: props.color,
  marginRight: 4,
}));

const rightIconStyle = computed(() => ({
  fontSize: 16,
  color: props.color,
  marginLeft: 6,
}));

function onTap(event: any) {
  emit('click', event);
}

function onClose(event: any) {
  visible.value = false;
  emit('close', event);
}
</script>

<template>
  <view v-if="visible" :style="barStyle" @tap="onTap">
    <!-- Left icon area -->
    <view v-if="leftIcon || $slots['left-icon']" :style="{ marginRight: 4 }">
      <slot name="left-icon">
        <text :style="iconStyle">{{ leftIcon }}</text>
      </slot>
    </view>

    <!-- Text content -->
    <view :style="{ flex: 1, overflow: 'hidden' }">
      <slot>
        <text :style="textStyle">{{ text }}</text>
      </slot>
    </view>

    <!-- Right action area -->
    <view v-if="mode === 'closeable'" @tap="onClose" :style="{ marginLeft: 6 }">
      <slot name="right-icon">
        <text :style="rightIconStyle">&#10005;</text>
      </slot>
    </view>
    <view v-else-if="mode === 'link'" :style="{ marginLeft: 6 }">
      <slot name="right-icon">
        <text :style="rightIconStyle">&#8250;</text>
      </slot>
    </view>
  </view>
</template>
