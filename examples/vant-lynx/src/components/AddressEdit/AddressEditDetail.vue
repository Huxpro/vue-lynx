<!--
  AddressEditDetail sub-component
  Handles detail address textarea + search results dropdown
  @see https://github.com/youzan/vant/blob/main/packages/vant/src/address-edit/AddressEditDetail.tsx
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Field from '../Field/index.vue';
import Cell from '../Cell/index.vue';
import type { AddressEditSearchItem } from './types';
import type { FieldRule } from '../Field/types';

const [, bem] = createNamespace('address-edit-detail');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    rows?: number | string;
    value?: string;
    rules?: FieldRule[];
    focused?: boolean;
    maxlength?: number | string;
    searchResult?: AddressEditSearchItem[];
    showSearchResult?: boolean;
  }>(),
  {
    show: true,
    rows: 1,
    value: '',
    focused: false,
    maxlength: 200,
    showSearchResult: false,
  },
);

const emit = defineEmits<{
  blur: [event: Event];
  focus: [event: Event];
  input: [value: string];
  selectSearch: [item: AddressEditSearchItem];
}>();

const shouldShowSearchResult = computed(
  () => props.focused && props.searchResult && props.showSearchResult,
);

const onSelect = (express: AddressEditSearchItem) => {
  emit('selectSearch', express);
  emit('input', `${express.address || ''} ${express.name || ''}`.trim());
};

const onBlur = (event: Event) => emit('blur', event);
const onFocus = (event: Event) => emit('focus', event);
const onInput = (value: string) => emit('input', value);
</script>

<template>
  <template v-if="show">
    <Field
      autosize
      clearable
      :class="bem()"
      :rows="rows"
      type="textarea"
      :rules="rules"
      label="详细地址"
      :border="!shouldShowSearchResult"
      :maxlength="maxlength"
      :model-value="value"
      placeholder="详细地址"
      :label-width="'4.1em'"
      @blur="onBlur"
      @focus="onFocus"
      @update:model-value="onInput"
    />
    <template v-if="shouldShowSearchResult">
      <Cell
        v-for="(item, index) in searchResult"
        :key="(item.name || '') + (item.address || '') + index"
        clickable
        icon="location-o"
        :title="item.name"
        :label="item.address"
        :class="bem('search-item')"
        :border="false"
        @click="onSelect(item)"
      />
    </template>
  </template>
</template>
