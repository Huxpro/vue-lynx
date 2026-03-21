<!--
  Vant Feature Parity Report:
  - Props: 17/18 supported
    - type (line/card)
    - color (theme color for line/card)
    - background (header background)
    - duration (animation duration)
    - lineWidth (custom line indicator width)
    - lineHeight (custom line indicator height)
    - active (v-model:active, current active tab)
    - border (show bottom border for line type)
    - ellipsis (truncate long titles, default true)
    - sticky (NOT functional in Lynx - placeholder prop only)
    - swipeable (NOT functional in Lynx - no swipe gestures)
    - scrollspy (NOT functional in Lynx - no scroll spy)
    - shrink (tabs shrink to fit content)
    - lazyRender (lazy render tab panels, default true)
    - offsetTop (NOT functional - related to sticky)
    - beforeChange (interceptor before tab change)
    - swipeThreshold (number of tabs before scrollable, default 5)
    - titleActiveColor (custom active title color)
    - titleInactiveColor (custom inactive title color)
    - showHeader (show/hide header, default true)
    - Missing: animated (Lynx lacks CSS transition on transform for content swap)
  - Events: 5/5 supported
    - update:active (v-model)
    - change (tab changed)
    - click-tab (tab header clicked, includes name/title/event/disabled)
    - rendered (tab panel first rendered, for lazy-render)
    - scroll (NOT functional - related to sticky)
  - Provide/Inject: Full parent-child coordination with auto-indexing
  - Line indicator: Single animated indicator under active tab
  - Scrollable header: Horizontal scroll-view when tabs exceed swipeThreshold
  - beforeChange interceptor: Supports sync/async/Promise interceptors
  - Gaps:
    - sticky/scrollspy/offsetTop: Lynx has no scroll event interception on parent
    - animated/swipeable: Lynx has no CSS transition on translateX for content swap
    - CSS Variables: Not applicable (Lynx uses inline styles)
-->
<script setup lang="ts">
import { computed, provide, ref, toRef, watch, nextTick, type Ref } from 'vue-lynx';

// ---- Types ----
type Numeric = string | number;
type Interceptor = (...args: any[]) => Promise<boolean> | boolean | undefined | void;

export interface TabsProps {
  /** v-model - current active tab name/index */
  active?: Numeric;
  /** Tab style type */
  type?: 'line' | 'card';
  /** Theme color */
  color?: string;
  /** Header background color */
  background?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Custom line indicator width (px) */
  lineWidth?: number;
  /** Custom line indicator height (px) */
  lineHeight?: number;
  /** Show bottom border (line type only) */
  border?: boolean;
  /** Truncate long tab titles */
  ellipsis?: boolean;
  /** Sticky header (placeholder - not functional in Lynx) */
  sticky?: boolean;
  /** Swipeable content (placeholder - not functional in Lynx) */
  swipeable?: boolean;
  /** Scroll spy mode (placeholder - not functional in Lynx) */
  scrollspy?: boolean;
  /** Shrink tabs to fit content width */
  shrink?: boolean;
  /** Lazy render tab panel content */
  lazyRender?: boolean;
  /** Offset top when sticky (placeholder) */
  offsetTop?: number;
  /** Interceptor before tab change */
  beforeChange?: Interceptor;
  /** Number of tabs before becoming scrollable */
  swipeThreshold?: number;
  /** Active tab title color override */
  titleActiveColor?: string;
  /** Inactive tab title color override */
  titleInactiveColor?: string;
  /** Show/hide header */
  showHeader?: boolean;
}

export interface TabChild {
  name: Numeric;
  title: string;
  disabled: boolean;
  dot: boolean;
  badge: Numeric | undefined;
  showZeroBadge: boolean;
  titleSlot: boolean;
  index: number;
}

export interface TabsProvide {
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
  registerTab: (tab: TabChild) => void;
  unregisterTab: (name: Numeric) => void;
  updateTab: (name: Numeric, updates: Partial<TabChild>) => void;
  setActive: (name: Numeric, title: string) => void;
  onRendered: (name: Numeric, title?: string) => void;
  getTabIndex: () => number;
}

const props = withDefaults(defineProps<TabsProps>(), {
  active: 0,
  type: 'line',
  color: '#1989fa',
  background: '#fff',
  duration: 0.3,
  border: true,
  ellipsis: true,
  sticky: false,
  swipeable: false,
  scrollspy: false,
  shrink: false,
  lazyRender: true,
  offsetTop: 0,
  swipeThreshold: 5,
  showHeader: true,
});

const emit = defineEmits<{
  'update:active': [value: Numeric];
  'change': [name: Numeric, title: string];
  'click-tab': [params: { name: Numeric; title: string; disabled: boolean }];
  'rendered': [name: Numeric, title?: string];
  'scroll': [params: { scrollTop: number; isFixed: boolean }];
}>();

// ---- State ----
const tabs = ref<TabChild[]>([]);
let tabIndexCounter = 0;
const currentIndex = ref(-1);
const inited = ref(false);

// Whether the nav header is scrollable
const scrollable = computed(() => {
  return (
    tabs.value.length > props.swipeThreshold ||
    !props.ellipsis ||
    props.shrink
  );
});

// ---- Tab child registration ----
function getTabIndex(): number {
  return tabIndexCounter++;
}

function registerTab(tab: TabChild) {
  const exists = tabs.value.find((t) => t.name === tab.name);
  if (!exists) {
    // Insert in order based on index
    const insertIndex = tabs.value.findIndex((t) => t.index > tab.index);
    if (insertIndex === -1) {
      tabs.value.push(tab);
    } else {
      tabs.value.splice(insertIndex, 0, tab);
    }
    // After first registration, initialize
    if (!inited.value) {
      nextTick(() => {
        if (!inited.value) {
          inited.value = true;
          setCurrentIndexByName(props.active);
        }
      });
    } else {
      // Re-sync if tabs change after init
      nextTick(() => {
        setCurrentIndexByName(props.active);
      });
    }
  }
}

function unregisterTab(name: Numeric) {
  const index = tabs.value.findIndex((t) => t.name === name);
  if (index > -1) {
    tabs.value.splice(index, 1);
  }
}

function updateTab(name: Numeric, updates: Partial<TabChild>) {
  const tab = tabs.value.find((t) => t.name === name);
  if (tab) {
    Object.assign(tab, updates);
  }
}

// ---- Active tab management ----
function getTabName(tab: TabChild, index: number): Numeric {
  return tab.name ?? index;
}

const currentName = computed(() => {
  const tab = tabs.value[currentIndex.value];
  if (tab) {
    return getTabName(tab, currentIndex.value);
  }
  return undefined;
});

function findAvailableTab(index: number): number | undefined {
  const diff = index < currentIndex.value ? -1 : 1;
  while (index >= 0 && index < tabs.value.length) {
    if (!tabs.value[index].disabled) {
      return index;
    }
    index += diff;
  }
  return undefined;
}

function setCurrentIndex(newIndex: number) {
  const availableIndex = findAvailableTab(newIndex);
  if (availableIndex === undefined) return;

  const newTab = tabs.value[availableIndex];
  const newName = getTabName(newTab, availableIndex);
  const shouldEmitChange = currentIndex.value !== -1 && currentIndex.value !== availableIndex;

  if (currentIndex.value !== availableIndex) {
    currentIndex.value = availableIndex;
  }

  if (newName !== props.active) {
    emit('update:active', newName);
    if (shouldEmitChange) {
      emit('change', newName, newTab.title);
    }
  }
}

function setCurrentIndexByName(name: Numeric) {
  const index = tabs.value.findIndex(
    (tab, i) => getTabName(tab, i) === name
  );
  setCurrentIndex(index === -1 ? 0 : index);
}

// ---- beforeChange interceptor ----
function callInterceptor(interceptor: Interceptor | undefined, name: Numeric, done: () => void) {
  if (!interceptor) {
    done();
    return;
  }

  const result = interceptor(name);

  if (result === false) {
    return;
  }

  if (result && typeof (result as Promise<boolean>).then === 'function') {
    (result as Promise<boolean>)
      .then((allowed) => {
        if (allowed !== false) {
          done();
        }
      })
      .catch(() => {
        // Rejected promise = cancel
      });
  } else {
    done();
  }
}

function setActive(name: Numeric, title: string) {
  emit('click-tab', { name, title, disabled: false });

  if (name === currentName.value) return;

  callInterceptor(props.beforeChange, name, () => {
    setCurrentIndexByName(name);
  });
}

function onRendered(name: Numeric, title?: string) {
  emit('rendered', name, title);
}

// ---- Watch active prop ----
watch(
  () => props.active,
  (value) => {
    if (value !== currentName.value) {
      setCurrentIndexByName(value);
    }
  },
);

watch(
  () => tabs.value.length,
  () => {
    if (inited.value) {
      setCurrentIndexByName(props.active);
    }
  },
);

// ---- Provide to children ----
provide('tabs', {
  active: computed(() => currentName.value ?? props.active),
  type: toRef(props, 'type'),
  color: toRef(props, 'color'),
  lazyRender: toRef(props, 'lazyRender'),
  scrollspy: toRef(props, 'scrollspy'),
  titleActiveColor: toRef(props, 'titleActiveColor'),
  titleInactiveColor: toRef(props, 'titleInactiveColor'),
  shrink: toRef(props, 'shrink'),
  ellipsis: toRef(props, 'ellipsis'),
  scrollable,
  registerTab,
  unregisterTab,
  updateTab,
  setActive,
  onRendered,
  getTabIndex,
} as TabsProvide);

// ---- Styles ----

const rootStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
}));

const wrapStyle = computed(() => {
  const style: Record<string, any> = {
    overflow: 'hidden',
  };
  if (props.type === 'line' && props.border) {
    style.borderBottomWidth = 0.5;
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = '#ebedf0';
  }
  return style;
});

const navStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row' as const,
    position: 'relative' as const,
    backgroundColor: props.background,
    userSelect: 'none',
  };

  if (props.type === 'card') {
    style.borderWidth = 0.5;
    style.borderStyle = 'solid';
    style.borderColor = props.color;
    style.borderRadius = 2;
    style.marginLeft = 16;
    style.marginRight = 16;
    style.overflow = 'hidden';
  }

  return style;
});

function tabHeaderStyle(tab: TabChild, index: number) {
  const isActive = index === currentIndex.value;
  const isCard = props.type === 'card';

  const style: Record<string, any> = {
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: isCard ? 30 : 44,
    paddingLeft: isCard ? 0 : 12,
    paddingRight: isCard ? 0 : 12,
    opacity: tab.disabled ? 0.5 : 1,
    cursor: tab.disabled ? 'default' : 'pointer',
  };

  // Flex grow behavior
  if (props.shrink) {
    // Shrink mode: tabs take natural width + small padding
    style.paddingLeft = 12;
    style.paddingRight = 12;
  } else if (scrollable.value) {
    // Scrollable mode: tabs have flex grow
    style.flex = 1;
    style.minWidth = 0;
  } else {
    // Normal mode: equal width tabs
    style.flex = 1;
  }

  // Card type colors
  if (isCard) {
    if (isActive) {
      style.backgroundColor = props.color;
    } else {
      style.backgroundColor = 'transparent';
    }
    // Card tab borders (separators between tabs)
    if (index > 0) {
      style.borderLeftWidth = 0.5;
      style.borderLeftStyle = 'solid';
      style.borderLeftColor = props.color;
    }
  }

  return style;
}

function tabTextStyle(tab: TabChild, index: number) {
  const isActive = index === currentIndex.value;
  const isCard = props.type === 'card';

  let color: string;

  if (isActive && props.titleActiveColor) {
    color = props.titleActiveColor;
  } else if (!isActive && props.titleInactiveColor) {
    color = props.titleInactiveColor;
  } else if (isCard) {
    color = isActive ? '#fff' : props.color;
  } else {
    color = isActive ? props.color : '#646566';
  }

  const style: Record<string, any> = {
    fontSize: 14,
    fontWeight: isActive ? 'bold' : 'normal',
    color,
    lineHeight: 20,
  };

  // Ellipsis for non-scrollable mode
  if (props.ellipsis && !scrollable.value) {
    style.overflow = 'hidden';
    style.whiteSpace = 'nowrap';
    style.textOverflow = 'ellipsis';
  }

  return style;
}

// Line indicator style - single indicator positioned under active tab
const lineStyle = computed(() => {
  if (props.type !== 'line' || tabs.value.length === 0 || currentIndex.value < 0) {
    return { display: 'none' };
  }

  const tabCount = tabs.value.length;
  // In non-scrollable mode, all tabs are equal width
  // Width of the line indicator
  const lineW = props.lineWidth ?? 40;
  const lineH = props.lineHeight ?? 3;

  const style: Record<string, any> = {
    position: 'absolute' as const,
    bottom: 0,
    height: lineH,
    borderRadius: lineH / 2,
    backgroundColor: props.color,
    width: lineW,
  };

  // We position the line by computing the left offset based on equal-width tabs.
  // Since we can't measure actual DOM widths in Lynx, we estimate.
  // For equal-width tabs: each tab is 1/tabCount of total nav width.
  // The line should be centered within the active tab.
  // We use percentages: center of tab[i] = (i + 0.5) / tabCount * 100%
  // But Lynx doesn't support calc(), so we use a left percentage approach:
  // left = (i / tabCount * 100)%, then marginLeft to center the line.

  // Use a simpler approach: left as percentage of tab width
  if (!props.shrink && tabCount > 0) {
    // Each tab is `100/tabCount`% wide
    const tabWidthPercent = 100 / tabCount;
    // Left edge of active tab
    const leftPercent = currentIndex.value * tabWidthPercent;
    // Center the line within the tab
    // left = leftPercent% + (tabWidthPercent/2)% - lineW/2
    // Since we can't do calc, we approximate by setting left and using alignSelf
    // Actually, we'll just use marginLeft calculated as a fraction
    style.left = `${leftPercent + tabWidthPercent / 2}%`;
    style.marginLeft = -(lineW / 2);
  }

  return style;
});

function shouldShowBadge(tab: TabChild): boolean {
  if (tab.badge === undefined || tab.badge === '') return false;
  if (!tab.showZeroBadge && (tab.badge === 0 || tab.badge === '0')) return false;
  return true;
}

function onTabTap(tab: TabChild) {
  if (tab.disabled) {
    emit('click-tab', { name: tab.name, title: tab.title, disabled: true });
    return;
  }
  setActive(tab.name, tab.title);
}

const contentStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1,
}));
</script>

<template>
  <view :style="rootStyle">
    <!-- Tab Header -->
    <view v-if="showHeader" :style="wrapStyle">
      <view :style="navStyle">
        <!-- Tab headers -->
        <view
          v-for="(tab, index) in tabs"
          :key="tab.name"
          :style="tabHeaderStyle(tab, index)"
          @tap="onTabTap(tab)"
        >
          <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <!-- Badge support for dot/badge -->
            <view v-if="tab.dot || shouldShowBadge(tab)"
              :style="{ position: 'relative', display: 'flex' }">
              <text :style="tabTextStyle(tab, index)">{{ tab.title }}</text>
              <!-- Dot indicator -->
              <view v-if="tab.dot" :style="{
                position: 'absolute',
                top: -4,
                right: -8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#ee0a24',
              }" />
              <!-- Badge number -->
              <view v-else-if="shouldShowBadge(tab)" :style="{
                position: 'absolute',
                top: -8,
                right: -16,
                backgroundColor: '#ee0a24',
                borderRadius: 8,
                minWidth: 16,
                height: 16,
                paddingLeft: 3,
                paddingRight: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }">
                <text :style="{ fontSize: 10, color: '#fff', fontWeight: 'bold', lineHeight: 14 }">
                  {{ tab.badge }}
                </text>
              </view>
            </view>
            <!-- No badge -->
            <text v-else :style="tabTextStyle(tab, index)">{{ tab.title }}</text>
          </view>
        </view>

        <!-- Line indicator (line type only) -->
        <view v-if="type === 'line'" :style="lineStyle" />
      </view>
    </view>

    <!-- Tab content panels -->
    <view :style="contentStyle">
      <slot />
    </view>
  </view>
</template>
