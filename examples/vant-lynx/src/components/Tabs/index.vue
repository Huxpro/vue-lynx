<!--
  Lynx Limitations:
  - sticky: Lynx has no scroll event interception on parent containers
  - scrollspy: Lynx has no scroll position tracking for content panels
  - offsetTop: Related to sticky, not functional in Lynx
  - animated/swipeable: Lynx lacks CSS transition on translateX for content swipe
  - scrollIntoView: Cannot measure DOM widths for scroll-to-center behavior
  - resize: Cannot measure DOM for line repositioning (line uses percentage positioning)
  - role/tabindex/aria-* attributes: Not applicable in Lynx
  - Sticky component wrapping: Not available in Lynx
  - nav scrollbar hiding: Lynx has no ::-webkit-scrollbar
-->
<script setup lang="ts">
import { computed, provide, ref, toRef, watch, nextTick } from 'vue-lynx';
import {
  TABS_KEY,
  type Numeric,
  type Interceptor,
  type TabChild,
  type TabsProvide,
  type TabsClickTabEventParams,
} from './types';

interface TabsProps {
  active?: Numeric;
  type?: 'line' | 'card';
  color?: string;
  background?: string;
  duration?: number;
  lineWidth?: number;
  lineHeight?: number;
  border?: boolean;
  ellipsis?: boolean;
  sticky?: boolean;
  swipeable?: boolean;
  scrollspy?: boolean;
  shrink?: boolean;
  animated?: boolean;
  lazyRender?: boolean;
  offsetTop?: number;
  beforeChange?: Interceptor;
  swipeThreshold?: number;
  titleActiveColor?: string;
  titleInactiveColor?: string;
  showHeader?: boolean;
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
  animated: false,
  lazyRender: true,
  offsetTop: 0,
  swipeThreshold: 5,
  showHeader: true,
});

const emit = defineEmits<{
  'update:active': [value: Numeric];
  'change': [name: Numeric, title: string];
  'click-tab': [params: TabsClickTabEventParams];
  'rendered': [name: Numeric, title?: string];
  'scroll': [params: { scrollTop: number; isFixed: boolean }];
}>();

// ---- State ----
const tabs = ref<TabChild[]>([]);
let tabIndexCounter = 0;
const currentIndex = ref(-1);
const inited = ref(false);

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
    const insertIndex = tabs.value.findIndex((t) => t.index > tab.index);
    if (insertIndex === -1) {
      tabs.value.push(tab);
    } else {
      tabs.value.splice(insertIndex, 0, tab);
    }
    if (!inited.value) {
      nextTick(() => {
        if (!inited.value) {
          inited.value = true;
          setCurrentIndexByName(props.active);
        }
      });
    } else {
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

function setActive(name: Numeric, title: string, event: Event) {
  emit('click-tab', { name, title, event, disabled: false });

  if (name === currentName.value) return;

  callInterceptor(props.beforeChange, name, () => {
    setCurrentIndexByName(name);
  });
}

function onRendered(name: Numeric, title?: string) {
  emit('rendered', name, title);
}

// ---- Expose: resize & scrollTo ----
function resize() {
  // In Lynx we cannot measure DOM, but we keep API parity
  // Re-sync current index
  nextTick(() => {
    setCurrentIndexByName(props.active);
  });
}

function scrollTo(name: Numeric) {
  nextTick(() => {
    setCurrentIndexByName(name);
  });
}

defineExpose({
  resize,
  scrollTo,
});

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
provide(TABS_KEY, {
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
    style.borderBottomWidth = '0.5px';
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
    style.borderWidth = '0.5px';
    style.borderStyle = 'solid';
    style.borderColor = props.color;
    style.borderRadius = '2px';
    style.marginLeft = '16px';
    style.marginRight = '16px';
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
    height: isCard ? '30px' : '44px',
    paddingLeft: isCard ? '0px' : '12px',
    paddingRight: isCard ? '0px' : '12px',
    opacity: tab.disabled ? 0.5 : 1,
    cursor: tab.disabled ? 'default' : 'pointer',
  };

  if (props.shrink) {
    style.paddingLeft = '12px';
    style.paddingRight = '12px';
  } else if (scrollable.value) {
    style.flex = 1;
    style.minWidth = '0px';
  } else {
    style.flex = 1;
  }

  if (isCard) {
    if (isActive) {
      style.backgroundColor = props.color;
    } else {
      style.backgroundColor = 'transparent';
    }
    if (index > 0) {
      style.borderLeftWidth = '0.5px';
      style.borderLeftStyle = 'solid';
      style.borderLeftColor = props.color;
    }
  }

  if (tab.titleStyle && typeof tab.titleStyle === 'object') {
    Object.assign(style, tab.titleStyle);
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
    fontSize: '14px',
    fontWeight: isActive ? 'bold' : 'normal',
    color,
    lineHeight: '20px',
  };

  if (props.ellipsis && !scrollable.value) {
    style.overflow = 'hidden';
    style.whiteSpace = 'nowrap';
    style.textOverflow = 'ellipsis';
  }

  return style;
}

const lineStyle = computed(() => {
  if (props.type !== 'line' || tabs.value.length === 0 || currentIndex.value < 0) {
    return { display: 'none' };
  }

  const tabCount = tabs.value.length;
  const lineW = props.lineWidth ?? 40;
  const lineH = props.lineHeight ?? 3;

  const style: Record<string, any> = {
    position: 'absolute' as const,
    bottom: '0px',
    height: `${lineH}px`,
    borderRadius: `${lineH / 2}px`,
    backgroundColor: props.color,
    width: `${lineW}px`,
  };

  if (inited.value) {
    style.transitionDuration = `${props.duration}s`;
    style.transitionProperty = 'left';
  }

  if (!props.shrink && tabCount > 0) {
    const tabWidthPercent = 100 / tabCount;
    const leftPercent = currentIndex.value * tabWidthPercent;
    style.left = `${leftPercent + tabWidthPercent / 2}%`;
    style.marginLeft = `${-(lineW / 2)}px`;
  }

  return style;
});

function shouldShowBadge(tab: TabChild): boolean {
  if (tab.badge === undefined || tab.badge === '') return false;
  if (!tab.showZeroBadge && (tab.badge === 0 || tab.badge === '0')) return false;
  return true;
}

function onTabTap(tab: TabChild, event: Event) {
  if (tab.disabled) {
    emit('click-tab', { name: tab.name, title: tab.title, event, disabled: true });
    return;
  }
  setActive(tab.name, tab.title, event);
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
      <slot name="nav-left" />
      <view :style="navStyle">
        <!-- Tab headers -->
        <view
          v-for="(tab, index) in tabs"
          :key="tab.name"
          :style="tabHeaderStyle(tab, index)"
          @tap="onTabTap(tab, $event)"
        >
          <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <!-- Badge support for dot/badge -->
            <view v-if="tab.dot || shouldShowBadge(tab)"
              :style="{ position: 'relative', display: 'flex' }">
              <text :style="tabTextStyle(tab, index)">{{ tab.title }}</text>
              <!-- Dot indicator -->
              <view v-if="tab.dot" :style="{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#ee0a24',
              }" />
              <!-- Badge number -->
              <view v-else-if="shouldShowBadge(tab)" :style="{
                position: 'absolute',
                top: '-8px',
                right: '-16px',
                backgroundColor: '#ee0a24',
                borderRadius: '8px',
                minWidth: '16px',
                height: '16px',
                paddingLeft: '3px',
                paddingRight: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }">
                <text :style="{ fontSize: '10px', color: '#fff', fontWeight: 'bold', lineHeight: '14px' }">
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
      <slot name="nav-right" />
      <slot name="nav-bottom" />
    </view>

    <!-- Tab content panels -->
    <view :style="contentStyle">
      <slot />
    </view>
  </view>
</template>
