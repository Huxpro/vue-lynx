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
import { computed, inject, onMounted, onUnmounted, watch, ref, useSlots, nextTick, type CSSProperties } from 'vue-lynx';
import { TABS_KEY, type Numeric, type TabsProvide } from '../Tabs/types';

const props = withDefaults(defineProps<{
  title?: string;
  disabled?: boolean;
  dot?: boolean;
  badge?: Numeric;
  name?: Numeric;
  titleClass?: unknown;
  titleStyle?: string | CSSProperties;
  showZeroBadge?: boolean;
  url?: string;
  to?: string | Record<string, unknown>;
  replace?: boolean;
}>(), {
  title: '',
  disabled: false,
  dot: false,
  showZeroBadge: true,
  replace: false,
});

const slots = useSlots();

const tabsContext = inject<TabsProvide>(TABS_KEY);

if (!tabsContext) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Vant] <Tab> must be a child component of <Tabs>.');
  }
}

const autoIndex = tabsContext ? tabsContext.getTabIndex() : 0;

const tabName = computed((): Numeric => {
  return props.name !== undefined ? props.name : autoIndex;
});

const isActive = computed(() => {
  return tabsContext ? tabsContext.active.value === tabName.value : false;
});

const inited = ref(false);

const shouldRender = computed(() => {
  if (inited.value) return true;
  if (tabsContext?.scrollspy.value) return true;
  if (tabsContext && !tabsContext.lazyRender.value) return true;
  return isActive.value;
});

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

onUnmounted(() => {
  if (tabsContext) {
    tabsContext.unregisterTab(tabName.value);
  }
});

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

const contentStyle = computed(() => {
  const show = tabsContext?.scrollspy.value || isActive.value;
  return {
    display: show ? 'flex' : 'none',
    flexDirection: 'column' as const,
  };
});

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
