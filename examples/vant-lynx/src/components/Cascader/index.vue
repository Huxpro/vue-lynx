<!--
  Lynx Limitations:
  - <ul>/<li> tags: Lynx has no HTML list tags, uses <view> instead
  - role/aria-* attributes: Lynx has no ARIA support
  - tabindex/focus: Lynx has no focus management
  - :active pseudo-class: No active state on option tap (use JS touch feedback if needed)
  - scrollIntoView: Cannot scroll selected option into view (no offsetTop/scrollTop in Lynx)
  - cursor: not-allowed: No cursor in Lynx
  - HAPTICS_FEEDBACK: No haptic feedback class in Lynx
-->
<script setup lang="ts">
import { ref, watch, nextTick, computed, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils';
import Icon from '../Icon/index.vue';
import Tabs from '../Tabs/index.vue';
import Tab from '../Tab/index.vue';
import './index.less';
import type { CascaderOption, CascaderTab, CascaderFieldNames } from './types';
import type { Numeric } from '../../utils/format';
import type { TabsClickTabEventParams } from '../Tabs/types';

const [, bem] = createNamespace('cascader');

interface CascaderProps {
  title?: string;
  options?: CascaderOption[];
  closeable?: boolean;
  swipeable?: boolean;
  closeIcon?: string;
  showHeader?: boolean;
  modelValue?: Numeric;
  fieldNames?: CascaderFieldNames;
  placeholder?: string;
  activeColor?: string;
}

const props = withDefaults(defineProps<CascaderProps>(), {
  options: () => [],
  closeable: true,
  swipeable: true,
  closeIcon: 'cross',
  showHeader: true,
  placeholder: 'Select',
});

const emit = defineEmits<{
  close: [];
  change: [params: { value: Numeric; tabIndex: number; selectedOptions: CascaderOption[] }];
  finish: [params: { value: Numeric; tabIndex: number; selectedOptions: CascaderOption[] }];
  clickTab: [name: Numeric, title: string];
  'update:modelValue': [value: Numeric];
}>();

const slots = useSlots();

const tabs = ref<CascaderTab[]>([]);
const activeTab = ref(0);

const {
  text: textKey,
  value: valueKey,
  children: childrenKey,
} = Object.assign(
  { text: 'text', value: 'value', children: 'children' },
  props.fieldNames,
);

const getSelectedOptionsByValue = (
  options: CascaderOption[],
  value: Numeric,
): CascaderOption[] | undefined => {
  for (const option of options) {
    if (option[valueKey] === value) {
      return [option];
    }
    if (option[childrenKey]) {
      const selectedOptions = getSelectedOptionsByValue(
        option[childrenKey],
        value,
      );
      if (selectedOptions) {
        return [option, ...selectedOptions];
      }
    }
  }
};

const updateTabs = () => {
  const { options, modelValue } = props;

  if (modelValue !== undefined) {
    const selectedOptions = getSelectedOptionsByValue(options, modelValue);

    if (selectedOptions) {
      let optionsCursor = options;

      tabs.value = selectedOptions.map((option) => {
        const tab: CascaderTab = {
          options: optionsCursor,
          selected: option,
        };

        const next = optionsCursor.find(
          (item) => item[valueKey] === option[valueKey],
        );
        if (next) {
          optionsCursor = next[childrenKey];
        }

        return tab;
      });

      if (optionsCursor) {
        tabs.value.push({
          options: optionsCursor,
          selected: null,
        });
      }

      nextTick(() => {
        activeTab.value = tabs.value.length - 1;
      });

      return;
    }
  }

  tabs.value = [
    {
      options,
      selected: null,
    },
  ];
};

const onSelect = (option: CascaderOption, tabIndex: number) => {
  if (option.disabled) {
    return;
  }

  tabs.value[tabIndex].selected = option;

  if (tabs.value.length > tabIndex + 1) {
    tabs.value = tabs.value.slice(0, tabIndex + 1);
  }

  if (option[childrenKey]) {
    const nextTab: CascaderTab = {
      options: option[childrenKey],
      selected: null,
    };

    if (tabs.value[tabIndex + 1]) {
      tabs.value[tabIndex + 1] = nextTab;
    } else {
      tabs.value.push(nextTab);
    }

    nextTick(() => {
      activeTab.value++;
    });
  }

  const selectedOptions = tabs.value
    .map((tab) => tab.selected)
    .filter(Boolean) as CascaderOption[];

  emit('update:modelValue', option[valueKey]);

  const params = {
    value: option[valueKey] as Numeric,
    tabIndex,
    selectedOptions,
  };
  emit('change', params);

  if (!option[childrenKey]) {
    emit('finish', params);
  }
};

const onClose = () => emit('close');

const onClickTab = (params: TabsClickTabEventParams) => {
  emit('clickTab', params.name, params.title);
};

const getOptionText = (option: CascaderOption): string => {
  return (option[textKey] as string) ?? '';
};

const isSelected = (
  option: CascaderOption,
  selectedOption: CascaderOption | null,
): boolean => {
  return !!(selectedOption && option[valueKey] === selectedOption[valueKey]);
};

const getOptionColor = (
  option: CascaderOption,
  selected: boolean,
): string | undefined => {
  return option.color || (selected ? props.activeColor : undefined);
};

updateTabs();

watch(activeTab, () => {
  // In web Vant, this scrolls the selected option into view.
  // Not available in Lynx.
});

watch(() => props.options, updateTabs, { deep: true });

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      const values = tabs.value.map((tab) => tab.selected?.[valueKey]);
      if (values.includes(value)) {
        return;
      }
    }
    updateTabs();
  },
);
</script>

<template>
  <view :class="bem()">
    <!-- Header -->
    <view v-if="showHeader" :class="bem('header')">
      <text :class="bem('title')">
        <slot name="title">{{ title }}</slot>
      </text>
      <view
        v-if="closeable"
        :class="bem('close-icon')"
        @tap="onClose"
      >
        <Icon :name="closeIcon" :class="bem('close-icon')" />
      </view>
    </view>

    <!-- Tabs -->
    <Tabs
      v-model:active="activeTab"
      shrink
      :class="bem('tabs')"
      :color="activeColor"
      :swipeable="swipeable"
      :show-header="true"
      @click-tab="onClickTab"
    >
      <Tab
        v-for="(tab, tabIndex) in tabs"
        :key="tabIndex"
        :title="tab.selected ? tab.selected[textKey] : placeholder"
        :title-class="bem('tab', { unselected: !tab.selected })"
      >
        <slot name="options-top" :tab-index="tabIndex" />
        <scroll-view
          scroll-orientation="vertical"
          :class="bem('options')"
        >
          <view
            v-for="option in tab.options"
            :key="option[valueKey]"
            :class="[
              bem('option', {
                selected: isSelected(option, tab.selected),
                disabled: !!option.disabled,
              }),
              option.className,
            ]"
            :style="getOptionColor(option, isSelected(option, tab.selected)) ? { color: getOptionColor(option, isSelected(option, tab.selected)) } : undefined"
            @tap="onSelect(option, tabIndex)"
          >
            <slot name="option" :option="option" :selected="isSelected(option, tab.selected)">
              <text :class="bem('option-text')">{{ option[textKey] }}</text>
            </slot>
            <Icon
              v-if="isSelected(option, tab.selected)"
              name="success"
              :class="bem('selected-icon')"
            />
          </view>
        </scroll-view>
        <slot name="options-bottom" :tab-index="tabIndex" />
      </Tab>
    </Tabs>
  </view>
</template>
