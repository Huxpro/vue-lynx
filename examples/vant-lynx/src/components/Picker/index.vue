<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface PickerProps {
  columns?: string[][];
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  readonly?: boolean;
  showToolbar?: boolean;
}

const props = withDefaults(defineProps<PickerProps>(), {
  columns: () => [],
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  loading: false,
  readonly: false,
  showToolbar: true,
});

const emit = defineEmits<{
  confirm: [values: string[]];
  cancel: [];
  change: [values: string[], columnIndex: number];
}>();

// Track selected index for each column
const selectedIndexes = ref<number[]>(
  props.columns.map(() => 0),
);

watch(
  () => props.columns,
  (newCols) => {
    selectedIndexes.value = newCols.map((_, i) =>
      selectedIndexes.value[i] !== undefined ? Math.min(selectedIndexes.value[i], newCols[i].length - 1) : 0,
    );
  },
);

const selectedValues = computed(() =>
  props.columns.map((col, i) => col[selectedIndexes.value[i]] ?? ''),
);

function onConfirm() {
  if (props.readonly || props.loading) return;
  emit('confirm', selectedValues.value);
}

function onCancel() {
  emit('cancel');
}

function onSelectItem(colIndex: number, itemIndex: number) {
  if (props.readonly || props.loading) return;
  selectedIndexes.value = selectedIndexes.value.map((v, i) =>
    i === colIndex ? itemIndex : v,
  );
  emit('change', selectedValues.value, colIndex);
}

const toolbarStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between' as const,
  height: 44,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const titleStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const,
  color: '#323233',
};

const cancelBtnStyle = {
  fontSize: 14,
  color: '#969799',
  padding: 4,
};

const confirmBtnStyle = {
  fontSize: 14,
  color: '#1989fa',
  padding: 4,
};

const columnsContainerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  height: 220,
  backgroundColor: '#fff',
  overflow: 'hidden',
};

const loadingOverlayStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255,255,255,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
</script>

<template>
  <view :style="{ backgroundColor: '#fff', position: 'relative' as const }">
    <!-- Toolbar -->
    <view v-if="showToolbar" :style="toolbarStyle">
      <text :style="cancelBtnStyle" @tap="onCancel">{{ cancelButtonText }}</text>
      <text :style="titleStyle">{{ title }}</text>
      <text :style="confirmBtnStyle" @tap="onConfirm">{{ confirmButtonText }}</text>
    </view>

    <!-- Columns -->
    <view :style="columnsContainerStyle">
      <view
        v-for="(column, colIndex) in columns"
        :key="colIndex"
        :style="{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column' as const,
          position: 'relative' as const,
        }"
      >
        <!-- Selected item highlight -->
        <view
          :style="{
            position: 'absolute' as const,
            top: 88,
            left: 0,
            right: 0,
            height: 44,
            borderTopWidth: 0.5,
            borderTopStyle: 'solid' as const,
            borderTopColor: '#ebedf0',
            borderBottomWidth: 0.5,
            borderBottomStyle: 'solid' as const,
            borderBottomColor: '#ebedf0',
          }"
        />
        <!-- Items list -->
        <view
          :style="{
            paddingTop: 88,
            paddingBottom: 88,
          }"
        >
          <view
            v-for="(item, itemIndex) in column"
            :key="itemIndex"
            :style="{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
            @tap="onSelectItem(colIndex, itemIndex)"
          >
            <text
              :style="{
                fontSize: 16,
                color: selectedIndexes[colIndex] === itemIndex ? '#323233' : '#969799',
                fontWeight: selectedIndexes[colIndex] === itemIndex ? ('bold' as const) : ('normal' as const),
              }"
            >{{ item }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Loading overlay -->
    <view v-if="loading" :style="loadingOverlayStyle">
      <text :style="{ fontSize: 14, color: '#969799' }">Loading...</text>
    </view>
  </view>
</template>
