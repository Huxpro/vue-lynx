<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as view/text (Lynx has no HTML tags)
  - ::before pseudo-element: Lynx has no ::before, so icon characters are rendered
    directly in a <text> element with font-family: 'vant-icon' instead
  - classPrefix: works for class naming but custom icon fonts need separate @font-face setup
  - ConfigProvider iconPrefix injection: not yet supported
-->
<script setup lang="ts">
import { computed, inject } from 'vue-lynx';
import { createNamespace, addUnit, isImage } from '../../utils';
import Badge from '../Badge/index.vue';
import { CONFIG_PROVIDER_KEY } from '../ConfigProvider/types';
import { iconProps } from './types';
import './index.less';

const [name, bem] = createNamespace('icon');

const props = defineProps(iconProps);

const emit = defineEmits<{
  (e: 'click', event: any): void;
}>();

const config = inject(CONFIG_PROVIDER_KEY, null);

const classPrefix = computed(
  () => props.classPrefix || config?.iconPrefix || name,
);

const isImageIcon = computed(() => isImage(props.name));

const iconStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.color) {
    style.color = props.color;
  }
  if (props.size) {
    style.fontSize = addUnit(props.size);
  }
  return style;
});

const imageStyle = computed(() => {
  if (props.size === undefined) return undefined;
  const s = addUnit(props.size);
  return s ? { width: s, height: s } : undefined;
});

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view
    :is="props.tag"
    :class="[
      classPrefix,
      isImageIcon ? '' : `${classPrefix}-${props.name}`,
      bem({ spin: props.spin }),
    ]"
    :style="iconStyle"
    @tap="onTap"
  >
    <slot />
    <image
      v-if="isImageIcon"
      :src="props.name"
      :class="bem('image')"
      :style="imageStyle"
    />
    <Badge
      v-if="props.dot || props.badge"
      :dot="props.dot"
      :content="props.badge"
      :class="bem('badge')"
      v-bind="props.badgeProps"
    />
  </view>
</template>
