<!--
  Lynx Limitations:
  - ::after hairline border: Lynx has no ::after pseudo-element
  - <i> tag: uses <view> instead (Lynx has no HTML tags)
  - CSS :first-child/:last-child selectors: may not work reliably in Lynx
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { useParent } from '../../composables/useChildren';
import { STEPS_KEY } from '../Steps/types';
import Icon from '../Icon/index.vue';
import './index.less';

const [, bem] = createNamespace('step');
const slots = useSlots();

const { parent, index } = useParent(STEPS_KEY);

const parentProps = computed(() => parent?.props);

const getStatus = () => {
  if (!parentProps.value) return 'waiting';
  const active = +parentProps.value.active;
  if (index.value < active) return 'finish';
  return index.value === active ? 'process' : 'waiting';
};

const isActive = () => getStatus() === 'process';

const lineStyle = computed(() => ({
  background:
    getStatus() === 'finish'
      ? parentProps.value?.activeColor
      : parentProps.value?.inactiveColor,
}));

const titleStyle = computed(() => {
  if (isActive()) {
    return { color: parentProps.value?.activeColor };
  }
  if (getStatus() === 'waiting') {
    return { color: parentProps.value?.inactiveColor };
  }
  return undefined;
});

const onClickStep = () => {
  parent?.onClickStep(index.value);
};
</script>

<template>
  <view
    :class="bem([parentProps?.direction, { [getStatus()]: getStatus() }])"
  >
    <view
      :class="bem('title', { active: isActive() })"
      :style="titleStyle"
      @tap="onClickStep"
    >
      <slot />
    </view>
    <view :class="bem('circle-container')" @tap="onClickStep">
      <!-- Active icon -->
      <template v-if="isActive()">
        <slot v-if="slots['active-icon']" name="active-icon" />
        <Icon
          v-else
          :class="bem('icon', 'active')"
          :name="parentProps?.activeIcon || 'checked'"
          :color="parentProps?.activeColor"
          :class-prefix="parentProps?.iconPrefix"
        />
      </template>
      <!-- Finish icon -->
      <template v-else-if="getStatus() === 'finish' && (parentProps?.finishIcon || slots['finish-icon'])">
        <slot v-if="slots['finish-icon']" name="finish-icon" />
        <Icon
          v-else
          :class="bem('icon', 'finish')"
          :name="parentProps?.finishIcon"
          :color="parentProps?.activeColor"
          :class-prefix="parentProps?.iconPrefix"
        />
      </template>
      <!-- Inactive icon -->
      <template v-else>
        <slot v-if="slots['inactive-icon']" name="inactive-icon" />
        <Icon
          v-else-if="parentProps?.inactiveIcon"
          :class="bem('icon')"
          :name="parentProps?.inactiveIcon"
          :class-prefix="parentProps?.iconPrefix"
        />
        <view v-else :class="bem('circle')" :style="lineStyle" />
      </template>
    </view>
    <view :class="bem('line')" :style="lineStyle" />
  </view>
</template>
