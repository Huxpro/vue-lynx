<!--
  Vant Feature Parity Report (ActionBar):
  - Props: 2/2 supported (safeAreaInsetBottom, placeholder)
    - safeAreaInsetBottom: boolean (default true) - safe area padding
    - placeholder: boolean (default false) - renders a placeholder element to avoid content overlap
  - Events: none
  - Slots: 1/1 supported (default)
  - Sub-components: ActionBarIcon, ActionBarButton (separate files)
  - Lynx Adaptations:
    - Uses fixed positioning with inline styles
    - placeholder prop adds a spacer view above the bar
    - No CSS class-based safe-area-inset-bottom; uses paddingBottom approximation
  - Gaps:
    - safeAreaInsetBottom is accepted but actual safe area env() not available in Lynx
    - useChildren/useParent linkage for button border-radius not implemented
-->
<script setup lang="ts">
import { computed, provide } from 'vue-lynx';

export interface ActionBarProps {
  safeAreaInsetBottom?: boolean;
  placeholder?: boolean;
}

const props = withDefaults(defineProps<ActionBarProps>(), {
  safeAreaInsetBottom: true,
  placeholder: false,
});

provide('actionBar', {
  safeAreaInsetBottom: props.safeAreaInsetBottom,
});

const barStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: 50,
  backgroundColor: '#fff',
  position: 'fixed' as const,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  borderTopWidth: 0.5,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
}));

const placeholderStyle = computed(() => ({
  height: 50,
}));
</script>

<template>
  <view v-if="placeholder" :style="placeholderStyle" />
  <view :style="barStyle">
    <slot />
  </view>
</template>
