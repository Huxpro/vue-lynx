<!--
  Vant Feature Parity Report:
  - Props: 5/5 supported (type, name, tel, addText, editable)
  - Events: 1/1 supported (click)
  - Slots: 0/0 supported (Vant ContactCard has no slots)
  - Gaps: None - full prop and event parity achieved
-->
<script setup lang="ts">
/**
 * VantContactCard (Lynx port)
 * @see https://github.com/youzan/vant/blob/main/packages/vant/src/contact-card/ContactCard.tsx
 *
 * Feature parity: 5/5 props, 1/1 events. Full parity.
 * Lynx differences:
 *   - Custom layout instead of Vant's Cell component
 *   - "+" text icon instead of Vant's 'add-square' Icon
 *   - Unicode arrow instead of Cell isLink
 */
import { computed } from 'vue-lynx';

export interface ContactCardProps {
  type?: 'add' | 'edit';
  name?: string;
  tel?: string;
  addText?: string;
  editable?: boolean;
}

const props = withDefaults(defineProps<ContactCardProps>(), {
  type: 'add',
  name: '',
  tel: '',
  addText: 'Add Contact Info',
  editable: true,
});

const emit = defineEmits<{
  click: [event: any];
}>();

function onTap(event: any) {
  if (props.editable) {
    emit('click', event);
  }
}

const cardStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  padding: 16,
  backgroundColor: '#fff',
  borderRadius: 8,
  opacity: props.editable ? 1 : 0.6,
}));

const addIconStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#1989fa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
};
</script>

<template>
  <view :style="cardStyle" @tap="onTap">
    <template v-if="type === 'add'">
      <!-- Add mode -->
      <view :style="addIconStyle">
        <text :style="{ fontSize: 24, color: '#fff', lineHeight: 28 }">+</text>
      </view>
      <text :style="{ fontSize: 14, color: '#1989fa' }">{{ addText }}</text>
    </template>

    <template v-else>
      <!-- Edit mode -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column' }">
        <view :style="{ display: 'flex', flexDirection: 'row' as const, alignItems: 'center', marginBottom: 4 }">
          <text :style="{ fontSize: 14, color: '#323233', marginRight: 4 }">Name:</text>
          <text :style="{ fontSize: 14, color: '#323233', fontWeight: 'bold' }">{{ name }}</text>
        </view>
        <view :style="{ display: 'flex', flexDirection: 'row' as const, alignItems: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233', marginRight: 4 }">Tel:</text>
          <text :style="{ fontSize: 14, color: '#323233' }">{{ tel }}</text>
        </view>
      </view>
      <text
        v-if="editable"
        :style="{ fontSize: 14, color: '#969799' }"
      >&#x203A;</text>
    </template>
  </view>
</template>
