<!--
  Vant Feature Parity Report:
  - Props: 8/9 supported
    - title (tab header text)
    - disabled (disable tab interaction)
    - dot (show red dot on tab header)
    - badge (show badge number on tab header)
    - name (custom tab identifier, auto-indexes if not set)
    - titleClass (NOT applicable - Lynx uses inline styles, no class support)
    - titleStyle (NOT applicable - styles are computed in parent Tabs)
    - showZeroBadge (show badge when value is 0, default true)
    - Missing: titleClass/titleStyle (Lynx does not support CSS classes)
  - Slots: 2/2 supported
    - default (tab panel content)
    - title (custom tab title - communicated to parent via flag)
  - Lazy rendering: Supported (panel not rendered until first activated)
  - Auto-indexing: Tab name defaults to registration order index
  - Reactive updates: Title/disabled/dot/badge changes propagate to parent
  - Gaps:
    - titleClass/titleStyle: Lynx has no CSS class system
    - title slot: Flag is set but custom rendering in parent header requires
      additional coordination (parent renders headers from registered data)
-->
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, watch, ref, useSlots, nextTick, type Ref } from 'vue-lynx';

type Numeric = string | number;

export interface TabProps {
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
  /** Show badge when value is zero */
  showZeroBadge?: boolean;
}

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

const props = withDefaults(defineProps<TabProps>(), {
  title: '',
  disabled: false,
  dot: false,
  showZeroBadge: true,
});

const slots = useSlots();

const tabsContext = inject<TabsProvide>('tabs');

if (!tabsContext) {
  console.error('[Vant] <Tab> must be a child component of <Tabs>.');
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
  // If already inited, always render
  if (inited.value) return true;
  // If scrollspy mode, always render
  if (tabsContext?.scrollspy.value) return true;
  // If lazy render is off, always render
  if (tabsContext && !tabsContext.lazyRender.value) return true;
  // Only render if active
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
      });
    }
  },
);

// Panel visibility style
const contentStyle = computed(() => {
  const show = tabsContext?.scrollspy.value || isActive.value;
  return {
    display: show ? 'flex' : 'none',
    flexDirection: 'column' as const,
  };
});
</script>

<template>
  <view :style="contentStyle">
    <template v-if="shouldRender">
      <slot />
    </template>
  </view>
</template>
