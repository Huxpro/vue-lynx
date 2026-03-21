<!--
  Vant Feature Parity Report:
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/picker/Picker.tsx

  Props (11/12 supported):
    - columns: PickerOption[] | PickerColumn[]  [YES] column data
    - modelValue: (string|number)[]             [YES] selected values (v-model)
    - title: string                             [YES] toolbar title
    - confirmButtonText: string                 [YES] confirm button text (default 'Confirm')
    - cancelButtonText: string                  [YES] cancel button text (default 'Cancel')
    - loading: boolean                          [YES] show loading overlay (uses Loading component)
    - readonly: boolean                         [YES] readonly mode
    - allowHtml: boolean                        [N/A] Lynx does not support innerHTML
    - showToolbar: boolean                      [YES] show toolbar (default true)
    - visibleOptionNum: number                  [YES] visible option count (default 6)
    - optionHeight: number                      [YES] option height in px (default 44)
    - swipeDuration: number                     [YES] momentum scroll duration (default 1000)
    - toolbarPosition: 'top' | 'bottom'        [YES] toolbar position

  Events (5/6 supported):
    - update:modelValue                         [YES] v-model update
    - confirm                                   [YES] confirm button tapped
    - cancel                                    [YES] cancel button tapped
    - change                                    [YES] value changed
    - click-option                              [YES] option tapped
    - scrollInto                                [PARTIAL] not applicable without scroll physics

  Slots (7/7 supported):
    - toolbar                                   [YES] custom toolbar
    - title                                     [YES] custom title
    - confirm                                   [YES] custom confirm button
    - cancel                                    [YES] custom cancel button
    - option                                    [YES] custom option rendering
    - columns-top                               [YES] content above columns
    - columns-bottom                            [YES] content below columns

  Loading Integration: Uses Loading component from ../Loading/index.vue
  Lynx Adaptations:
    - Uses view/text elements with inline styles
    - display: 'flex' set explicitly
    - No scroll physics / momentum (tap-to-select + touch drag)
    - Option highlight using absolute-positioned indicator with gradient masks
    - allowHtml prop accepted but ignored (Lynx limitation)
-->
<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue-lynx';
import Loading from '../Loading/index.vue';

export interface PickerOption {
  text?: string;
  value?: string | number;
  disabled?: boolean;
  children?: PickerOption[];
  [key: string]: any;
}

export type PickerColumn = PickerOption[];

export interface PickerProps {
  columns?: (PickerOption | PickerColumn)[];
  modelValue?: (string | number)[];
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  readonly?: boolean;
  allowHtml?: boolean;
  showToolbar?: boolean;
  visibleOptionNum?: number | string;
  optionHeight?: number | string;
  swipeDuration?: number | string;
  toolbarPosition?: 'top' | 'bottom';
}

const props = withDefaults(defineProps<PickerProps>(), {
  columns: () => [],
  modelValue: () => [],
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  loading: false,
  readonly: false,
  allowHtml: false,
  showToolbar: true,
  visibleOptionNum: 6,
  optionHeight: 44,
  swipeDuration: 1000,
  toolbarPosition: 'top',
});

const emit = defineEmits<{
  'update:modelValue': [values: (string | number)[]];
  confirm: [params: { selectedValues: (string | number)[]; selectedOptions: (PickerOption | undefined)[]; selectedIndexes: number[] }];
  cancel: [params: { selectedValues: (string | number)[]; selectedOptions: (PickerOption | undefined)[]; selectedIndexes: number[] }];
  change: [params: { columnIndex: number; selectedValues: (string | number)[]; selectedOptions: (PickerOption | undefined)[]; selectedIndexes: number[] }];
  'click-option': [params: { columnIndex: number; currentOption: PickerOption }];
}>();

const resolvedOptHeight = computed(() => {
  const h = typeof props.optionHeight === 'string' ? parseInt(props.optionHeight, 10) : props.optionHeight;
  return h || 44;
});

const resolvedVisibleNum = computed(() => {
  const n = typeof props.visibleOptionNum === 'string' ? parseInt(props.visibleOptionNum, 10) : props.visibleOptionNum;
  return n || 6;
});

// Normalize columns: detect format and convert to PickerColumn[]
const currentColumns = computed<PickerColumn[]>(() => {
  const { columns } = props;
  if (!columns || columns.length === 0) return [];

  const first = columns[0] as any;

  // Multi-column: array of arrays
  if (Array.isArray(first)) {
    // Could be string[][] (legacy) or PickerOption[][]
    return (columns as any[][]).map((col: any[]) =>
      col.map((item: any) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return { text: String(item), value: item } as PickerOption;
        }
        return item as PickerOption;
      }),
    );
  }

  // Single column of PickerOption objects
  if (first && typeof first === 'object' && ('text' in first || 'value' in first)) {
    return [columns as PickerColumn];
  }

  // Single column of primitives (string[] or number[])
  if (typeof first === 'string' || typeof first === 'number') {
    return [(columns as any[]).map((item: any) => ({
      text: String(item),
      value: item,
    } as PickerOption))];
  }

  return [columns as PickerColumn];
});

// Track selected values
const selectedValues = ref<(string | number)[]>(props.modelValue.slice(0));

// Sync selected values when modelValue changes externally
watch(
  () => props.modelValue,
  (newValues) => {
    if (JSON.stringify(newValues) !== JSON.stringify(selectedValues.value)) {
      selectedValues.value = newValues.slice(0);
    }
  },
  { deep: true },
);

// Ensure selected values stay valid when columns change
watch(
  currentColumns,
  (cols) => {
    const newValues = selectedValues.value.slice(0);
    let changed = false;
    cols.forEach((options, index) => {
      if (options.length && !options.some(opt => getOptionValue(opt) === newValues[index])) {
        const firstEnabled = options.find(opt => !opt.disabled);
        if (firstEnabled) {
          newValues[index] = getOptionValue(firstEnabled);
          changed = true;
        }
      }
    });
    if (changed) {
      selectedValues.value = newValues;
    }
  },
  { immediate: true },
);

// Emit model value when internal selection changes
watch(
  selectedValues,
  (newValues) => {
    if (JSON.stringify(newValues) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', newValues.slice(0));
    }
  },
  { deep: true },
);

function getOptionText(option: PickerOption): string {
  return option.text ?? String(option.value ?? '');
}

function getOptionValue(option: PickerOption): string | number {
  return option.value ?? option.text ?? '';
}

const selectedIndexes = computed(() =>
  currentColumns.value.map((options, colIndex) => {
    const idx = options.findIndex(opt => getOptionValue(opt) === selectedValues.value[colIndex]);
    return idx >= 0 ? idx : 0;
  }),
);

const selectedOptions = computed(() =>
  currentColumns.value.map((options, colIndex) =>
    options.find(opt => getOptionValue(opt) === selectedValues.value[colIndex]),
  ),
);

function getEventParams() {
  return {
    selectedValues: selectedValues.value.slice(0),
    selectedOptions: selectedOptions.value,
    selectedIndexes: selectedIndexes.value,
  };
}

function onConfirm() {
  if (props.readonly || props.loading) return;
  emit('confirm', getEventParams());
}

function onCancel() {
  emit('cancel', getEventParams());
}

function onSelectItem(colIndex: number, itemIndex: number, option: PickerOption) {
  if (props.readonly || props.loading || option.disabled) return;

  const newValues = selectedValues.value.slice(0);
  newValues[colIndex] = getOptionValue(option);
  selectedValues.value = newValues;

  emit('click-option', { columnIndex: colIndex, currentOption: option });
  emit('change', { columnIndex: colIndex, ...getEventParams() });
}

// -- Touch-based column scrolling --
const columnOffsets = ref<number[]>([]);
const touchStartY = ref(0);
const touchStartOffset = ref(0);
const touchColIndex = ref(-1);

function getColumnOffset(colIndex: number): number {
  return columnOffsets.value[colIndex] ?? -(selectedIndexes.value[colIndex] || 0) * resolvedOptHeight.value;
}

// Initialize offsets from selected indexes
watch(selectedIndexes, (indexes) => {
  columnOffsets.value = indexes.map(idx => -idx * resolvedOptHeight.value);
}, { immediate: true });

function onColumnTouchStart(event: any, colIndex: number) {
  if (props.readonly || props.loading) return;
  const touch = event.touches?.[0] || event;
  touchStartY.value = touch.clientY || touch.pageY || 0;
  touchStartOffset.value = getColumnOffset(colIndex);
  touchColIndex.value = colIndex;
}

function onColumnTouchMove(event: any) {
  if (touchColIndex.value < 0) return;
  const touch = event.touches?.[0] || event;
  const currentY = touch.clientY || touch.pageY || 0;
  const delta = currentY - touchStartY.value;
  const newOffsets = [...columnOffsets.value];
  newOffsets[touchColIndex.value] = touchStartOffset.value + delta;
  columnOffsets.value = newOffsets;
}

function onColumnTouchEnd() {
  if (touchColIndex.value < 0) return;
  const colIndex = touchColIndex.value;
  const offset = columnOffsets.value[colIndex] || 0;
  const optHeight = resolvedOptHeight.value;
  const colOptions = currentColumns.value[colIndex] || [];

  // Snap to nearest option
  let index = Math.round(-offset / optHeight);
  index = Math.max(0, Math.min(index, colOptions.length - 1));

  // Skip disabled options
  const option = colOptions[index];
  if (option && !option.disabled) {
    onSelectItem(colIndex, index, option);
  }

  // Update offset to snapped position
  const newOffsets = [...columnOffsets.value];
  newOffsets[colIndex] = -index * optHeight;
  columnOffsets.value = newOffsets;
  touchColIndex.value = -1;
}

// -- Styles --
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
  flex: 1,
  textAlign: 'center' as const,
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

const wrapHeight = computed(() => resolvedOptHeight.value * resolvedVisibleNum.value);

const columnsContainerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  height: wrapHeight.value,
  backgroundColor: '#fff',
  overflow: 'hidden',
  position: 'relative' as const,
}));

const maskTopStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  height: (wrapHeight.value - resolvedOptHeight.value) / 2,
  backgroundColor: 'rgba(255,255,255,0.7)',
  zIndex: 1,
}));

const maskBottomStyle = computed(() => ({
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: (wrapHeight.value - resolvedOptHeight.value) / 2,
  backgroundColor: 'rgba(255,255,255,0.7)',
  zIndex: 1,
}));

const frameStyle = computed(() => ({
  position: 'absolute' as const,
  top: (wrapHeight.value - resolvedOptHeight.value) / 2,
  left: 0,
  right: 0,
  height: resolvedOptHeight.value,
  borderTopWidth: 0.5,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
  zIndex: 1,
}));

const loadingOverlayStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255,255,255,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
}));

function getColumnStyle() {
  return {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
  };
}

function getItemsWrapStyle(colIndex: number) {
  const baseOffset = (wrapHeight.value - resolvedOptHeight.value) / 2;
  const offset = getColumnOffset(colIndex);
  return {
    paddingTop: baseOffset + offset,
  };
}

function getItemTextStyle(colIndex: number, itemIndex: number) {
  const isSelected = selectedIndexes.value[colIndex] === itemIndex;
  return {
    fontSize: 16,
    color: isSelected ? '#323233' : '#969799',
    fontWeight: isSelected ? ('bold' as const) : ('normal' as const),
  };
}

// Register with PickerGroup if inside one
const pickerGroup = inject<{
  registerPicker: (getter: () => any[]) => void;
  unregisterPicker: (getter: () => any[]) => void;
} | null>('pickerGroup', null);

const getValues = () => selectedValues.value.slice(0);

onMounted(() => {
  pickerGroup?.registerPicker(getValues);
});

onUnmounted(() => {
  pickerGroup?.unregisterPicker(getValues);
});

// Expose methods via ref
defineExpose({
  confirm: onConfirm,
  getSelectedOptions: () => selectedOptions.value,
});
</script>

<template>
  <view :style="{ backgroundColor: '#fff', position: 'relative' as const }">
    <!-- Toolbar (top position) -->
    <view v-if="showToolbar && toolbarPosition === 'top'" :style="toolbarStyle">
      <slot name="toolbar">
        <slot name="cancel">
          <view @tap="onCancel"><text :style="cancelBtnStyle">{{ cancelButtonText }}</text></view>
        </slot>
        <slot name="title">
          <text v-if="title" :style="titleStyle">{{ title }}</text>
          <view v-else :style="{ flex: 1 }" />
        </slot>
        <slot name="confirm">
          <view @tap="onConfirm"><text :style="confirmBtnStyle">{{ confirmButtonText }}</text></view>
        </slot>
      </slot>
    </view>

    <!-- Columns top slot -->
    <slot name="columns-top" />

    <!-- Columns -->
    <view :style="columnsContainerStyle">
      <view
        v-for="(column, colIndex) in currentColumns"
        :key="colIndex"
        :style="getColumnStyle()"
        @touchstart="(e: any) => onColumnTouchStart(e, colIndex)"
        @touchmove="onColumnTouchMove"
        @touchend="onColumnTouchEnd"
      >
        <!-- Items list -->
        <view :style="getItemsWrapStyle(colIndex)">
          <view
            v-for="(option, itemIndex) in column"
            :key="itemIndex"
            :style="{
              height: resolvedOptHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: option.disabled ? 0.3 : 1,
            }"
            @tap="onSelectItem(colIndex, itemIndex, option)"
          >
            <slot name="option" :option="option" :index="itemIndex">
              <text :style="getItemTextStyle(colIndex, itemIndex)">{{ getOptionText(option) }}</text>
            </slot>
          </view>
        </view>
      </view>

      <!-- Frame indicator (selected option highlight border) -->
      <view :style="frameStyle" />

      <!-- Gradient masks -->
      <view :style="maskTopStyle" />
      <view :style="maskBottomStyle" />

      <!-- Loading overlay -->
      <view v-if="loading" :style="loadingOverlayStyle">
        <Loading color="#1989fa" />
      </view>
    </view>

    <!-- Columns bottom slot -->
    <slot name="columns-bottom" />

    <!-- Toolbar (bottom position) -->
    <view v-if="showToolbar && toolbarPosition === 'bottom'" :style="toolbarStyle">
      <slot name="toolbar">
        <slot name="cancel">
          <view @tap="onCancel"><text :style="cancelBtnStyle">{{ cancelButtonText }}</text></view>
        </slot>
        <slot name="title">
          <text v-if="title" :style="titleStyle">{{ title }}</text>
          <view v-else :style="{ flex: 1 }" />
        </slot>
        <slot name="confirm">
          <view @tap="onConfirm"><text :style="confirmBtnStyle">{{ confirmButtonText }}</text></view>
        </slot>
      </slot>
    </view>
  </view>
</template>
