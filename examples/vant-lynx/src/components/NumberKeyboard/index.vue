<!--
  Lynx Limitations:
  - teleport: Lynx has no Teleport support; prop accepted for API compat
  - hideOnClickOutside: No document-level touchstart listener in Lynx; prop accepted but not enforced
  - safeAreaInsetBottom: Lynx safe area handled differently by host; prop controls padding only
  - v-show: Lynx does not support v-show; uses v-if with CSS transition instead
  - SVG icons (collapse/delete): Lynx has limited SVG support; uses text fallback
  - position:fixed: May behave differently in Lynx; keyboard renders inline
-->
<script setup lang="ts">
import { ref, computed, watch, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { useTouch } from '../../composables/useTouch';
import Loading from '../Loading/index.vue';
import type { NumberKeyboardTheme, KeyType, KeyConfig } from './types';
import './index.less';

export type { NumberKeyboardThemeVars } from './types';

export interface NumberKeyboardProps {
  show?: boolean;
  title?: string;
  theme?: NumberKeyboardTheme;
  zIndex?: number | string;
  maxlength?: number | string;
  modelValue?: string;
  transition?: boolean;
  blurOnClose?: boolean;
  showDeleteKey?: boolean;
  randomKeyOrder?: boolean;
  closeButtonText?: string;
  deleteButtonText?: string;
  closeButtonLoading?: boolean;
  hideOnClickOutside?: boolean;
  safeAreaInsetBottom?: boolean;
  extraKey?: string | string[];
  teleport?: string | object;
}

const props = withDefaults(defineProps<NumberKeyboardProps>(), {
  show: false,
  theme: 'default',
  maxlength: Infinity,
  modelValue: '',
  transition: true,
  blurOnClose: true,
  showDeleteKey: true,
  randomKeyOrder: false,
  closeButtonLoading: false,
  hideOnClickOutside: true,
  safeAreaInsetBottom: true,
  extraKey: '',
});

const emit = defineEmits<{
  show: [];
  hide: [];
  blur: [];
  input: [key: string];
  close: [];
  delete: [];
  'update:modelValue': [value: string];
}>();

const slots = useSlots();
const [, bem] = createNamespace('number-keyboard');
const [, keyBem] = createNamespace('key');

// --- Key generation ---

function shuffle(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function genBasicKeys(): KeyConfig[] {
  const keys: KeyConfig[] = Array(9)
    .fill('')
    .map((_, i) => ({ text: i + 1 }));
  if (props.randomKeyOrder) {
    shuffle(keys);
  }
  return keys;
}

function genDefaultKeys(): KeyConfig[] {
  return [
    ...genBasicKeys(),
    { text: props.extraKey as string, type: 'extra' as KeyType },
    { text: 0 },
    {
      text: props.showDeleteKey ? props.deleteButtonText : '',
      type: props.showDeleteKey ? 'delete' as KeyType : '' as KeyType,
    },
  ];
}

function genCustomKeys(): KeyConfig[] {
  const keys = genBasicKeys();
  const { extraKey } = props;
  const extraKeys = Array.isArray(extraKey) ? extraKey : [extraKey];

  if (extraKeys.length === 0) {
    keys.push({ text: 0, wider: true });
  } else if (extraKeys.length === 1) {
    keys.push(
      { text: 0, wider: true },
      { text: extraKeys[0], type: 'extra' },
    );
  } else if (extraKeys.length === 2) {
    keys.push(
      { text: extraKeys[0], type: 'extra' },
      { text: 0 },
      { text: extraKeys[1], type: 'extra' },
    );
  }

  return keys;
}

const keys = computed(() =>
  props.theme === 'custom' ? genCustomKeys() : genDefaultKeys(),
);

// --- Event handlers ---

function onBlur() {
  if (props.show) {
    emit('blur');
  }
}

function onClose() {
  emit('close');
  if (props.blurOnClose) {
    onBlur();
  }
}

function onPress(text: string | number | undefined, type: KeyType) {
  if (text === '') {
    if (type === 'extra') {
      onBlur();
    }
    return;
  }

  const value = props.modelValue;

  if (type === 'delete') {
    emit('delete');
    emit('update:modelValue', value.slice(0, value.length - 1));
  } else if (type === 'close') {
    onClose();
  } else if (value.length < +props.maxlength) {
    emit('input', String(text));
    emit('update:modelValue', value + text);
  }
}

// --- Transition ---

const hasRendered = ref(props.show);
let isFirstWatch = true;

watch(
  () => props.show,
  (value) => {
    if (value) {
      hasRendered.value = true;
    }
    if (!props.transition && !isFirstWatch) {
      emit(value ? 'show' : 'hide');
    }
    isFirstWatch = false;
  },
  { immediate: true },
);

function onTransitionEnd() {
  emit(props.show ? 'show' : 'hide');
}

// --- Touch handling for keys ---

const activeKeyIndex = ref(-1);
const touch = useTouch();

function onKeyTouchStart(event: TouchEvent, index: number) {
  touch.start(event);
  activeKeyIndex.value = index;
}

function onKeyTouchMove(event: TouchEvent) {
  touch.move(event);
  if (touch.direction.value) {
    activeKeyIndex.value = -1;
  }
}

function onKeyTouchEnd(key: KeyConfig, index: number) {
  if (activeKeyIndex.value === index) {
    activeKeyIndex.value = -1;
    onPress(key.text, key.type || '');
  }
}

function onKeyTap(key: KeyConfig) {
  onPress(key.text, key.type || '');
}

function onKeyTouchCancel() {
  activeKeyIndex.value = -1;
}

// --- Computed classes/styles ---

const hasTitle = computed(() => {
  const { title, theme, closeButtonText } = props;
  return !!(title || (closeButtonText && theme === 'default') || slots['title-left']);
});

const rootClass = computed(() =>
  bem([{
    unfit: !props.safeAreaInsetBottom,
    'with-title': hasTitle.value,
  }]),
);

const rootStyle = computed(() => {
  const style: Record<string, any> = {};
  if (props.zIndex !== undefined) {
    style.zIndex = Number(props.zIndex);
  }
  if (props.transition) {
    style.transition = 'transform 0.3s';
  }
  if (!props.show) {
    style.transform = 'translateY(100%)';
  }
  return style;
});

function getKeyClass(key: KeyConfig, index: number) {
  return keyBem([
    key.color,
    {
      large: false,
      active: activeKeyIndex.value === index,
      delete: key.type === 'delete',
    },
  ]);
}

function getWrapperClass(key: KeyConfig) {
  return keyBem('wrapper', { wider: !!key.wider });
}
</script>

<template>
  <view
    v-if="hasRendered"
    :class="rootClass"
    :style="rootStyle"
    @transitionend="onTransitionEnd"
  >
    <!-- Header -->
    <view v-if="hasTitle" :class="bem('header')">
      <view v-if="$slots['title-left']" :class="bem('title-left')">
        <slot name="title-left" />
      </view>
      <text v-if="title" :class="bem('title')">{{ title }}</text>
      <view
        v-if="closeButtonText && theme === 'default'"
        :class="bem('close')"
        @tap="onClose"
      >
        <text :class="bem('close')">{{ closeButtonText }}</text>
      </view>
    </view>

    <!-- Body -->
    <view :class="bem('body')">
      <!-- Keys grid -->
      <view :class="bem('keys')">
        <view
          v-for="(key, index) in keys"
          :key="`${key.text}-${index}`"
          :class="getWrapperClass(key)"
          @tap="() => onKeyTap(key)"
          @touchstart="(e: TouchEvent) => onKeyTouchStart(e, index)"
          @touchmove="(e: TouchEvent) => onKeyTouchMove(e)"
          @touchend="() => onKeyTouchEnd(key, index)"
          @touchcancel="onKeyTouchCancel"
        >
          <view :class="getKeyClass(key, index)">
            <!-- Delete key content -->
            <template v-if="key.type === 'delete'">
              <slot name="delete">
                <text v-if="key.text">{{ key.text }}</text>
                <text v-else :style="{ fontSize: 20 }">&#9003;</text>
              </slot>
            </template>
            <!-- Extra key content -->
            <template v-else-if="key.type === 'extra'">
              <slot name="extra-key">
                <text v-if="key.text !== ''">{{ key.text }}</text>
              </slot>
            </template>
            <!-- Number key content -->
            <template v-else>
              <text>{{ key.text }}</text>
            </template>
          </view>
        </view>
      </view>

      <!-- Sidebar (custom theme only) -->
      <view v-if="theme === 'custom'" :class="bem('sidebar')">
        <!-- Sidebar delete key -->
        <view
          v-if="showDeleteKey"
          :class="keyBem('wrapper')"
          :style="{ flex: 1 }"
          @tap="() => onPress('', 'delete')"
          @touchstart="(e: TouchEvent) => onKeyTouchStart(e, 100)"
          @touchmove="(e: TouchEvent) => onKeyTouchMove(e)"
          @touchend="() => { if (activeKeyIndex === 100) { activeKeyIndex = -1; onPress('', 'delete'); } }"
          @touchcancel="onKeyTouchCancel"
        >
          <view
            :class="keyBem([{ large: true, active: activeKeyIndex === 100, delete: true }])"
          >
            <slot name="delete">
              <text v-if="deleteButtonText">{{ deleteButtonText }}</text>
              <text v-else :style="{ fontSize: 20 }">&#9003;</text>
            </slot>
          </view>
        </view>
        <!-- Sidebar close key -->
        <view
          :class="keyBem('wrapper')"
          :style="{ flex: 1 }"
          @tap="onClose"
          @touchstart="(e: TouchEvent) => onKeyTouchStart(e, 101)"
          @touchmove="(e: TouchEvent) => onKeyTouchMove(e)"
          @touchend="() => { if (activeKeyIndex === 101) { activeKeyIndex = -1; onPress('', 'close'); } }"
          @touchcancel="onKeyTouchCancel"
        >
          <view
            :class="keyBem(['blue', { large: true, active: activeKeyIndex === 101 }])"
          >
            <Loading v-if="closeButtonLoading" :class="keyBem('loading-icon')" />
            <text v-else>{{ closeButtonText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
