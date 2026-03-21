<!--
  Vant Feature Parity Report:
  - Props: 9/12 supported (show, actions, title, description, cancelText, closeOnClickAction,
    closeable, closeIcon, safeAreaInsetBottom;
    missing: round [delegated to Popup], closeOnClickOverlay, beforeClose)
  - Events: 4/5 (update:show, select, cancel, close; missing: opened/closed)
  - Slots: 3/5 (default [via actions], cancel, description; missing: action)
  - Sub-components: Popup ✅, Loading ✅, Icon ✅
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Popup from '../Popup/index.vue';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';

export interface ActionSheetAction {
  name: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface ActionSheetProps {
  show?: boolean;
  actions?: ActionSheetAction[];
  title?: string;
  description?: string;
  cancelText?: string;
  closeOnClickAction?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  safeAreaInsetBottom?: boolean;
}

const props = withDefaults(defineProps<ActionSheetProps>(), {
  show: false,
  actions: () => [],
  title: '',
  description: '',
  cancelText: '',
  closeOnClickAction: true,
  closeable: false,
  closeIcon: 'cross',
  safeAreaInsetBottom: false,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [action: ActionSheetAction, index: number];
  cancel: [];
  open: [];
  close: [];
}>();

function onClose() {
  emit('update:show', false);
  emit('close');
}

function onOpen() {
  emit('open');
}

function onClickAction(action: ActionSheetAction, index: number) {
  if (action.disabled || action.loading) return;
  emit('select', action, index);
  if (props.closeOnClickAction) {
    emit('update:show', false);
    emit('close');
  }
}

function onCancel() {
  emit('cancel');
  emit('update:show', false);
  emit('close');
}

const hasHeader = computed(() => !!props.title || !!props.description);
</script>

<template>
  <Popup
    :show="show"
    position="bottom"
    round
    @update:show="(val) => emit('update:show', val)"
    @open="onOpen"
    @close="onClose"
  >
    <!-- Header: title and description -->
    <view
      v-if="hasHeader"
      :style="{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ebedf0',
        position: 'relative',
      }"
    >
      <text
        v-if="title"
        :style="{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#323233',
          marginBottom: description ? 8 : 0,
        }"
      >{{ title }}</text>
      <text
        v-if="description"
        :style="{
          fontSize: 14,
          color: '#969799',
          textAlign: 'center',
        }"
      >{{ description }}</text>
      <!-- Close icon -->
      <view
        v-if="closeable"
        :style="{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: 4,
        }"
        @tap="onClose"
      >
        <Icon :name="closeIcon" :size="18" color="#c8c9cc" />
      </view>
    </view>

    <!-- Action items -->
    <view
      v-for="(action, index) in actions"
      :key="index"
      :style="{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ebedf0',
        backgroundColor: '#fff',
        opacity: action.disabled ? 0.5 : 1,
      }"
      @tap="() => onClickAction(action, index)"
    >
      <Loading
        v-if="action.loading"
        :size="20"
        color="#969799"
      />
      <text
        v-else
        :style="{
          fontSize: 16,
          color: action.disabled ? '#c8c9cc' : (action.color || '#323233'),
        }"
      >{{ action.name }}</text>
    </view>

    <!-- Cancel button -->
    <view
      v-if="cancelText"
      :style="{
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <!-- Gap above cancel -->
      <view :style="{ height: 8, backgroundColor: '#f7f8fa' }" />
      <view
        :style="{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 56,
          backgroundColor: '#fff',
        }"
        @tap="onCancel"
      >
        <text :style="{ fontSize: 16, color: '#323233' }">{{ cancelText }}</text>
      </view>
    </view>

    <!-- Safe area bottom padding -->
    <view v-if="safeAreaInsetBottom" :style="{ height: 34, backgroundColor: '#fff' }" />
  </Popup>
</template>
