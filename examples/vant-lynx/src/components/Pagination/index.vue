<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface PaginationProps {
  modelValue?: number;
  mode?: 'simple' | 'multi';
  pageCount?: number;
  totalItems?: number;
  itemsPerPage?: number;
  showPageSize?: number;
  forceEllipses?: boolean;
  prevText?: string;
  nextText?: string;
}

const props = withDefaults(defineProps<PaginationProps>(), {
  modelValue: 1,
  mode: 'multi',
  pageCount: 0,
  totalItems: 0,
  itemsPerPage: 10,
  showPageSize: 5,
  forceEllipses: false,
  prevText: 'Prev',
  nextText: 'Next',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const totalPages = computed(() => {
  if (props.pageCount > 0) return props.pageCount;
  return Math.ceil(props.totalItems / props.itemsPerPage) || 1;
});

const pages = computed(() => {
  const total = totalPages.value;
  const current = props.modelValue;
  const showSize = props.showPageSize;

  if (props.mode === 'simple') {
    return [];
  }

  const items: Array<{ number: number; text: string; active: boolean }> = [];

  // Calculate start and end
  let startPage = 1;
  let endPage = total;

  if (total > showSize) {
    const half = Math.floor(showSize / 2);
    startPage = Math.max(1, current - half);
    endPage = startPage + showSize - 1;

    if (endPage > total) {
      endPage = total;
      startPage = Math.max(1, endPage - showSize + 1);
    }
  }

  // Add ellipsis at start
  if (props.forceEllipses && startPage > 1) {
    items.push({ number: 1, text: '1', active: current === 1 });
    if (startPage > 2) {
      items.push({ number: -1, text: '...', active: false });
    }
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    items.push({
      number: i,
      text: String(i),
      active: i === current,
    });
  }

  // Add ellipsis at end
  if (props.forceEllipses && endPage < total) {
    if (endPage < total - 1) {
      items.push({ number: -2, text: '...', active: false });
    }
    items.push({ number: total, text: String(total), active: current === total });
  }

  return items;
});

const isPrevDisabled = computed(() => props.modelValue <= 1);
const isNextDisabled = computed(() => props.modelValue >= totalPages.value);

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === props.modelValue) return;
  emit('update:modelValue', page);
  emit('change', page);
}

function prevPage() {
  if (!isPrevDisabled.value) {
    goToPage(props.modelValue - 1);
  }
}

function nextPage() {
  if (!isNextDisabled.value) {
    goToPage(props.modelValue + 1);
  }
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'center',
};

function getNavBtnStyle(disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: disabled ? '#f7f8fa' : '#fff',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#ebedf0',
    borderRadius: 4,
  };
}

function getNavTextStyle(disabled: boolean) {
  return {
    fontSize: 14,
    color: disabled ? '#c8c9cc' : '#323233',
  };
}

function getPageBtnStyle(active: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: active ? '#1989fa' : '#fff',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: active ? '#1989fa' : '#ebedf0',
    borderRadius: 4,
    marginLeft: 4,
    marginRight: 4,
  };
}

function getPageTextStyle(active: boolean) {
  return {
    fontSize: 14,
    color: active ? '#fff' : '#323233',
    fontWeight: active ? ('bold' as const) : ('normal' as const),
  };
}

const simpleTextStyle = {
  fontSize: 14,
  color: '#323233',
  marginLeft: 12,
  marginRight: 12,
};
</script>

<template>
  <view :style="containerStyle">
    <!-- Prev button -->
    <view :style="getNavBtnStyle(isPrevDisabled)" @tap="prevPage">
      <text :style="getNavTextStyle(isPrevDisabled)">{{ prevText }}</text>
    </view>

    <!-- Simple mode: page indicator -->
    <template v-if="mode === 'simple'">
      <text :style="simpleTextStyle">{{ modelValue }}/{{ totalPages }}</text>
    </template>

    <!-- Multi mode: page numbers -->
    <template v-else>
      <view
        v-for="page in pages"
        :key="page.number"
        :style="getPageBtnStyle(page.active)"
        @tap="page.number > 0 ? goToPage(page.number) : undefined"
      >
        <text :style="getPageTextStyle(page.active)">{{ page.text }}</text>
      </view>
    </template>

    <!-- Next button -->
    <view :style="getNavBtnStyle(isNextDisabled)" @tap="nextPage">
      <text :style="getNavTextStyle(isNextDisabled)">{{ nextText }}</text>
    </view>
  </view>
</template>
