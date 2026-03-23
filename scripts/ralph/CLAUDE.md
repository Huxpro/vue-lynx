# Ralph Agent Instructions - Vant Lynx Feature Parity

You are an autonomous coding agent achieving 100% feature parity between vue-lynx Vant components and the upstream Vant Web library.

## Your Task

1. Read the PRD at `prd.json` (in this directory)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Ensure you're on branch `feat/vant-lynx-v2`. If not, check it out.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run ALL verification steps in the acceptanceCriteria
7. If all checks pass, commit with: `feat({component}): 100% feature parity with Vant`
8. Update prd.json to set `passes: true` for the completed story
9. Append progress to `progress.txt`

## Project Layout

```
examples/vant-lynx/src/
  utils/
    create.ts          # createNamespace + bem() — BEM class generator (like Vant's)
    format.ts          # addUnit, unitToPx, etc.
    index.ts           # re-exports
  components/{ComponentName}/
    index.vue          # Component implementation (import './index.less')
    index.less         # CSS variables + BEM class selectors (copy from Vant)
    types.ts           # TypeScript types
    test/index.spec.ts # Unit tests (vitest + vue-lynx-testing-library)
  pages/
    {component}.vue    # Demo page
  router.ts            # Route definitions
```

## Reference Sources

### Vant Upstream
- **Repo**: https://github.com/youzan/vant
- **Component source**: https://github.com/youzan/vant/tree/main/packages/vant/src/{component}
- **Docs**: https://vant-ui.github.io/vant/#/en-US
- **Test source**: https://github.com/youzan/vant/tree/main/packages/vant/src/{component}/test

### Lynx Platform
- **Docs**: https://lynxjs.org
- **API Reference**: https://lynxjs.org/api/lynx-api/
- **Styling**: https://lynxjs.org/rspeedy/styling.html
- Use `lynxbase` skill to query Lynx APIs when unsure about platform capabilities

### VueLynx
- **Threading model**: Read `~/github/vue-lynx/website/docs/guide/introduction.mdx`
- **Main Thread Script**: Read `~/github/vue-lynx/website/docs/guide/main-thread-script.mdx`

## Threading Model Decision Guide

VueLynx has a dual-thread architecture. Choose appropriately:

### Use Background Thread (default, `bindtap`)
- Simple click handlers, form toggles, navigation, state updates

### Use Main Thread (`main-thread-bindtouchstart`, etc.)
- Gestures requiring immediate visual feedback
- Drag, swipe, pull-to-refresh, scroll-linked animations

## Acceptance Criteria (applies to EVERY story)

Each component must achieve ALL of the following:

### 1. CSS & Transition Animation Parity
- `index.less` MUST be imported in the component (via `import './index.less'` or `<style>`)
- All CSS variables defined in `index.less` matching Vant's `--van-{component}-*` naming
- Component classes (`.van-{component}`, `.van-{component}__part`) defined in `.less`, applied via `class=`
- No hardcoded colors/sizes in inline styles — use CSS variables in `.less` files
- `@keyframes` defined in `.less` for any spinning, sliding, fading animations
- Vue `<Transition>` with CSS class-based enter/leave (not inline opacity hacks)
- Slide/fade/zoom animations matching Vant's transition names and timing
- `duration` prop controlling animation length where applicable

### 2. Event Parity
- Every event Vant emits, we emit with the same name and payload
- `opened`/`closed` events fire AFTER animation ends (via Transition hooks), not immediately
- `update:modelValue` / `update:show` for v-model support matches Vant exactly
- Verify event count matches: compare our emits definition against Vant source

### 3. Props & API Parity
- Every prop in Vant source is defined in our component (same name, type, default)
- Props that cannot work in Lynx are still defined for API compatibility
- Function/method exposure via `defineExpose` matches Vant's `useExpose`

### 4. Source File & Function Structure
- Match Vant's file count where practical (composables, utils, sub-components)
- Shared composables (useLockScroll, useLazyRender, useGlobalZIndex, etc.) extracted
- Helper functions match Vant's organization

### 5. Demo Page Parity
- Our demo page covers ALL demo sections from Vant docs
- Each demo section title matches Vant's (translated to Chinese where Vant does)
- Interactive demos work: buttons clickable, forms fillable, animations visible
- Homepage component list MUST match Vant's exact categories and ordering (see below)

### 6. Visual Verification
- Use `dev-browser` skill to screenshot our component demo page
- Use `dev-browser` skill to screenshot Vant's web demo at `https://vant-ui.github.io/vant/#/en-US/{component}`
- Compare screenshots - layout, spacing, colors, typography should match
- Use `devtool` skill to inspect Lynx rendering if issues found

### 7. Unit Test Parity
- Port ALL test cases from Vant's `packages/vant/src/{component}/test/` directory
- Rewrite using `vue-lynx-testing-library` (not `@vue/test-utils`)
- Test file at `components/{ComponentName}/test/index.spec.ts`
- Test count should match or exceed Vant's test count
- Run `cd examples/vant-lynx && pnpm test -- --reporter=verbose {ComponentName}` to verify

### 8. Limitation Documentation
- Features that absolutely cannot work in Lynx documented at the top of `index.vue`:
```
<!--
  Lynx Limitations:
  - {feature}: {reason why it cannot work in Lynx}
-->
```

## CSS & Styling Architecture (CRITICAL — READ BEFORE WRITING ANY COMPONENT)

Lynx has full CSS support: selectors, @keyframes, transitions, variables, animations, @font-face.

The `lynx.config.ts` has these critical plugin options enabled:
- `enableCSSSelector: true` — CSS class selectors work
- `enableCSSInheritance: true` — CSS properties (including variables) inherit from parent to child
- `enableCSSInlineVariables: true` — CSS variables in inline styles work (needed for ConfigProvider themeVars)

### The Golden Rule: Match Vant's styling approach

Vant uses **CSS classes for ALL static styles** and **inline styles ONLY for the `color` prop**.
We MUST follow the same pattern. Here's how Vant's Button works vs how we should implement:

**Vant Button.tsx** — only `color` prop uses inline style:
```tsx
const getStyle = () => {
  if (color) {
    return { color: plain ? color : 'white', background: color, borderColor: color };
  }
};
// Everything else is CSS classes:
<tag class={bem([type, size, { plain, round, disabled }])} style={getStyle()}>
```

**Our Button should match** — CSS classes for variants, inline only for `color`:
```vue
<view :class="buttonClasses" :style="colorStyle" @tap="onTap">
```

### BEM Class System — `createNamespace` utility

Vant uses `createNamespace('button')` to generate BEM class names. We MUST create and use
the same utility at `src/utils/create.ts`:

```ts
// src/utils/create.ts
export function createNamespace(name: string) {
  const prefixedName = `van-${name}`;

  function bem(el?: string | Array<string | Record<string, boolean>>, mods?: Record<string, boolean>): string {
    // Handle array form: bem([type, size, { plain, round }])
    // Handle element form: bem('content')
    // Handle modifier form: bem('icon', { active: true })
    // Returns: 'van-button van-button--primary van-button--round'
  }

  return [prefixedName, bem] as const;
}
```

Usage in component:
```ts
const [name, bem] = createNamespace('button');
// bem() → 'van-button'
// bem('content') → 'van-button__content'
// bem([type, size, { plain, round }]) → 'van-button van-button--primary van-button--round'
```

### index.less — Define ALL visual styles as CSS classes

Copy Vant's `.less` structure. All heights, colors, font sizes, paddings, borders go here:

```less
// index.less for Button
:root {
  --van-button-primary-color: var(--van-white);
  --van-button-primary-background: var(--van-primary-color);
  --van-button-primary-border-color: var(--van-primary-color);
  // ... all CSS variables
}

.van-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--van-button-default-height);
  border-radius: var(--van-button-radius);
  // ... base styles

  &--primary {
    color: var(--van-button-primary-color);
    background: var(--van-button-primary-background);
    border: var(--van-button-border-width) solid var(--van-button-primary-border-color);
  }

  &--large { height: var(--van-button-large-height); width: 100%; }
  &--round { border-radius: var(--van-button-round-radius); }
  &--disabled { opacity: var(--van-button-disabled-opacity); }

  &__content { display: flex; align-items: center; justify-content: center; }
  &__text + &__icon { margin-left: var(--van-padding-base); }
}
```

### Import the .less file in the component

```ts
// In index.vue <script setup>
import './index.less';
```

### Inline styles — ONLY for dynamic `color` prop

```ts
// CORRECT: only compute style when user passes color prop
const colorStyle = computed(() => {
  if (!props.color) return undefined;
  const style: Record<string, string> = {};
  if (props.plain) {
    style.color = props.color;
  } else {
    style.background = props.color;
    style.color = 'white';
  }
  if (!props.color.includes('gradient')) {
    style.borderColor = props.color;
  }
  return style;
});

// WRONG: computing ALL styles in JS
const buttonStyle = computed(() => ({
  height: '50px', backgroundColor: '#1989fa', ...  // ← NO!
}));
```

### Animations — `@keyframes` in `.less`, `<Transition>` with CSS classes

```less
// In component's index.less or a shared transitions.less
@keyframes van-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.van-loading__spinner {
  animation: van-rotate 0.8s linear infinite;
}

// Transition classes for Popup/Overlay/etc
.van-fade-enter-active, .van-fade-leave-active {
  transition: opacity var(--van-duration-base);
}
.van-fade-enter-from, .van-fade-leave-to {
  opacity: 0;
}
```

```vue
<Transition name="van-fade">
  <view v-if="show" class="van-overlay">...</view>
</Transition>
```

### Icon Font — use Vant's `@font-face`, not emoji fallbacks

Lynx fully supports `@font-face` and icon fonts.
See: https://lynxjs.org/guide/styling/text-and-typography.md#custom-font-settings

### Lynx-specific adaptations that ARE acceptable

| Web (Vant) | Lynx (us) | Why |
|---|---|---|
| `<button>` / `<tag>` | `<view>` | Lynx has no HTML tags |
| `::before` active overlay | JS touchstart + opacity class | Lynx has no `::before`/`:active` |
| `::after` hairline border | `border-width: 0.5px` | Lynx has no `::after` |
| `onClick` | `@tap` | Lynx event system |
| `v-show` | `v-if` or opacity class toggle | Lynx `display:none` behavior differs |

### DON'T: Assume Lynx lacks CSS features

Common WRONG assumptions made by previous iterations:
- ~~"No @font-face / icon font support"~~ → WRONG, fully supported
- ~~"No CSS @keyframes"~~ → WRONG, fully supported
- ~~"No CSS class selectors"~~ → WRONG, `enableCSSSelector: true` is on
- ~~"CSS variables only work in .less files"~~ → They work via class-based stylesheets
- ~~"Vue `<Transition>` doesn't work in Lynx"~~ → WRONG, it works with CSS classes

## Gesture & Interaction Patterns (CRITICAL for interactive components)

When porting gesture-driven components (FloatingPanel, PullRefresh, SwipeCell, Swipe, etc.),
match Vant's **exact implementation approach**, not just the visual outcome.

### Use `transform: translateY/X()` for animations, NOT `height`/`width`

**Vant** (correct):
```ts
// FloatingPanel — fixed height, moves via translateY
const rootStyle = computed(() => ({
  height: addUnit(boundary.value.max),
  transform: `translateY(calc(100% + ${addUnit(-height.value)}))`,
  transition: !dragging.value
    ? `transform ${duration}s cubic-bezier(0.18, 0.89, 0.32, 1.28)` : 'none',
}));
```

**WRONG** (what previous iterations did):
```ts
// Animating height causes layout reflow every frame — janky
const panelStyle = computed(() => ({
  height: currentHeight.value,  // ← NO! Use translateY instead
  transitionProperty: 'height', // ← NO! Transition transform instead
}));
```

`transform` is GPU-composited (no layout reflow). `height`/`width` triggers layout recalculation
every frame. Always prefer `transform` for position-based animations.

### Content scroll detection — REQUIRED for draggable panels

Vant's FloatingPanel distinguishes "user scrolls content" from "user drags panel":
```tsx
const { scrollTop } = contentRef.value;
maxScroll = Math.max(maxScroll, scrollTop);
// Only drag panel if: content is at scroll top AND user drags down
if (!(scrollTop <= 0 && touch.deltaY.value > 0) || maxScroll > 0) {
  return; // let content scroll normally
}
```

Without this logic, `contentDraggable=true` makes content **unscrollable** — the touch always
moves the panel instead. This is a **critical interaction bug**, not a cosmetic difference.

### `useTouch` composable — port from Vant

Vant's `useTouch()` tracks deltaX, deltaY, offsetX, offsetY, direction, isVertical, isHorizontal.
Many gesture components depend on it. Create a shared composable at `src/composables/useTouch.ts`
matching Vant's `packages/vant/src/composables/use-touch/index.ts`.

### `::after` background extension — use `<view>` substitute

Vant uses `::after` pseudo-element to extend panel background below the fold (prevents
white gap during overscroll). Lynx has no `::after`, so add a `<view>` for this:
```vue
<!-- Background extension (replaces ::after in Vant) -->
<view :style="{ position: 'absolute', bottom: '-100vh', height: '100vh', width: '100%',
  backgroundColor: 'inherit' }" />
```

### `will-change` and `touch-action`

Add `will-change: transform` to animated elements for GPU acceleration.
Add `touch-action: none` to gesture areas to prevent browser default behaviors.

### Overlay/mask elements MUST have `pointer-events: none`

When using absolute-positioned overlays (gradient masks, selection frames, etc.) on top of
interactive content, they intercept all touch events by default. Add `pointer-events: none`:

```less
.van-picker__mask {
  pointer-events: none;  // Let touches pass through to columns below
}
.van-picker__frame {
  pointer-events: none;
}
```

**Bug pattern to avoid** (found in Picker): absolute-positioned masks with `zIndex: 1`
block all touch events on the columns below, making drag completely non-functional.

### Momentum / inertia scrolling — implement it, don't skip it

Vant's PickerColumn, Swipe, and other scrolling components have momentum (inertia) scrolling:
the content continues to coast after the finger lifts, then snaps to position. This is
fundamental to the UX, not optional. Use the `swipeDuration` prop and velocity calculation.

### Match Vant's component split — don't merge into one file

Vant splits complex components into sub-components (e.g., Picker → Picker + PickerColumn,
Collapse → Collapse + CollapseItem, Tabs → Tabs + Tab). Match this structure:
- Each sub-component gets its own file and types
- Parent ↔ child communicate via provide/inject (Symbol keys)
- This matches Vant's architecture AND makes code maintainable

### General rule for gesture/interactive components

Before implementing, READ the Vant source for that component and answer:
1. **What CSS property is animated?** (transform? opacity? — NOT height/width/paddingTop)
2. **How does it handle content scroll vs drag?** (scrollTop detection?)
3. **What composables does it use?** (useTouch, useLockScroll, useEventListener)
4. **What timing function?** (cubic-bezier values — copy exactly)
5. **Are overlay/mask elements blocking events?** (need `pointer-events: none`?)
6. **Is there momentum/inertia scrolling?** (don't skip it)
7. **Is the component split into sub-components?** (match the split)

## Lynx-Specific Considerations

### Scrolling — use `<scroll-view>`, NOT `overflow: scroll`

Lynx does NOT support `overflow: scroll` or `overflow: auto`. All scrolling MUST use
`<scroll-view>` with `scroll-orientation`. This affects many components:

- **Tabs scrollable nav**: Vant uses `overflow-x: auto` on the tab header. In Lynx, wrap
  tab headers in `<scroll-view scroll-orientation="horizontal">`.
- **IndexBar sidebar**: Same — horizontal or vertical overflow must be `<scroll-view>`.
- **Picker columns**: Vant uses `overflow-y: auto` on content. Use `<scroll-view>` instead.
- **DropdownMenu**: Scrollable menu content needs `<scroll-view>`.
- **Any horizontally scrollable list**: `<scroll-view scroll-orientation="horizontal">`.

```vue
<!-- WRONG: Lynx ignores overflow:scroll -->
<view :style="{ overflowX: 'auto', whiteSpace: 'nowrap' }">
  <view v-for="tab in tabs">...</view>
</view>

<!-- CORRECT: use <scroll-view> -->
<scroll-view scroll-orientation="horizontal" :style="{ flexDirection: 'row' }">
  <view v-for="tab in tabs">...</view>
</scroll-view>
```

For large datasets or infinite scrolling, use `<list>` instead of `<scroll-view>`.
Ref: https://lynxjs.org/guide/ui/scrolling.html

### Common API Mappings
- DOM `getBoundingClientRect` -> `SelectorQuery.select().boundingClientRect()`
- DOM `IntersectionObserver` -> Lynx `IntersectionObserver` API
- DOM `overflow: scroll` -> `<scroll-view scroll-orientation="vertical|horizontal">`
- CSS animations -> `@keyframes` in `.less` files (fully supported)
- Touch events -> `bindtouchstart`, `bindtouchmove`, `bindtouchend`

### Styling Reference
- Rspeedy supports Less via `@rsbuild/plugin-less`
- CSS selectors, variables, @keyframes all work (`enableCSSSelector: true`)
- Use `rpx` for responsive units if needed
- Motion docs: https://lynxjs.org/guide/styling/animation.md
- Styling docs: https://lynxjs.org/rspeedy/styling.html

## Homepage Component Categories (MUST match Vant exactly)

The homepage (`pages/index.vue`) MUST list components grouped and ordered exactly like Vant's
demo app (from `vant.config.mjs`). Use Chinese titles with component name:

```
基础组件: Button 按钮, Cell 单元格, ConfigProvider 全局配置, Icon 图标, Image 图片,
          Layout 布局, Popup 弹出层, Space 间距, Toast 轻提示

表单组件: Calendar 日历, Cascader 级联选择, Checkbox 复选框, DatePicker 日期选择,
          Field 输入框, Form 表单, NumberKeyboard 数字键盘, PasswordInput 密码输入框,
          Picker 选择器, PickerGroup 选择器组, Radio 单选框, Rate 评分, Search 搜索,
          Slider 滑块, Signature 签名, Stepper 步进器, Switch 开关, TimePicker 时间选择,
          Uploader 文件上传

反馈组件: ActionSheet 动作面板, Barrage 弹幕, Dialog 弹出框, DropdownMenu 下拉菜单,
          FloatingPanel 浮动面板, FloatingBubble 浮动气泡, Loading 加载, Notify 消息通知,
          Overlay 遮罩层, PullRefresh 下拉刷新, ShareSheet 分享面板, SwipeCell 滑动单元格

展示组件: Badge 徽标, Circle 环形进度条, Collapse 折叠面板, CountDown 倒计时,
          Divider 分割线, Empty 空状态, Highlight 高亮文本, ImagePreview 图片预览,
          List 列表, NoticeBar 通知栏, Popover 气泡弹出框, Progress 进度条,
          RollingText 翻滚文本, Skeleton 骨架屏, Steps 步骤条, Sticky 粘性布局,
          Swipe 轮播, Tag 标签, TextEllipsis 文本省略, Watermark 水印

导航组件: ActionBar 动作栏, BackTop 回到顶部, Grid 宫格, IndexBar 索引栏,
          NavBar 导航栏, Pagination 分页, Sidebar 侧边导航, Tab 标签页,
          Tabbar 标签栏, TreeSelect 分类选择

业务组件: AddressEdit 地址编辑, AddressList 地址列表, Area 省市区选择, Card 商品卡片,
          ContactCard 联系人卡片, ContactEdit 联系人编辑, ContactList 联系人列表,
          Coupon 优惠券, SubmitBar 提交订单栏
```

Note: `Style 内置样式` — demos text ellipsis, hairline borders, and built-in transition
animations (van-fade, van-slide-up/down/left/right). Include it — good test for Transition + CSS.
Note: Skip `Lazyload 懒加载` — Vue directive, not a component. Can be added later.
Note: Skip `组合式 API` category — internal utilities, no visual demo. Implement them as
shared composables used by components (useTouch, useLockScroll, useCountDown, etc.).

## Verification Steps Per Story

### Step 1: Props/Events/Slots Audit
```bash
# Fetch Vant source and count props/events/slots
# Compare against our implementation
# List any gaps
```

### Step 2: File Structure Check
```bash
# Count source files in Vant: ls packages/vant/src/{component}/
# Count our files: ls examples/vant-lynx/src/components/{ComponentName}/
```

### Step 3: Demo Page Check
```bash
# Read Vant demo source for section count
# Compare against our pages/{component}.vue section count
```

### Step 4: Test Parity Check
```bash
# Count Vant test cases
# Count our test cases
# Run tests
cd examples/vant-lynx && pnpm test -- --reporter=verbose --testPathPattern="{ComponentName}"
```

### Step 5: Visual Verification
```
Use dev-browser skill:
1. Open http://localhost:3000/{component} (our demo)
2. Take screenshot
3. Open https://vant-ui.github.io/vant/#/en-US/{component} (Vant reference)
4. Take screenshot
5. Compare layout, colors, spacing
```

### Step 6: TypeScript Check
```bash
cd examples/vant-lynx && npx tsc --noEmit 2>&1 | head -30
```

## Dev Server

Start the dev server if not running:
```bash
cd examples/vant-lynx && pnpm dev &
```

## Progress Report Format

APPEND to progress.txt:
```
## [Date/Time] - [Story ID]: [Component Name]
- Props: X/Y (list any added)
- Events: X/Y (list any added)
- Slots: X/Y
- CSS Variables: X defined in index.less
- Animations: [list transitions implemented]
- Tests: X cases (Vant has Y)
- Demo sections: X/Y
- Visual match: [pass/fail with notes]
- Limitations: [list any, or "none"]
---
```

## Consolidate Patterns

If you discover a reusable pattern, add it to `## Codebase Patterns` at the TOP of progress.txt.

## Quality Standards

- Use `createNamespace` + BEM classes matching Vant's class names exactly
- All Vant CSS variables AND class selectors in `index.less`; the file MUST be imported
- Inline styles ONLY for the `color` prop — everything else via CSS classes
- `@keyframes` in `.less` for animations; `<Transition>` with CSS class-based enter/leave
- Icon font via `@font-face` — NOT emoji/unicode fallbacks
- TypeScript strict mode — no `any` types without justification
- Vue Composition API with `<script setup lang="ts">`
- Import from `vue-lynx` not `vue`

## Stop Condition

After completing a story, check if ALL stories have `passes: true`.

If ALL complete: `<promise>COMPLETE</promise>`

Otherwise, end normally for next iteration.

## Important

- ONE component per iteration
- ALWAYS run visual verification
- ALWAYS run tests
- Commit only after ALL checks pass
- Read Vant source code before implementing - do not guess

---

## Appendix: Lynx Platform Reference (from lynxjs.org/llms.txt)

This section is extracted from the official Lynx documentation. Read it to understand what
Lynx can and cannot do. Do NOT guess platform capabilities — check here first.

### What is Lynx

Lynx is a cross-platform rendering engine (iOS, Android, HarmonyOS, web). It uses a
dual-thread JS runtime with native rendering. VueLynx runs Vue 3 on Lynx's dual threads.

### Mental Model: Lynx vs Web

| Web | Lynx |
|-----|------|
| `index.html` + assets | Lynx bundle (JS bytecode + styles) |
| DOM + CSSOM | Element tree + styling system |
| Browser main thread | Lynx main thread (first-screen rendering, layout, main-thread scripts) |
| Browser task queue | Background thread (Vue scheduling, lifecycle, side effects) |
| `window` / `document` | `lynx` global object — NO DOM APIs |

### Element System

Built-in tags: `view`, `text`, `image`, `scroll-view`, `list`, `input`, `textarea`, `page`, `frame`.
- They map to native controls (iOS UIView, Android ViewGroup, web custom elements)
- Text MUST be inside `<text>` — cannot drop text inside `<view>`
- `<svg>` uses `content` attribute or `src` attribute (not inline SVG children)

### Layout System

| Mode | Notes |
|------|-------|
| `display: linear` (DEFAULT) | Vertical main axis. Use `linear-direction`, `linear-weight` |
| `display: flex` | Standard flexbox. `min-content` unsupported, shrink lower bound is `0px` |
| `display: grid` | Supports rows/columns/gaps. Lacks `grid-area` and line names |
| `display: relative` | Mobile only. Android RelativeLayout model |

Key differences:
- Every element defaults to `box-sizing: border-box`; NO margin collapsing
- NO `inline` vs `block` toggle — text layout uses `<text>` element
- `overflow: scroll` is UNSUPPORTED — use `<scroll-view>` with `scroll-orientation`
- `position` supports `relative`, `absolute`, `fixed`. `fixed` promotes under root node

### Styling System

- CSS selectors and inline styles work (largely identical to web)
- `rpx` unit for responsive sizing
- `-x-` prefixed properties for mobile capabilities (e.g. `-x-auto-font-size`)
- CSS variables supported. Regular properties do NOT inherit by default —
  enable `enableCSSInheritance` or `customCSSInheritanceList` in plugin config
- `@font-face` supported (host must implement font loading)
- `@keyframes`, `transition`, `animation` all supported

### Event Model

- Event attribute names: `bindtap`, `catchtap`, `capture-bindtap`, `global-bindtap`
- `main-thread:` prefix for main-thread events (e.g. `main-thread:bindtap`)
- Propagation: capture + bubble over element tree. Non-touch events fire on target only
- Background thread receives plain JSON event objects
- Main-thread events expose `MainThread.Element` via `currentTarget`

### Scrolling

- `overflow: scroll` does NOT work. Use `<scroll-view scroll-orientation="vertical|horizontal">`
- `<scroll-view>` has linear layout capability
- For large datasets / infinite scroll, use `<list>` element instead
- `scroll-y` / `scroll-x` attributes enable scrolling direction

### Networking

- `fetch` API works but depends on host HTTP service
- No `window` or `document` globals
- No `TextEncoder`/`TextDecoder` — use `TextCodecHelper`
- Main thread: ES2019 syntax. Background thread: ES2015. SWC transpiles during build

### Key Differences from Web (summary)

1. **No DOM** — no `document.querySelector`, no browser globals
2. **Dual-thread** — logic split between background and main threads
3. **Event naming** — `bind`/`catch`/`capture` prefixes, not `on*`
4. **Block-level elements** — all elements are block by default
5. **Opt-in CSS inheritance** — most properties don't inherit
6. **No `overflow: scroll`** — must use `<scroll-view>`
7. **No `useLayoutEffect`** — use layout events or main-thread scripts
8. **Host-dependent services** — fetch, fonts, native modules depend on host

### Quick Reference

| Scenario | Web | Lynx |
|----------|-----|------|
| Scroll containers | `overflow: scroll` | `<scroll-view scroll-orientation="...">` |
| Gesture animation | JS event handlers | `main-thread:bindtouchmove` + main-thread functions |
| DOM refs | `useRef<HTMLDivElement>` | `SelectorQuery.select()` + `.invoke()` |
| Dynamic theming | CSS vars + classList | CSS vars + class switching |
| Sync measurement | `getBoundingClientRect` | `NodesRef.invoke('boundingClientRect')` or `bindlayoutchange` |

### Background-Thread-Only APIs

`lynx.createSelectorQuery`, `lynx.getElementById`, `lynx.reload`,
`fetch`, `setTimeout`, `setInterval`, `requestAnimationFrame`,
`lynx.performance` timing listeners

### VueLynx-Specific Knowledge (from vue-lynx docs)

**Import**: Always `import { ref, computed } from 'vue-lynx'`, NOT `from 'vue'`.

**Vue Feature Compatibility**:

| Feature | Status | Notes |
|---------|--------|-------|
| `<style>` (plain) | Works | Use this for component styles |
| Imported `.css`/`.less` files | Works | `import './index.less'` |
| `<style module>` | Works | CSS modules supported |
| `<style scoped>` | NOT supported | Use plain `<style>` instead |
| `v-bind()` in `<style>` | NOT supported | Use computed `:style` bindings |
| `v-model` on components | Works | `defineModel()`, `v-model:show`, etc. |
| `v-model` on `<input>` | NOT supported | Use `:value` + `@input` manually |
| `<Transition>` | Experimental | MUST pass explicit `:duration` prop |
| `<TransitionGroup>` | Experimental | No FLIP/move animations |
| `<KeepAlive>` | NOT supported | Use manual state caching |
| `<Teleport>` | NOT supported | Render conditionally at target location |
| `<Suspense>` | Works | With async `setup()` and `defineAsyncComponent` |
| Provide / Inject | Works | Use Symbol keys for Vant parent-child communication |
| Composition API | Works | Full `@vue/reactivity` support |
| Options API | Works | Enabled by default (`optionsApi: true`) |

**`<Transition>` — MUST pass `:duration`**:
`getComputedStyle()` is unavailable from the background thread, so auto-duration detection
does not work. Always pass an explicit duration:
```vue
<Transition name="van-fade" :duration="300">
  <view v-if="show" class="van-overlay" />
</Transition>
```

**Events syntax**: Vue `@tap` compiles to `onTap` prop, which vue-lynx's runtime maps to
`bindtap`. Both work. For main-thread events, use `:main-thread-bindtap`.


**Main Thread Script** — for smooth gesture animations:
```vue
<script setup lang="ts">
import { useMainThreadRef } from 'vue-lynx'
const mtRef = useMainThreadRef(null)
const onScroll = (event) => {
  'main thread'  // directive — runs on main thread, zero cross-thread delay
  mtRef.current?.setStyleProperty('transform', `translateY(${event.detail.scrollTop}px)`)
}
</script>
<scroll-view :main-thread-bindscroll="onScroll">...</scroll-view>
<view :main-thread-ref="mtRef">...</view>
```
Use Main Thread Script for: drag gestures, scroll-linked animations, swipe interactions.
Do NOT use for: simple tap handlers, state toggles, navigation (use background thread).

### Built-in Elements Reference

- `<view>` — container (like `<div>`)
- `<text>` — text content (required for all text)
- `<image>` — images
- `<scroll-view>` — scrollable container
- `<list>` — virtualized list for large datasets
- `<input>` — text input
- `<textarea>` — multiline text input
- `<page>` — root page element
- `<frame>` — frame container
