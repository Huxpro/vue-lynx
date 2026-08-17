<script setup lang="ts">
import { nextTick, computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Cell from '../Cell/index.vue';
import Radio from '../Radio/index.vue';
import Checkbox from '../Checkbox/index.vue';
import Tag from '../Tag/index.vue';
import Icon from '../Icon/index.vue';
import type { AddressListAddress } from './types';

const [, bem] = createNamespace('address-item');

const props = withDefaults(
  defineProps<{
    address: AddressListAddress;
    checked?: boolean;
    disabled?: boolean;
    switchable?: boolean;
    singleChoice?: boolean;
    defaultTagText?: string;
    rightIcon?: string;
  }>(),
  {
    checked: false,
    disabled: false,
    switchable: false,
    singleChoice: true,
    defaultTagText: undefined,
    rightIcon: 'edit',
  },
);

const emit = defineEmits<{
  edit: [];
  click: [event: any];
  select: [];
}>();

let checkerClicked = false;
let editClicked = false;

const rootClass = computed(() =>
  bem([{ disabled: props.disabled }]),
);

function resetFlag(flag: 'checker' | 'edit') {
  nextTick(() => {
    if (flag === 'checker') {
      checkerClicked = false;
    } else {
      editClicked = false;
    }
  });
}

function onCheckerTap() {
  checkerClicked = true;
  emit('select');
  resetFlag('checker');
}

function onEditTap(event: any) {
  editClicked = true;
  event.stopPropagation?.();
  emit('edit');
  emit('click', event);
  resetFlag('edit');
}

function onRootTap(event: any) {
  if (editClicked) {
    return;
  }

  if (!checkerClicked && props.switchable) {
    emit('select');
  }

  emit('click', event);

  if (checkerClicked) {
    resetFlag('checker');
  }
}
</script>

<template>
  <view :class="rootClass" @tap="onRootTap">
    <Cell
      :border="false"
      :title-class="bem('title')"
    >
      <template #title>
        <Radio
          v-if="switchable && !disabled && singleChoice"
          :name="address.id"
          :model-value="checked ? address.id : undefined"
          :icon-size="18"
          @click="checkerClicked = true"
          @update:model-value="onCheckerTap"
        >
          <view>
            <view :class="bem('name')">
              <text>{{ `${address.name} ${address.tel}` }}</text>
              <slot name="tag" v-bind="address">
                <Tag
                  v-if="address.isDefault && defaultTagText"
                  type="primary"
                  round
                  :class="bem('tag')"
                >{{ defaultTagText }}</Tag>
              </slot>
            </view>
            <view :class="bem('address')">
              <text>{{ address.address }}</text>
            </view>
          </view>
        </Radio>

        <Checkbox
          v-else-if="switchable && !disabled"
          :name="address.id"
          :model-value="checked"
          :bind-group="false"
          :icon-size="18"
          @click="checkerClicked = true"
          @update:model-value="onCheckerTap"
        >
          <view>
            <view :class="bem('name')">
              <text>{{ `${address.name} ${address.tel}` }}</text>
              <slot name="tag" v-bind="address">
                <Tag
                  v-if="address.isDefault && defaultTagText"
                  type="primary"
                  round
                  :class="bem('tag')"
                >{{ defaultTagText }}</Tag>
              </slot>
            </view>
            <view :class="bem('address')">
              <text>{{ address.address }}</text>
            </view>
          </view>
        </Checkbox>

        <view v-else>
          <view :class="bem('name')">
            <text>{{ `${address.name} ${address.tel}` }}</text>
            <slot name="tag" v-bind="address">
              <Tag
                v-if="address.isDefault && defaultTagText"
                type="primary"
                round
                :class="bem('tag')"
              >{{ defaultTagText }}</Tag>
            </slot>
          </view>
          <view :class="bem('address')">
            <text>{{ address.address }}</text>
          </view>
        </view>
      </template>

      <template #right-icon>
        <view @tap="onEditTap">
          <Icon :name="rightIcon" :class="bem('edit')" />
        </view>
      </template>
    </Cell>

    <slot name="bottom" v-bind="{ ...address, disabled }" />
  </view>
</template>
