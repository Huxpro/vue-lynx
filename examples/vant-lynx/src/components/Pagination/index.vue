<!--
  Lynx Limitations:
  - HTML <nav>/<ul>/<li>/<button> elements: Lynx uses <view>/<text> instead
  - CSS class-based BEM styling: replaced with inline styles using CSS variable values
  - :active pseudo-class: Lynx has no :active, active feedback uses touchstart/touchend
  - cursor: not applicable in Lynx
  - user-select: not applicable in Lynx
  - role/aria-current: accessibility attributes not applicable in Lynx
  - BORDER_SURROUND: replaced with inline border styles
  - i18n (t('prev')/t('next')): no i18n system, defaults to static strings
-->
<script setup lang="ts">
import { computed, watchEffect } from 'vue-lynx';
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

  // Default page limits
  let startPage = 1;
  let endPage = pageCount;
  const isMaxSized = showPageSize < pageCount;

  // Recompute if showPageSize
  if (isMaxSized) {
    startPage = Math.max(modelValue - Math.floor(showPageSize / 2), 1);
    endPage = startPage + showPageSize - 1;

    if (endPage > pageCount) {
      endPage = pageCount;
      startPage = endPage - showPageSize + 1;
    }
  }

  // Add page number links
  for (let number = startPage; number <= endPage; number++) {
    items.push({ number, text: number, active: number === modelValue });
  }

  // Add links to move between page sets (ellipses)
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

// Format modelValue (clamp to valid range)
watchEffect(() => updateModelValue(props.modelValue));

const isPrevDisabled = computed(() => props.modelValue === 1);
const isNextDisabled = computed(() => props.modelValue === count.value);

// Styles using CSS variable fallback values
const containerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
};

function getNavBtnStyle(disabled: boolean, isSimpleBorder: boolean) {
  return {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '40px',
    paddingLeft: '4px',
    paddingRight: '4px',
    backgroundColor: disabled ? '#f7f8fa' : '#fff',
    opacity: disabled ? '0.5' : '1',
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: '#ebedf0',
    ...(isSimpleBorder
      ? {}
      : { borderRightWidth: '0px' }),
  };
}

function getNavTextStyle(disabled: boolean) {
  return {
    fontSize: '14px',
    color: disabled ? '#646566' : '#1989fa',
  };
}

function getPageBtnStyle(active: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '40px',
    backgroundColor: active ? '#1989fa' : '#fff',
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: '#ebedf0',
    borderRightWidth: '0px',
  };
}

function getPageTextStyle(active: boolean) {
  return {
    fontSize: '14px',
    color: active ? '#fff' : '#1989fa',
  };
}

const descStyle = {
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  height: '40px',
  fontSize: '14px',
  color: '#646566',
};
</script>

<template>
  <view :style="containerStyle">
    <!-- Prev button -->
    <view
      v-if="showPrevButton"
      :style="getNavBtnStyle(isPrevDisabled, mode === 'simple')"
      @tap="updateModelValue(modelValue - 1, true)"
    >
      <slot name="prev-text">
        <text :style="getNavTextStyle(isPrevDisabled)">{{ prevText || 'Prev' }}</text>
      </slot>
    </view>

    <!-- Simple mode: page description -->
    <template v-if="mode === 'simple'">
      <view :style="descStyle">
        <slot name="pageDesc">
          <text :style="{ fontSize: '14px', color: '#646566' }">{{ modelValue }}/{{ count }}</text>
        </slot>
      </view>
    </template>

    <!-- Multi mode: page numbers -->
    <template v-else>
      <view
        v-for="page in pages"
        :key="page.number"
        :style="getPageBtnStyle(!!page.active)"
        @tap="updateModelValue(page.number, true)"
      >
        <slot name="page" :number="page.number" :text="page.text" :active="page.active">
          <text :style="getPageTextStyle(!!page.active)">{{ page.text }}</text>
        </slot>
      </view>
    </template>

    <!-- Next button -->
    <view
      v-if="showNextButton"
      :style="getNavBtnStyle(isNextDisabled, mode === 'simple')"
      @tap="updateModelValue(modelValue + 1, true)"
    >
      <slot name="next-text">
        <text :style="getNavTextStyle(isNextDisabled)">{{ nextText || 'Next' }}</text>
      </slot>
    </view>
  </view>
</template>
