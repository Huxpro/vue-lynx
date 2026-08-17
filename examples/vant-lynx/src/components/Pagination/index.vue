<!--
  Lynx Limitations:
  - HTML <nav>/<ul>/<li>/<button> elements: Lynx uses <view>/<text> instead
  - :active pseudo-class: Lynx has no :active, no active tap feedback
  - ::after hairline border: uses direct border on element instead
  - cursor/user-select: not applicable in Lynx
  - role/aria-current: accessibility attributes not applicable in Lynx
  - i18n (t('prev')/t('next')): no i18n system, defaults to static strings
-->
<script setup lang="ts">
import { computed, watchEffect } from 'vue-lynx';
import { createNamespace } from '../../utils';
import type { PaginationMode, PageItem, Numeric } from './types';
import './index.less';

export interface PaginationProps {
  modelValue?: number;
  mode?: PaginationMode;
  prevText?: string;
  nextText?: string;
  pageCount?: Numeric;
  totalItems?: Numeric;
  showPageSize?: Numeric;
  itemsPerPage?: Numeric;
  forceEllipses?: boolean;
  showPrevButton?: boolean;
  showNextButton?: boolean;
}

const [name, bem] = createNamespace('pagination');

const props = withDefaults(defineProps<PaginationProps>(), {
  modelValue: 0,
  mode: 'multi',
  pageCount: 0,
  totalItems: 0,
  showPageSize: 5,
  itemsPerPage: 10,
  forceEllipses: false,
  showPrevButton: true,
  showNextButton: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

const count = computed(() => {
  const { pageCount, totalItems, itemsPerPage } = props;
  const c = +pageCount || Math.ceil(+totalItems / +itemsPerPage);
  return Math.max(1, c);
});

const pages = computed(() => {
  const items: PageItem[] = [];
  const pageCount = count.value;
  const showPageSize = +props.showPageSize;
  const { modelValue, forceEllipses } = props;

  let startPage = 1;
  let endPage = pageCount;
  const isMaxSized = showPageSize < pageCount;

  if (isMaxSized) {
    startPage = Math.max(modelValue - Math.floor(showPageSize / 2), 1);
    endPage = startPage + showPageSize - 1;

    if (endPage > pageCount) {
      endPage = pageCount;
      startPage = endPage - showPageSize + 1;
    }
  }

  for (let number = startPage; number <= endPage; number++) {
    items.push({ number, text: number, active: number === modelValue });
  }

  if (isMaxSized && showPageSize > 0 && forceEllipses) {
    if (startPage > 1) {
      items.unshift({ number: startPage - 1, text: '...', active: false });
    }
    if (endPage < pageCount) {
      items.push({ number: endPage + 1, text: '...', active: false });
    }
  }

  return items;
});

function updateModelValue(value: number, emitChange?: boolean) {
  value = clamp(value, 1, count.value);

  if (props.modelValue !== value) {
    emit('update:modelValue', value);
    if (emitChange) {
      emit('change', value);
    }
  }
}

watchEffect(() => updateModelValue(props.modelValue));

const isPrevDisabled = computed(() => props.modelValue === 1);
const isNextDisabled = computed(() => props.modelValue === count.value);
</script>

<template>
  <view :class="bem()">
    <view :class="bem('items')">
      <!-- Prev button -->
      <view
        v-if="showPrevButton"
        :class="bem('item', { disabled: isPrevDisabled, border: mode === 'simple', prev: true })"
        @tap="updateModelValue(modelValue - 1, true)"
      >
        <slot name="prev-text">
          <text>{{ prevText || 'Prev' }}</text>
        </slot>
      </view>

      <!-- Simple mode: page description -->
      <view v-if="mode === 'simple'" :class="bem('page-desc')">
        <slot name="pageDesc">
          <text>{{ modelValue }}/{{ count }}</text>
        </slot>
      </view>

      <!-- Multi mode: page numbers -->
      <template v-else>
        <view
          v-for="page in pages"
          :key="page.number"
          :class="bem('item', { active: !!page.active, page: true })"
          @tap="updateModelValue(page.number, true)"
        >
          <slot name="page" :number="page.number" :text="page.text" :active="page.active">
            <text>{{ page.text }}</text>
          </slot>
        </view>
      </template>

      <!-- Next button -->
      <view
        v-if="showNextButton"
        :class="bem('item', { disabled: isNextDisabled, border: mode === 'simple', next: true })"
        @tap="updateModelValue(modelValue + 1, true)"
      >
        <slot name="next-text">
          <text>{{ nextText || 'Next' }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
