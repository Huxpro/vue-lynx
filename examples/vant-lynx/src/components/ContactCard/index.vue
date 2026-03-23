<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as view (Lynx has no HTML tags)
  - ::before stripe pattern: Lynx has no pseudo-elements, uses a <view> element instead
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Cell from '../Cell/index.vue';
import Icon from '../Icon/index.vue';
import type { ContactCardType } from './types';
import './index.less';

export interface ContactCardProps {
  tel?: string;
  name?: string;
  type?: ContactCardType;
  addText?: string;
  editable?: boolean;
}

const props = withDefaults(defineProps<ContactCardProps>(), {
  type: 'add',
  editable: true,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const [, bem] = createNamespace('contact-card');

const onClick = (event: any) => {
  if (props.editable) {
    emit('click', event);
  }
};
</script>

<template>
  <view :class="bem([type])" @tap="onClick">
    <Cell
      center
      :icon="type === 'edit' ? 'contact' : 'add-square'"
      :border="false"
      :is-link="editable"
      :title-class="bem('title')"
    >
      <template #title>
        <template v-if="type === 'add'">
          <text>{{ addText || '添加联系人' }}</text>
        </template>
        <template v-else>
          <view>
            <text>联系人：{{ name }}</text>
          </view>
          <view>
            <text>联系电话：{{ tel }}</text>
          </view>
        </template>
      </template>
    </Cell>
    <!-- Stripe decoration (replaces ::before pseudo-element in Vant) -->
    <view :class="bem('stripe')" />
  </view>
</template>
