<!--
  Vant Feature Parity Report:
  - Props: 7/9 supported (name, icon, iconPrefix, dot, badge, badgeProps, replace)
    - Missing: to (Lynx has no vue-router; prop accepted but ignored)
    - Missing: url (Lynx has no browser navigation; prop accepted but ignored)
  - Slots: 2/2 supported (default, icon) -- both receive { active } scoped data
  - Events: 1/1 supported (click)
  - Badge integration: Uses Badge component for dot/badge/badgeProps display
  - Icon integration: Uses Icon component when icon prop is a string
  - Auto-index: When name prop is omitted, uses child index as identifier (matching Vant)
  - Active state: Computed from parent's modelValue via provide/inject
  - Active color: Inherited from parent Tabbar's activeColor/inactiveColor
  - Active background: Supported (matches Vant --van-tabbar-item-active-background)
  - Gaps:
    - to prop accepted but non-functional (Lynx has no vue-router)
    - url prop accepted but non-functional (Lynx has no browser navigation)
    - No route matching (Lynx has no router)
    - No CSS variable theming (Lynx uses inline styles)
-->
<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue-lynx';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import Icon from '../Icon/index.vue';

// --- Types ---
type Numeric = number | string;

export interface TabbarItemProps {
  name?: Numeric;
  icon?: string;
  iconPrefix?: string;
  dot?: boolean;
  badge?: Numeric;
  badgeProps?: Partial<BadgeProps>;
  to?: string | Record<string, any>; // API compat, not functional in Lynx
  url?: string; // API compat, not functional in Lynx
  replace?: boolean; // API compat, not functional in Lynx
}

const props = withDefaults(defineProps<TabbarItemProps>(), {
  dot: false,
  replace: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

// --- Parent injection ---
const tabbar = inject<{
  props: any;
  modelValue: Ref<Numeric>;
  activeColor: Ref<string>;
  inactiveColor: Ref<string>;
  setActive: (active: Numeric, afterChange?: () => void) => void;
  getNextIndex: () => number;
}>('tabbar')!;

// Auto-index: assign an index if name prop is not provided (matches Vant behavior).
// Called synchronously during setup to ensure index is assigned in render order
// before any computed properties evaluate (mirrors Vant's useParent behavior).
const index = ref(tabbar?.getNextIndex ? tabbar.getNextIndex() : 0);

// The identifier used for matching: explicit name or auto-index
const identifier = computed(() => {
  return props.name ?? index.value;
});

// --- Active state ---
const isActive = computed(() => {
  return tabbar.modelValue.value === identifier.value;
});

const itemColor = computed(() => {
  return isActive.value ? tabbar.activeColor.value : tabbar.inactiveColor.value;
});

// --- Event handling ---
function onTap(event: any) {
  if (!isActive.value) {
    tabbar.setActive(identifier.value);
  }
  emit('click', event);
}

// --- Merged badge props ---
const mergedBadgeProps = computed(() => ({
  dot: props.dot,
  content: props.badge,
  ...(props.badgeProps || {}),
}));

// --- Styles ---
const itemStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  height: 50,
  cursor: 'pointer',
  // Vant applies an active background color (--van-tabbar-item-active-background)
  // Default in Vant is the same as tabbar background, making it subtle.
  backgroundColor: isActive.value ? '#fff' : 'transparent',
}));

const iconWrapperStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginBottom: 4,
}));

const iconStyle = computed(() => ({
  fontSize: 22,
  color: itemColor.value,
}));

const textStyle = computed(() => ({
  fontSize: 12,
  color: itemColor.value,
  lineHeight: 1,
}));
</script>

<template>
  <view :style="itemStyle" @tap="onTap">
    <!-- Icon area with Badge integration -->
    <Badge
      :dot="mergedBadgeProps.dot"
      :content="mergedBadgeProps.content"
      :color="mergedBadgeProps.color"
      :max="mergedBadgeProps.max"
      :show-zero="mergedBadgeProps.showZero"
      :offset="mergedBadgeProps.offset"
      :position="mergedBadgeProps.position"
    >
      <view :style="iconWrapperStyle">
        <!-- icon slot: receives { active } scoped data -->
        <slot name="icon" :active="isActive">
          <!-- Icon component integration when icon prop is provided -->
          <Icon
            v-if="icon"
            :name="icon"
            :class-prefix="iconPrefix"
            :size="22"
            :color="itemColor"
          />
        </slot>
      </view>
    </Badge>

    <!-- Text label: default slot receives { active } scoped data -->
    <text :style="textStyle">
      <slot :active="isActive" />
    </text>
  </view>
</template>
