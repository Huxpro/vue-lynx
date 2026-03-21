<!--
  Vant Feature Parity Report:
  - Props: 10/15 supported
    Supported: show, title, theme, maxlength, randomKeyOrder, extraKey,
               closeButtonText, deleteButtonText, showDeleteKey, hideOnClickOutside
    Missing: modelValue (v-model binding), zIndex, teleport, transition,
             blurOnClose, closeButtonLoading, safeAreaInsetBottom
  - Events: 5/7 supported (input, delete, close, blur, update:modelValue)
    Missing: show, hide (visibility transition events)
  - Slots: 0/3 supported
    Missing: title-left, delete, extra-key
  - Gaps:
    - No v-model support for building input string (modelValue + update:modelValue)
    - No Teleport support (Lynx has different rendering model)
    - No transition/animation on show/hide
    - No safeAreaInsetBottom (Lynx safe area handled differently)
    - No title-left slot for custom content beside title
    - No delete/extra-key slots for custom key rendering
    - Custom theme sidebar close button not implemented
    - hideOnClickOutside prop accepted but not enforced (no click-away detection)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface NumberKeyboardProps {
  show?: boolean;
  title?: string;
  theme?: 'default' | 'custom';
  maxlength?: number;
  modelValue?: string;
  randomKeyOrder?: boolean;
  extraKey?: string | string[];
  closeButtonText?: string;
  deleteButtonText?: string;
  showDeleteKey?: boolean;
  hideOnClickOutside?: boolean;
  blurOnClose?: boolean;
}

const props = withDefaults(defineProps<NumberKeyboardProps>(), {
  show: false,
  theme: 'default',
  maxlength: Infinity,
  modelValue: '',
  randomKeyOrder: false,
  closeButtonText: 'Done',
  deleteButtonText: '',
  showDeleteKey: true,
  hideOnClickOutside: true,
  blurOnClose: true,
});

const emit = defineEmits<{
  input: [key: string];
  delete: [];
  close: [];
  blur: [];
  'update:modelValue': [value: string];
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

  // v-model support: append key if under maxlength
  if (props.modelValue.length < props.maxlength) {
    emit('update:modelValue', props.modelValue + key);
  }
}

function onDelete() {
  emit('delete');

  // v-model support: remove last character
  if (props.modelValue.length > 0) {
    emit('update:modelValue', props.modelValue.slice(0, -1));
  }
}

function onClose() {
  emit('close');
  if (props.blurOnClose) {
    emit('blur');
  }
}
</script>

<template>
  <view
    v-if="show"
    :style="{
      display: 'flex',
      flexDirection: 'column',
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
      <view :style="{ flex: 1, display: 'flex' }">
        <slot name="title-left" />
      </view>
      <text :style="{ fontSize: 15, color: '#323233', fontWeight: 'bold' }">{{ title }}</text>
      <view :style="{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }">
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
        <slot name="extra-key">
          <text v-if="extraKeys[0]" :style="{ fontSize: 20, color: '#323233' }">{{ extraKeys[0] }}</text>
        </slot>
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
        <slot name="delete">
          <text v-if="deleteButtonText" :style="{ fontSize: 16, color: '#323233' }">{{ deleteButtonText }}</text>
          <text v-else :style="{ fontSize: 16, color: '#323233' }">&#9003;</text>
        </slot>
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
