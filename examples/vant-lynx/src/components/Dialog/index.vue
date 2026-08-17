<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - lockScroll: accepted for API compat but no document.body scroll in Lynx
  - closeOnPopstate: accepted for API compat but no browser history API in Lynx
  - keydown/keyboardEnabled: accepted for API compat but no keyboard events in Lynx
  - allowHtml: no innerHTML in Lynx, renders as plain text
  - theme='round-button': simplified (no ActionBar/ActionBarButton, uses styled views)
  - overflow-y: auto for long messages ignored; use scroll-view if needed
-->
<script setup lang="ts">
import { computed, reactive } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit, isDef } from '../../utils/format';
import Popup from '../Popup/index.vue';
import Loading from '../Loading/index.vue';
import type { Interceptor } from '../Popup/types';
import type {
  DialogTheme,
  DialogAction,
  DialogMessage,
  DialogMessageAlign,
} from './types';
import './index.less';

const [, bem] = createNamespace('dialog');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    title?: string;
    theme?: DialogTheme;
    width?: string | number;
    message?: DialogMessage;
    callback?: (action?: DialogAction) => void;
    allowHtml?: boolean;
    className?: string;
    transition?: string;
    messageAlign?: DialogMessageAlign;
    closeOnPopstate?: boolean;
    showCancelButton?: boolean;
    cancelButtonText?: string;
    cancelButtonColor?: string;
    cancelButtonDisabled?: boolean;
    confirmButtonText?: string;
    confirmButtonColor?: string;
    confirmButtonDisabled?: boolean;
    showConfirmButton?: boolean;
    closeOnClickOverlay?: boolean;
    keyboardEnabled?: boolean;
    destroyOnClose?: boolean;
    // Popup shared props
    overlay?: boolean;
    overlayClass?: string;
    overlayStyle?: Record<string, any>;
    zIndex?: number | string;
    duration?: number | string;
    lockScroll?: boolean;
    lazyRender?: boolean;
    beforeClose?: Interceptor;
    teleport?: string | object;
    safeAreaInsetTop?: boolean;
    safeAreaInsetBottom?: boolean;
  }>(),
  {
    theme: 'default',
    showConfirmButton: true,
    showCancelButton: false,
    closeOnClickOverlay: false,
    closeOnPopstate: true,
    keyboardEnabled: true,
    overlay: true,
    lockScroll: true,
    lazyRender: true,
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
  keydown: [event: any];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [event: any];
}>();

const loading = reactive({
  confirm: false,
  cancel: false,
});

function callInterceptor(
  interceptor: Interceptor | undefined,
  { args, done, canceled }: { args?: any[]; done: () => void; canceled?: () => void },
) {
  if (!interceptor) {
    done();
    return;
  }
  const result = interceptor(...(args || []));
  if (result && typeof (result as any).then === 'function') {
    (result as Promise<boolean | void>)
      .then((val) => {
        if (val !== false) done();
        else canceled?.();
      })
      .catch(() => {
        canceled?.();
      });
  } else if (result !== false) {
    done();
  } else {
    canceled?.();
  }
}

const updateShow = (value: boolean) => emit('update:show', value);

const close = (action: DialogAction) => {
  updateShow(false);
  props.callback?.(action);
};

const getActionHandler = (action: DialogAction) => () => {
  if (!props.show) return;

  emit(action);

  if (props.beforeClose) {
    loading[action] = true;
    callInterceptor(props.beforeClose, {
      args: [action],
      done() {
        close(action);
        loading[action] = false;
      },
      canceled() {
        loading[action] = false;
      },
    });
  } else {
    close(action);
  }
};

const onCancel = getActionHandler('cancel');
const onConfirm = getActionHandler('confirm');

// --- Computed ---

const hasTitle = computed(() => !!props.title);

const messageContent = computed(() => {
  const { message } = props;
  if (typeof message === 'function') return message();
  return message;
});

const dialogClasses = computed(() => [
  bem([props.theme !== 'default' ? props.theme : undefined]),
  props.className,
]);

const dialogStyle = computed(() => {
  const style: Record<string, any> = {};
  if (isDef(props.width)) {
    style.width = addUnit(props.width);
  }
  return style;
});

const headerClasses = computed(() => {
  const isolated = !messageContent.value && !hasTitle.value ? false : !messageContent.value;
  return bem('header', { isolated });
});

const contentClass = computed(() =>
  bem('content', { isolated: !hasTitle.value }),
);

const messageClasses = computed(() =>
  bem('message', {
    'has-title': hasTitle.value,
    [props.messageAlign as string]: !!props.messageAlign,
  }),
);

// Forward popup events
const onOpen = () => emit('open');
const onClose = () => emit('close');
const onOpened = () => emit('opened');
const onClosed = () => emit('closed');
const onClickOverlay = (event: any) => emit('click-overlay', event);
</script>

<template>
  <Popup
    :show="show"
    position="center"
    :overlay="overlay"
    :overlay-class="overlayClass"
    :overlay-style="overlayStyle"
    :z-index="zIndex"
    :duration="duration"
    :lock-scroll="lockScroll"
    :lazy-render="lazyRender"
    :close-on-click-overlay="closeOnClickOverlay"
    :destroy-on-close="destroyOnClose"
    :close-on-popstate="closeOnPopstate"
    :teleport="teleport"
    :safe-area-inset-top="safeAreaInsetTop"
    :safe-area-inset-bottom="safeAreaInsetBottom"
    @update:show="updateShow"
    @open="onOpen"
    @close="onClose"
    @opened="onOpened"
    @closed="onClosed"
    @click-overlay="onClickOverlay"
  >
    <!-- Dialog wrapper inside Popup slot -->
    <view :class="dialogClasses" :style="dialogStyle">
      <!-- Title -->
      <slot name="title">
        <view
          v-if="title"
          :class="headerClasses"
        >
          <text>{{ title }}</text>
        </view>
      </slot>

      <!-- Content -->
      <template v-if="$slots.default">
        <view :class="bem('content')">
          <slot />
        </view>
      </template>
      <view
        v-else-if="messageContent"
        :class="contentClass"
      >
        <view :class="messageClasses">
          <text>{{ messageContent }}</text>
        </view>
      </view>

      <!-- Footer -->
      <slot name="footer">
        <view :class="bem('footer')">
          <!-- Cancel button -->
          <view
            v-if="showCancelButton"
            :class="bem('cancel')"
            :style="cancelButtonColor ? { color: cancelButtonColor } : undefined"
            @tap="onCancel"
          >
            <Loading v-if="loading.cancel" size="20px" />
            <text v-else>{{ cancelButtonText || '取消' }}</text>
          </view>

          <!-- Confirm button -->
          <view
            v-if="showConfirmButton"
            :class="bem('confirm')"
            :style="confirmButtonColor ? { color: confirmButtonColor } : undefined"
            @tap="onConfirm"
          >
            <Loading v-if="loading.confirm" size="20px" />
            <text v-else>{{ confirmButtonText || '确认' }}</text>
          </view>
        </view>
      </slot>
    </view>
  </Popup>
</template>
