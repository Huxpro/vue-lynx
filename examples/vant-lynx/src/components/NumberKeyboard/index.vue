<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface NumberKeyboardProps {
  show?: boolean;
  title?: string;
  theme?: 'default' | 'custom';
  maxlength?: number;
  randomKeyOrder?: boolean;
  extraKey?: string | string[];
  closeButtonText?: string;
  deleteButtonText?: string;
  showDeleteKey?: boolean;
  hideOnClickOutside?: boolean;
}

const props = withDefaults(defineProps<NumberKeyboardProps>(), {
  show: false,
  theme: 'default',
  maxlength: Infinity,
  randomKeyOrder: false,
  closeButtonText: 'Done',
  deleteButtonText: '',
  showDeleteKey: true,
  hideOnClickOutside: true,
});

const emit = defineEmits<{
  input: [key: string];
  delete: [];
  close: [];
  blur: [];
}>();

// Build the key grid: 3 columns, 4 rows
// Row 1: 1 2 3
// Row 2: 4 5 6
// Row 3: 7 8 9
// Row 4: extraKey / 0 / delete (default theme)
const extraKeys = computed(() => {
  if (!props.extraKey) return [];
  if (Array.isArray(props.extraKey)) return props.extraKey;
  return [props.extraKey];
});

const numberRows = computed(() => {
  const base = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  if (props.randomKeyOrder) {
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
  }
  return [
    base.slice(0, 3),
    base.slice(3, 6),
    base.slice(6, 9),
  ];
});

function onPressKey(key: string) {
  emit('input', key);
}

function onDelete() {
  emit('delete');
}

function onClose() {
  emit('close');
  emit('blur');
}
</script>

<template>
  <view
    v-if="show"
    :style="{
      backgroundColor: '#f2f3f5',
      paddingTop: 6,
      paddingBottom: 6,
    }"
  >
    <!-- Title row (if title provided) -->
    <view
      v-if="title"
      :style="{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 8,
      }"
    >
      <view :style="{ flex: 1 }" />
      <text :style="{ fontSize: 15, color: '#323233', fontWeight: 'bold' }">{{ title }}</text>
      <view :style="{ flex: 1, display: 'flex', alignItems: 'flex-end' }">
        <text
          :style="{ fontSize: 14, color: '#1989fa' }"
          @tap="onClose"
        >{{ closeButtonText }}</text>
      </view>
    </view>

    <!-- Number rows 1-9 -->
    <view
      v-for="(row, rowIdx) in numberRows"
      :key="rowIdx"
      :style="{ display: 'flex', flexDirection: 'row', marginBottom: 6 }"
    >
      <view
        v-for="key in row"
        :key="key"
        :style="{
          flex: 1,
          marginLeft: 6,
          marginRight: 6,
          height: 54,
          backgroundColor: '#fff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="() => onPressKey(key)"
      >
        <text :style="{ fontSize: 20, color: '#323233' }">{{ key }}</text>
      </view>
    </view>

    <!-- Bottom row: extraKey / 0 / delete -->
    <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 6 }">
      <!-- Extra key or blank -->
      <view
        :style="{
          flex: 1,
          marginLeft: 6,
          marginRight: 6,
          height: 54,
          backgroundColor: extraKeys[0] ? '#fff' : '#f2f3f5',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="() => extraKeys[0] && onPressKey(extraKeys[0])"
      >
        <text v-if="extraKeys[0]" :style="{ fontSize: 20, color: '#323233' }">{{ extraKeys[0] }}</text>
      </view>

      <!-- 0 key -->
      <view
        :style="{
          flex: 1,
          marginLeft: 6,
          marginRight: 6,
          height: 54,
          backgroundColor: '#fff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="() => onPressKey('0')"
      >
        <text :style="{ fontSize: 20, color: '#323233' }">0</text>
      </view>

      <!-- Delete key -->
      <view
        v-if="showDeleteKey"
        :style="{
          flex: 1,
          marginLeft: 6,
          marginRight: 6,
          height: 54,
          backgroundColor: '#fff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="onDelete"
      >
        <text :style="{ fontSize: 16, color: '#323233' }">&#9003;</text>
      </view>
    </view>

    <!-- Close button row (no title mode) -->
    <view
      v-if="!title"
      :style="{
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 6,
      }"
    >
      <view :style="{ flex: 3, marginLeft: 6, marginRight: 6 }" />
      <view
        :style="{
          flex: 1,
          marginLeft: 6,
          marginRight: 6,
          height: 54,
          backgroundColor: '#1989fa',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="onClose"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">{{ closeButtonText }}</text>
      </view>
    </view>
  </view>
</template>
