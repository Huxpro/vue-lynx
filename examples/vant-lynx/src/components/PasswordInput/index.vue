<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface PasswordInputProps {
  value?: string;
  info?: string;
  errorInfo?: string;
  length?: number;
  gutter?: number;
  mask?: boolean;
  focused?: boolean;
}

const props = withDefaults(defineProps<PasswordInputProps>(), {
  value: '',
  length: 6,
  gutter: 0,
  mask: true,
  focused: false,
});

const emit = defineEmits<{
  focus: [];
}>();

const cells = computed(() => {
  const arr: string[] = [];
  for (let i = 0; i < props.length; i++) {
    arr.push(props.value[i] ?? '');
  }
  return arr;
});

const isConnected = computed(() => props.gutter === 0);

function getCellStyle(index: number, total: number) {
  const base: Record<string, any> = {
    width: 40,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#ebedf0',
    borderStyle: 'solid',
    borderWidth: 1,
    position: 'relative',
  };

  if (isConnected.value) {
    // Connected: merge borders
    if (index === 0) {
      base.borderTopLeftRadius = 6;
      base.borderBottomLeftRadius = 6;
      base.borderRightWidth = 0;
    } else if (index === total - 1) {
      base.borderTopRightRadius = 6;
      base.borderBottomRightRadius = 6;
      base.borderLeftWidth = 0;
    } else {
      base.borderLeftWidth = 0;
      base.borderRightWidth = 0;
    }
  } else {
    base.borderRadius = 6;
    base.marginRight = index < total - 1 ? props.gutter : 0;
  }

  return base;
}

function onTap() {
  emit('focus');
}
</script>

<template>
  <view @tap="onTap">
    <!-- Cells row -->
    <view :style="{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }">
      <view
        v-for="(cell, index) in cells"
        :key="index"
        :style="getCellStyle(index, length)"
      >
        <!-- Dot or digit -->
        <view
          v-if="mask && cell"
          :style="{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#323233',
          }"
        />
        <text
          v-else-if="!mask && cell"
          :style="{ fontSize: 20, color: '#323233' }"
        >{{ cell }}</text>

        <!-- Cursor blink indicator for focused active cell -->
        <view
          v-if="focused && index === value.length && index < length"
          :style="{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            width: 1,
            height: 24,
            backgroundColor: '#1989fa',
          }"
        />
      </view>
    </view>

    <!-- Info / Error text -->
    <text
      v-if="errorInfo"
      :style="{
        display: 'flex',
        fontSize: 14,
        color: '#ee0a24',
        textAlign: 'center',
        marginTop: 8,
      }"
    >{{ errorInfo }}</text>
    <text
      v-else-if="info"
      :style="{
        display: 'flex',
        fontSize: 14,
        color: '#969799',
        textAlign: 'center',
        marginTop: 8,
      }"
    >{{ info }}</text>
  </view>
</template>
