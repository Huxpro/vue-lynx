# Vant-Lynx Documentation Site - Clone Plan (PRD)

## Overview

Build a component documentation site for vant-lynx that mirrors Vant's documentation experience, adapted for the Lynx rendering environment. The site will be integrated into the existing vue-lynx Rspress website.

### Design Principles

1. **Extend, don't replace**: Build on the existing Rspress website (`website/`), not a new site
2. **Lynx-native preview**: Use `<Go>` component (Lynx Web runtime) instead of iframe simulator
3. **Automate what's repetitive**: Auto-generate boilerplate (sidebar, demo bundles), hand-write what's unique (usage docs, API notes)
4. **Incremental delivery**: Each story is independently deployable

### Target URL structure

```
/vant/                          -> Vant-Lynx overview page
/vant/button                    -> Button component doc
/vant/cell                      -> Cell component doc
/vant/{component-name}          -> Each component doc
```

---

## Story 1: Vant-Lynx Demo Bundle Pipeline

**Goal**: Pre-build each vant-lynx demo page into a `.lynx.bundle` so the `<Go>` component can render it in the docs site.

### Files to create/modify:
- `website/scripts/build-vant-demos.mjs` -- script to build vant-lynx demo bundles
- `examples/vant-lynx/lynx.config.ts` -- ensure multi-entry config supports per-component bundles

### Requirements:
1. Build each demo page (`examples/vant-lynx/src/pages/*.vue`) as a separate entry point
2. Output bundles to `website/docs/public/examples/vant-lynx/dist/{component}/`
3. Support incremental builds (only rebuild changed demos)
4. Add `build:vant-demos` script to `website/package.json`
5. Integrate into `pnpm prepare:docs` pipeline

### Test command:
```bash
cd website && pnpm build:vant-demos
# Verify: ls docs/public/examples/vant-lynx/dist/button/
# Should contain: *.lynx.bundle, debug-info.json
```

### Estimated complexity: Medium
- Need to configure rspeedy multi-entry or per-component builds
- May need to modify `examples/vant-lynx/lynx.config.ts` to support this

---

## Story 2: Component Doc Page Template & First 5 Components

**Goal**: Create a reusable MDX template and write docs for the first 5 components (Button, Cell, Icon, Tag, Loading).

### Files to create:
- `website/docs/vant/button.mdx`
- `website/docs/vant/cell.mdx`
- `website/docs/vant/icon.mdx`
- `website/docs/vant/tag.mdx`
- `website/docs/vant/loading.mdx`

### MDX template structure (mirroring Vant):

```mdx
# Button

Mobile UI button component for Lynx, ported from [Vant Button](https://vant-ui.github.io/vant/#/en-US/button).

## Demo

<Go example="vant-lynx" entry="button" defaultEntryFile="dist/button/main.lynx.bundle" />

## Usage

### Button Type

:::code-group
```vue [Lynx]
<Button type="primary" text="Primary" />
<Button type="success" text="Success" />
```
:::

### Plain Button
...

## API

### Props

| Prop | Description | Type | Default |
|------|-------------|------|---------|
| type | Button type | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` |
| size | Button size | `'large' \| 'normal' \| 'small' \| 'mini'` | `'normal'` |
...

### Events

| Event | Description | Arguments |
|-------|-------------|-----------|
| click | Triggered when clicked | `event: Event` |

### Slots

| Name | Description |
|------|-------------|
| default | Button content |
| icon | Custom icon |
| loading | Custom loading |

### Lynx-Specific Notes

- `tag` prop: accepted for API compat but always renders as `<view>` (Lynx has no HTML tags)
- `nativeType`: not applicable in Lynx (no form submission)
- Click feedback: uses opacity overlay instead of CSS `:active`
```

### Requirements:
1. Each doc page must embed a working `<Go>` preview
2. Props/Events/Slots tables extracted from component source comments
3. Include "Lynx-Specific Notes" section for platform differences
4. Code examples use `<Button>` not `<van-button>` (vant-lynx uses PascalCase imports)

### Test command:
```bash
cd website && pnpm dev
# Navigate to /vant/button, verify:
# 1. Go preview renders the button demo
# 2. Props table is accurate
# 3. Code examples are correct
```

### Estimated complexity: Medium-High
- Template design is one-time effort
- Per-component docs require reading source + writing

---

## Story 3: Sidebar Navigation & Category Grouping

**Goal**: Add a `/vant/` sidebar to `rspress.config.ts` with Vant-style category grouping.

### Files to modify:
- `website/rspress.config.ts` -- add vant sidebar config
- `website/scripts/generate-vant-sidebar.ts` -- (optional) auto-generate sidebar from component list

### Sidebar structure (matching Vant's categories):

```typescript
'/vant/': [
  { text: 'Overview', link: '/vant/' },
  { dividerType: 'solid' },
  { sectionHeaderText: 'Basic Components' },
  { text: 'Button', link: '/vant/button' },
  { text: 'Cell', link: '/vant/cell' },
  { text: 'Icon', link: '/vant/icon' },
  { text: 'Image', link: '/vant/image' },
  { text: 'Layout', link: '/vant/layout' },
  { text: 'Popup', link: '/vant/popup' },
  { text: 'Toast', link: '/vant/toast' },
  { dividerType: 'solid' },
  { sectionHeaderText: 'Form Components' },
  { text: 'Checkbox', link: '/vant/checkbox' },
  { text: 'Field', link: '/vant/field' },
  { text: 'Form', link: '/vant/form' },
  { text: 'Radio', link: '/vant/radio' },
  { text: 'Rate', link: '/vant/rate' },
  { text: 'Search', link: '/vant/search' },
  { text: 'Slider', link: '/vant/slider' },
  { text: 'Stepper', link: '/vant/stepper' },
  { text: 'Switch', link: '/vant/switch' },
  // ... etc
  { sectionHeaderText: 'Display Components' },
  // Badge, Divider, Empty, Loading, NoticeBar, Progress, Skeleton, Steps, Tag, ...
  { sectionHeaderText: 'Navigation Components' },
  // Grid, IndexBar, NavBar, Sidebar, Tab, Tabbar, ...
  { sectionHeaderText: 'Feedback Components' },
  // ActionSheet, Dialog, DropdownMenu, Notify, Overlay, Popup, ShareSheet, SwipeCell, Toast, ...
]
```

### Requirements:
1. Add "Vant Components" nav link in top nav bar
2. Sidebar uses same category grouping as Vant official docs
3. Components without docs yet should be listed but link to a placeholder page
4. Category order: Basic -> Form -> Display -> Navigation -> Feedback -> Business

### Test command:
```bash
cd website && pnpm dev
# Verify sidebar appears when navigating to /vant/
# Verify all categories and components are listed
```

### Estimated complexity: Low

---

## Story 4: Phone Simulator Chrome (CSS Shell)

**Goal**: Wrap the `<Go>` preview in a phone-shaped CSS frame, positioned like Vant's right-side simulator.

### Files to create/modify:
- `website/src/components/phone-simulator/PhoneSimulator.tsx` -- phone frame wrapper
- `website/src/components/phone-simulator/phone-simulator.module.scss` -- styles
- Update `Go.tsx` or create a `VantDemo.tsx` wrapper

### Design spec (mirroring Vant):

```
+----------------------------------+
|  .----------------------------.  |
|  |     Phone Status Bar       |  |
|  |----------------------------|  |
|  |                            |  |
|  |   <Go> component renders   |  |
|  |   the Lynx demo here       |  |
|  |                            |  |
|  |                            |  |
|  |                            |  |
|  '----------------------------'  |
+----------------------------------+
```

### Requirements:
1. Phone frame with rounded corners, shadow, status bar
2. Fixed position on desktop, inline on mobile viewport
3. Responsive: hide simulator frame on screens < 1100px width
4. Light/dark theme support
5. Frame dimensions: ~375x667 (iPhone SE aspect ratio)

### Test command:
```bash
cd website && pnpm dev
# Navigate to /vant/button
# Verify phone frame appears around Go preview on desktop
# Resize browser to < 1100px, verify frame hides/adapts
```

### Estimated complexity: Low-Medium

---

## Story 5: Vant-Lynx Overview Page

**Goal**: Create the landing page for the Vant-Lynx component library section.

### Files to create:
- `website/docs/vant/index.mdx`

### Content:
1. Hero: "Vant Lynx" title + description ("Mobile UI Components for Lynx, ported from Vant")
2. Feature highlights (94 components, dark mode, Vue 3 Composition API)
3. Quick start snippet
4. Component gallery grid (thumbnails linking to individual docs)
5. Compatibility note (which Vant features are supported, which aren't)

### Requirements:
1. Link to original Vant docs for comparison
2. Show component count and test coverage
3. Installation instructions
4. Visual grid of component categories

### Test command:
```bash
cd website && pnpm dev
# Navigate to /vant/
# Verify overview page renders with all sections
```

### Estimated complexity: Low

---

## Story 6: Auto-Generate Component Doc Scaffolding

**Goal**: Script to generate initial MDX files for all 94 components by parsing source code.

### Files to create:
- `website/scripts/generate-vant-docs.ts`

### What it does:
1. Scan `examples/vant-lynx/src/components/*/index.vue`
2. Extract component name, props interface, events, slots from source
3. Parse the "Vant Feature Parity Report" comment block (already exists in many components)
4. Generate MDX file with:
   - Props table from TypeScript interface
   - Events table from `defineEmits`
   - Slots table from `<slot>` usage in template
   - Lynx-specific notes from parity report comments
   - Placeholder `<Go>` component embed

### Requirements:
1. Only generate files that don't already exist (don't overwrite hand-written docs)
2. Mark auto-generated sections with `<!-- auto-generated -->` comments
3. Handle components with sub-components (e.g., Checkbox + CheckboxGroup)
4. Output to `website/docs/vant/{component}.mdx`

### Test command:
```bash
cd website && npx tsx scripts/generate-vant-docs.ts
# Verify: ls docs/vant/ | wc -l  # Should be ~80+ files
# Verify: cat docs/vant/switch.mdx  # Should have correct props table
```

### Estimated complexity: High
- Vue SFC parsing needed (can use `@vue/compiler-sfc`)
- TypeScript interface parsing for props
- Template analysis for slots

---

## Story 7: Batch Docs for Remaining Components (Form + Display)

**Goal**: Write polished docs for Form and Display category components.

### Components (Form):
Checkbox, Field, Form, Radio, Rate, Search, Slider, Stepper, Switch, Picker, DatePicker, TimePicker, Calendar, Cascader, NumberKeyboard, PasswordInput, Uploader

### Components (Display):
Badge, Divider, Empty, Highlight, Loading, NoticeBar, Progress, Circle, Skeleton, Steps, CountDown, Tag, TextEllipsis, RollingText, Watermark, Barrage, Card, Swipe, ImagePreview

### Requirements:
1. Start from auto-generated scaffolding (Story 6)
2. Add hand-written usage sections with code examples
3. Verify Go preview works for each component
4. Mark "Lynx Limitations" for each component

### Test command:
```bash
cd website && pnpm build
# Verify build succeeds with all new pages
# Spot-check 5 random component pages in browser
```

### Estimated complexity: High (volume)

---

## Story 8: Batch Docs for Remaining Components (Navigation + Feedback + Business)

**Goal**: Write polished docs for remaining category components.

### Components (Navigation):
Grid, IndexBar, NavBar, Sidebar, Tab, Tabbar, BackTop, Pagination, Sticky, TreeSelect

### Components (Feedback):
ActionSheet, Dialog, DropdownMenu, FloatingBubble, FloatingPanel, Notify, Overlay, Popup, ShareSheet, SwipeCell, Toast, PullRefresh, Popover

### Components (Business):
ActionBar, AddressEdit, AddressList, Area, Card, ContactCard, ContactEdit, ContactList, CouponList, SubmitBar

### Requirements:
Same as Story 7.

### Test command:
Same as Story 7.

### Estimated complexity: High (volume)

---

## Story 9: Component Feature Parity Dashboard

**Goal**: Create an auto-generated dashboard showing vant-lynx vs Vant feature coverage.

### Files to create:
- `website/scripts/generate-parity-dashboard.ts`
- `website/docs/vant/parity.mdx`

### What it shows:
| Component | Props | Events | Slots | Status |
|-----------|-------|--------|-------|--------|
| Button    | 21/21 | 2/2    | 3/3   | Full   |
| Cell      | 15/15 | 1/1    | 4/4   | Full   |
| ...       | ...   | ...    | ...   | ...    |

### Requirements:
1. Parse "Vant Feature Parity Report" comment blocks from component sources
2. Generate summary MDX with table
3. Overall coverage percentage
4. Link each row to the component's doc page

### Test command:
```bash
cd website && npx tsx scripts/generate-parity-dashboard.ts
# Verify: cat docs/vant/parity.mdx  # Should show table
```

### Estimated complexity: Medium

---

## Story 10: Dark Mode & Theme Customization Docs

**Goal**: Document theming and dark mode support.

### Files to create:
- `website/docs/vant/theme.mdx`

### Content:
1. How dark mode works in vant-lynx (ConfigProvider + useTheme)
2. CSS variable reference table
3. Live Go preview with theme toggle
4. Custom theme example

### Requirements:
1. Embed Go preview with dark mode toggle
2. List all CSS variables per component
3. Show how to use ConfigProvider

### Test command:
```bash
cd website && pnpm dev
# Navigate to /vant/theme
# Verify dark mode toggle works in Go preview
```

### Estimated complexity: Low-Medium

---

## Execution Order & Dependencies

```
Story 1 (Demo Bundle Pipeline)
    |
    v
Story 2 (Template + First 5 Components)  <-- validates the approach
    |
    +---> Story 3 (Sidebar)  [parallel]
    +---> Story 4 (Phone Simulator Chrome)  [parallel]
    +---> Story 5 (Overview Page)  [parallel]
    |
    v
Story 6 (Auto-Generate Scaffolding)
    |
    +---> Story 7 (Form + Display Docs)  [parallel]
    +---> Story 8 (Nav + Feedback + Business Docs)  [parallel]
    |
    v
Story 9 (Parity Dashboard)  [parallel with 7/8]
Story 10 (Theme Docs)  [parallel with 7/8]
```

### MVP (minimum viable):
Stories 1 + 2 + 3 + 5 = working site with 5 component docs

### Full site:
All 10 stories = complete documentation for 94 components with auto-generation, phone simulator chrome, parity dashboard, and theme docs
