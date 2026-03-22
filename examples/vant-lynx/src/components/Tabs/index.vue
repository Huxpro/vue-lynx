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
  - :last-child: Lynx may not support pseudo-selectors, card border uses inline style
-->
<script setup lang="ts">
import { computed, provide, ref, toRef, watch, nextTick } from 'vue-lynx';
import { createNamespace } from '../../utils';
import './index.less';
import {
  TABS_KEY,
  type Numeric,
  type Interceptor,
  type TabChild,
  type TabsProvide,
  type TabsClickTabEventParams,
} from './types';

const [, bem] = createNamespace('tabs');
const [, tabBem] = createNamespace('tab');

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
  color: computed(() => props.color),
  lazyRender: toRef(props, 'lazyRender'),
  scrollspy: toRef(props, 'scrollspy'),
  titleActiveColor: computed(() => props.titleActiveColor),
  titleInactiveColor: computed(() => props.titleInactiveColor),
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

// ---- Computed classes ----
const rootClass = computed(() =>
  bem([props.type])
);

const wrapClass = computed(() => {
  const classes = [bem('wrap')];
  if (props.type === 'line' && props.border) {
    classes.push('van-hairline--top-bottom');
  }
  return classes.join(' ');
});

const navClass = computed(() =>
  bem('nav', [props.type, { shrink: props.shrink }])
);

function tabTitleClass(tab: TabChild, index: number) {
  const isActive = index === currentIndex.value;
  const isCard = props.type === 'card';

  return tabBem([
    { active: isActive },
    { disabled: tab.disabled },
    { shrink: props.shrink },
    { grow: scrollable.value && !props.shrink },
    { card: isCard },
  ]);
}

function tabTextClass() {
  if (props.ellipsis && !scrollable.value) {
    return tabBem('text', ['ellipsis']);
  }
  return '';
}

// ---- Inline styles ONLY for dynamic color/background props ----
function tabTitleStyle(tab: TabChild, index: number) {
  const isActive = index === currentIndex.value;
  const isCard = props.type === 'card';
  const style: Record<string, string> = {};

  if (props.color && isCard) {
    style.borderColor = props.color;
    if (!tab.disabled) {
      if (isActive) {
        style.backgroundColor = props.color;
      } else {
        style.color = props.color;
      }
    }
  }

  const titleColor = isActive ? props.titleActiveColor : props.titleInactiveColor;
  if (titleColor) {
    style.color = titleColor;
  }

  // Merge user's titleStyle
  if (tab.titleStyle && typeof tab.titleStyle === 'object') {
    Object.assign(style, tab.titleStyle);
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

const navStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.background) {
    style.backgroundColor = props.background;
  }
  if (props.color && props.type === 'card') {
    style.borderColor = props.color;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});

const lineStyle = computed(() => {
  if (props.type !== 'line' || tabs.value.length === 0 || currentIndex.value < 0) {
    return { display: 'none' };
  }

  const tabCount = tabs.value.length;
  const lineW = props.lineWidth ?? 40;
  const lineH = props.lineHeight ?? 3;

  const style: Record<string, string> = {
    width: `${lineW}px`,
    height: `${lineH}px`,
    borderRadius: `${lineH / 2}px`,
  };

  if (props.color) {
    style.backgroundColor = props.color;
  }

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
</script>

<template>
  <view :class="rootClass">
    <!-- Tab Header -->
    <view v-if="showHeader" :class="wrapClass">
      <slot name="nav-left" />
      <view :class="navClass" :style="navStyle">
        <!-- Tab headers -->
        <view
          v-for="(tab, index) in tabs"
          :key="tab.name"
          :class="tabTitleClass(tab, index)"
          :style="tabTitleStyle(tab, index)"
          @tap="onTabTap(tab, $event)"
        >
          <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <!-- Badge support for dot/badge -->
            <view v-if="tab.dot || shouldShowBadge(tab)"
              :style="{ position: 'relative', display: 'flex' }">
              <text :class="tabTextClass()">{{ tab.title }}</text>
              <!-- Dot indicator -->
              <view v-if="tab.dot" class="van-badge--dot" :style="{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#ee0a24',
              }" />
              <!-- Badge number -->
              <view v-else-if="shouldShowBadge(tab)" class="van-badge--fixed" :style="{
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
            <text v-else :class="tabTextClass()">{{ tab.title }}</text>
          </view>
        </view>

        <!-- Line indicator (line type only) -->
        <view v-if="type === 'line'" class="van-tabs__line" :style="lineStyle" />
      </view>
      <slot name="nav-right" />
      <slot name="nav-bottom" />
    </view>

    <!-- Tab content panels -->
    <view class="van-tabs__content">
      <slot />
    </view>
  </view>
</template>
