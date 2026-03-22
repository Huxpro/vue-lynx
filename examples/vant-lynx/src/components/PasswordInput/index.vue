<!--
  Lynx Limitations:
  - ::after border-radius on security container: Vant uses ::after pseudo-element
    for rounded border; we use direct border styles on the container
  - <li> elements: Lynx has no HTML tags; uses <view> instead
  - user-select: none: Lynx has no text selection, so this is a no-op
  - touchstart passive: Lynx uses @tap event instead
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import './index.less';

const [name, bem] = createNamespace('password-input');

export interface PasswordInputProps {
  info?: string;
  mask?: boolean;
  value?: string;
  gutter?: string | number;
  length?: number | string;
  focused?: boolean;
  errorInfo?: string;
}

const props = withDefaults(defineProps<PasswordInputProps>(), {
  value: '',
  length: 6,
  mask: true,
});

const emit = defineEmits<{
  focus: [event?: Event];
}>();

const onTap = (event?: Event) => {
  emit('focus', event);
};

const points = computed(() => {
  const result: Array<{
    char: string;
    showCursor: boolean;
  }> = [];
  const length = +props.length;

  for (let i = 0; i < length; i++) {
    const char = props.value[i] || '';
    const showCursor = !!props.focused && i === props.value.length;
    result.push({ char, showCursor });
  }

  return result;
});

const hasGutter = computed(() => props.gutter !== undefined && props.gutter !== 0 && props.gutter !== '0');

const securityClass = computed(() => {
  const classes = [bem('security')];
  if (hasGutter.value) {
    classes.push(bem('security', { gutter: true }));
  } else {
    classes.push(bem('security', { bordered: true }));
  }
  return classes.join(' ');
});

const infoText = computed(() => props.errorInfo || props.info);
const infoClass = computed(() => bem(props.errorInfo ? 'error-info' : 'info'));

function getItemStyle(index: number) {
  if (hasGutter.value && index !== 0) {
    return { marginLeft: addUnit(props.gutter) };
  }
  return undefined;
}
</script>

<template>
  <view :class="bem()" @tap="onTap">
    <view :class="securityClass">
      <view
        v-for="(point, index) in points"
        :key="index"
        :class="bem('item', { focus: point.showCursor })"
        :style="getItemStyle(index)"
      >
        <!-- Masked dot -->
        <view
          v-if="mask && point.char"
          :class="bem('dot')"
        />
        <!-- Plain text -->
        <text v-else-if="!mask && point.char">{{ point.char }}</text>
        <!-- Cursor -->
        <view
          v-if="point.showCursor"
          :class="bem('cursor')"
        />
      </view>
    </view>
    <!-- Info / Error text -->
    <text
      v-if="infoText"
      :class="infoClass"
    >{{ infoText }}</text>
  </view>
</template>
