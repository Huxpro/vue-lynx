<!--
  Lynx Limitations:
  - titleClass: Lynx has no CSS class system, uses inline styles only
  - titleStyle: Partially supported (passed to parent, but Lynx cannot apply CSS class-level styling)
  - url/to/replace: Lynx has no vue-router, navigation props are no-op
  - SwipeItem animated mode: Lynx lacks CSS transition on translateX for content swap
  - scrollspy mode: Lynx has no scroll event interception on parent
  - role/tabindex/aria-* attributes: Not applicable in Lynx
-->
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, watch, ref, useSlots, nextTick, type Ref, type CSSProperties } from 'vue-lynx';

type Numeric = string | number;

interface TabsProvide {
  active: Ref<Numeric>;
  type: Ref<'line' | 'card'>;
  color: Ref<string>;
  lazyRender: Ref<boolean>;
  scrollspy: Ref<boolean>;
  titleActiveColor: Ref<string | undefined>;
  titleInactiveColor: Ref<string | undefined>;
  shrink: Ref<boolean>;
  ellipsis: Ref<boolean>;
  scrollable: Ref<boolean>;
  registerTab: (tab: any) => void;
  unregisterTab: (name: Numeric) => void;
  updateTab: (name: Numeric, updates: Record<string, any>) => void;
  setActive: (name: Numeric, title: string) => void;
  onRendered: (name: Numeric, title?: string) => void;
  getTabIndex: () => number;
}

const props = withDefaults(defineProps<{
  /** Tab header title text */
  title?: string;
  /** Disable this tab */
  disabled?: boolean;
  /** Show red dot indicator on header */
  dot?: boolean;
  /** Show badge number/text on header */
  badge?: Numeric;
  /** Custom tab identifier (defaults to index) */
  name?: Numeric;
  /** Custom title class (no-op in Lynx) */
  titleClass?: unknown;
  /** Custom title style */
  titleStyle?: string | CSSProperties;
  /** Show badge when value is zero */
  showZeroBadge?: boolean;
  /** URL to redirect to (no-op in Lynx) */
  url?: string;
  /** Vue Router target (no-op in Lynx) */
  to?: string | Record<string, unknown>;
  /** Replace current navigation (no-op in Lynx) */
  replace?: boolean;
}>(), {
  title: '',
  disabled: false,
  dot: false,
  showZeroBadge: true,
  replace: false,
});

const slots = useSlots();

const tabsContext = inject<TabsProvide>('tabs');

if (!tabsContext) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Vant] <Tab> must be a child component of <Tabs>.');
  }
}

// Auto-index: get a stable index from parent on creation
const autoIndex = tabsContext ? tabsContext.getTabIndex() : 0;

// The effective name for this tab
const tabName = computed((): Numeric => {
  return props.name !== undefined ? props.name : autoIndex;
});

// Whether this tab is currently active
const isActive = computed(() => {
  return tabsContext ? tabsContext.active.value === tabName.value : false;
});

// Lazy render state: once rendered, stays rendered
const inited = ref(false);

const shouldRender = computed(() => {
  if (inited.value) return true;
  if (tabsContext?.scrollspy.value) return true;
  if (tabsContext && !tabsContext.lazyRender.value) return true;
  return isActive.value;
});

// Track first activation for lazy render + rendered event
watch(isActive, (val) => {
  if (val && !inited.value) {
    inited.value = true;
    if (tabsContext?.lazyRender.value) {
      nextTick(() => {
        tabsContext.onRendered(tabName.value, props.title);
      });
    }
  }
}, { immediate: true });

// Register with parent
onMounted(() => {
  if (tabsContext) {
    tabsContext.registerTab({
      name: tabName.value,
      title: props.title,
      disabled: props.disabled,
      dot: props.dot,
      badge: props.badge,
      showZeroBadge: props.showZeroBadge,
      titleSlot: !!slots.title,
      titleStyle: props.titleStyle,
      index: autoIndex,
    });
  }
});

// Unregister on unmount
onUnmounted(() => {
  if (tabsContext) {
    tabsContext.unregisterTab(tabName.value);
  }
});

// Watch for prop changes and propagate to parent
// Note: titleStyle is excluded from the array to avoid infinite loops when it's a
// new object reference each render. It's watched separately with deep: true.
watch(
  () => [props.title, props.disabled, props.dot, props.badge, props.showZeroBadge],
  () => {
    if (tabsContext) {
      tabsContext.updateTab(tabName.value, {
        title: props.title,
        disabled: props.disabled,
        dot: props.dot,
        badge: props.badge,
        showZeroBadge: props.showZeroBadge,
        titleStyle: props.titleStyle,
      });
    }
  },
);

// Watch titleStyle by serialized value to avoid infinite loops from new object references
const titleStyleKey = computed(() =>
  props.titleStyle ? JSON.stringify(props.titleStyle) : '',
);

watch(titleStyleKey, () => {
  if (tabsContext) {
    tabsContext.updateTab(tabName.value, {
      titleStyle: props.titleStyle,
    });
  }
});

// Panel visibility style
const contentStyle = computed(() => {
  const show = tabsContext?.scrollspy.value || isActive.value;
  return {
    display: show ? 'flex' : 'none',
    flexDirection: 'column' as const,
  };
});

// Expose for parent to access
defineExpose({
  tabName,
  isActive,
});
</script>

<template>
  <view :style="contentStyle">
    <template v-if="shouldRender">
      <slot />
    </template>
  </view>
</template>
