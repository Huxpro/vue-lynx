<!--
  Lynx Limitations:
  - autoLocate: no getContainingBlock/getBoundingClientRect in Lynx
  - closeOnClickOutside: no document-level event delegation in Lynx; uses overlay tap instead
  - scroll tracking: no scrollParent/addEventListener('scroll') in Lynx
  - swipeThreshold: prop accepted, uses <scroll-view> for horizontal scroll in Lynx
-->
<script setup lang="ts">
import { provide, ref, computed, shallowReactive } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import type {
  DropdownMenuDirection,
  DropdownChildExpose,
  DropdownMenuProvide,
} from './types';
import { DROPDOWN_KEY } from './types';
import './index.less';

const [, bem] = createNamespace('dropdown-menu');

const props = withDefaults(
  defineProps<{
    overlay?: boolean;
    zIndex?: number | string;
    duration?: number | string;
    direction?: DropdownMenuDirection;
    activeColor?: string;
    autoLocate?: boolean;
    closeOnClickOutside?: boolean;
    closeOnClickOverlay?: boolean;
    swipeThreshold?: number | string;
  }>(),
  {
    overlay: true,
    duration: 0.2,
    direction: 'down',
    closeOnClickOutside: true,
    closeOnClickOverlay: true,
  },
);

const children = shallowReactive<DropdownChildExpose[]>([]);

const opened = computed(() => children.some((child) => child.state.showWrapper));

const scrollable = computed(
  () =>
    props.swipeThreshold && children.length > Number(props.swipeThreshold),
);

const barClass = computed(() =>
  bem('bar', {
    opened: opened.value,
    scrollable: !!scrollable.value,
  }),
);

const barStyle = computed(() => {
  const style: Record<string, any> = {};
  if (opened.value && isDef(props.zIndex)) {
    style.zIndex = Number(props.zIndex) + 1;
  }
  return style;
});

function registerChild(child: DropdownChildExpose) {
  children.push(child);
}

function unregisterChild(child: DropdownChildExpose) {
  const idx = children.indexOf(child);
  if (idx !== -1) children.splice(idx, 1);
}

function toggleItem(child: DropdownChildExpose) {
  children.forEach((c) => {
    if (c === child) {
      c.toggle();
    } else if (c.state.showPopup) {
      c.toggle(false, { immediate: true });
    }
  });
}

function close() {
  children.forEach((c) => c.toggle(false));
}

defineExpose({
  close,
  opened,
});

provide<DropdownMenuProvide>(DROPDOWN_KEY, {
  props: props as any,
  offset: ref(0),
  opened,
  close,
  registerChild,
  unregisterChild,
  toggleItem,
});
</script>

<template>
  <view :class="bem()">
    <view :class="barClass" :style="barStyle">
      <scroll-view
        v-if="scrollable"
        scroll-orientation="horizontal"
        :style="{ flexDirection: 'row', display: 'flex' }"
      >
        <slot />
      </scroll-view>
      <template v-else>
        <slot />
      </template>
    </view>
  </view>
</template>
