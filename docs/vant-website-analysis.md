# Vant Official Documentation Site - Architecture Analysis

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Build tool | **Rsbuild** (`@rsbuild/core`) — NOT Vite or VitePress |
| CLI | **`@vant/cli`** v7 — custom monorepo tool wrapping Rsbuild |
| Framework | **Vue 3** (Options API for site shell, Composition API for demos) |
| Router | `vue-router` (hash mode) |
| Markdown | `markdown-it` + `markdown-it-anchor` (custom rspack loader) |
| CSS | Less (site chrome + component styles) |
| Code highlight | `highlight.js` |
| Virtual modules | `rspack-plugin-virtual-module` for `site-desktop-shared` / `site-mobile-shared` |

**Key insight**: Vant does NOT use VitePress or any standard doc framework. The entire doc site is a custom SPA built by `@vant/cli` with Rsbuild.

---

## 2. Architecture: Dual-Page Design

The doc site has **two separate Vue app entry points** bundled together:

```
packages/vant-cli/site/
  index.html    -> desktop entry (docs + iframe simulator)
  mobile.html   -> mobile entry (runs inside iframe)
  desktop/
    main.js     -> mounts desktop App
    App.vue     -> <van-doc> wrapper
    components/
      index.vue      -> layout shell (Header + Nav + Content + Simulator)
      Header.vue     -> top bar (logo, version, lang switch, dark mode)
      Nav.vue        -> left sidebar navigation
      Content.vue    -> center: rendered markdown
      Container.vue  -> layout container
      Simulator.vue  -> RIGHT: phone iframe wrapper
  mobile/
    main.js     -> mounts mobile App
    App.vue     -> renders demo components in phone context
```

### Desktop page layout:

```
+--------------------------------------------------+
|  Header (logo, version, lang, dark mode, github) |
+--------+-----------------------+-----------------+
|  Nav   |  Content (markdown)   |  Simulator      |
| (left  |  - intro              |  (iframe to     |
|  side- |  - code examples      |   mobile.html   |
|  bar)  |  - API tables         |   #/component)  |
|        |  - props/events/slots |                  |
+--------+-----------------------+-----------------+
```

### Simulator (iframe):

```vue
<!-- Simulator.vue -->
<iframe ref="iframe" :src="src" :style="simulatorStyle" frameborder="0" />
```

- The `src` is computed as: `{basePath}mobile.html{location.hash}`
- When user navigates to `#/en-US/button` on desktop, iframe loads `mobile.html#/button`
- `position: absolute` initially, switches to `position: fixed` after scrolling past 60px
- Max height 640px
- Desktop <-> Mobile sync via `postMessage` (`iframeReady`, `replacePath`, `updateTheme`)

**Critical for vant-lynx**: This iframe approach works because Vant demos are standard Vue web components. Lynx components cannot render in a browser iframe natively.

---

## 3. Component Documentation Structure

Each Vant component follows this convention:

```
packages/vant/src/button/
  Button.tsx          -> component implementation
  index.ts            -> exports
  index.less          -> styles
  types.ts            -> TypeScript types
  README.md           -> English docs (hand-written markdown)
  README.zh-CN.md     -> Chinese docs (hand-written markdown)
  demo/
    index.vue         -> interactive demo (runs in mobile iframe)
  test/
    index.spec.tsx    -> tests
```

### README.md format:

```markdown
# Button

### Intro
Buttons are used to trigger an action...

### Install
(registration code example)

## Usage

### Type
(description + code block)

## API

### Props
| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|

### Events
| Event | Description | Arguments |

### Slots
| Name | Description |

### CSS Variables
| Name | Default | Description |
```

**All API tables are hand-written**, not auto-generated.

### Demo files (demo/index.vue):

- Import component directly from parent directory
- Use `useTranslate()` composable for i18n demo labels
- Wrap sections in `<demo-block title="...">` for visual grouping
- Live-rendered in the mobile iframe, synced to desktop page via router hash

---

## 4. Virtual Module System

`@vant/cli` generates two virtual modules at build time by scanning `src/`:

### `site-desktop-shared`:
- Scans all components for `README.md` / `README.{lang}.md`
- Generates lazy imports: `const Button_EnUS = () => import('.../button/README.md')`
- Exports `{ documents, config, packageVersion }`
- Desktop router creates routes from `documents`

### `site-mobile-shared`:
- Scans all components for `demo/index.vue`
- Generates lazy imports: `const Button = () => import('.../button/demo/index.vue')`
- Exports `{ demos, config }`
- Mobile router creates routes from `demos`

### i18n name resolution:
```
action-sheet/README.md       -> ActionSheet_EnUS (default lang)
action-sheet/README.zh-CN.md -> ActionSheet_ZhCN
```

---

## 5. Navigation Configuration (`vant.config.mjs`)

```javascript
export default {
  site: {
    defaultLang: 'en-US',
    darkModeClass: 'van-theme-dark',
    versions: [{ label: 'v3', link: '...' }],
    locales: {
      'zh-CN': {
        title: 'Vant 4',
        nav: [
          { title: '开发指南', items: [{ path: 'home', title: '介绍' }] },
          { title: '基础组件', items: [{ path: 'button', title: 'Button 按钮' }] },
        ],
      },
      'en-US': { /* mirror structure */ },
    },
  },
};
```

The `path` field maps to component directories: `button` -> `src/button/README.md` + `src/button/demo/index.vue`.

---

## 6. Key Features Summary

| Feature | Implementation |
|---------|---------------|
| Phone simulator | `<iframe>` pointing to separate `mobile.html` entry |
| Code examples | Markdown code blocks rendered by `markdown-it` + `highlight.js` |
| API tables | Hand-written markdown tables in README files |
| i18n | Separate `README.md` / `README.zh-CN.md` per component |
| Dark mode | CSS class toggle (`van-theme-dark`) + postMessage sync |
| Demo interactivity | Live Vue components running in iframe |
| Version switching | Dropdown linking to different deployment paths |
| Search | Not built-in |
| Auto-generation | None for docs -- all markdown is hand-written |

---

## 7. vant-lynx Current State

### Existing infrastructure (website/):

| Layer | Technology |
|-------|-----------|
| Framework | **Rspress** v2 (`@rspress/core`) |
| Builder | Rsbuild (Rspress built-in) |
| Docs format | MDX |
| API docs | TypeDoc auto-generated from TS source |
| Demo preview | **`<Go>` component** (`@lynx-js/go-web` -- Lynx Web runtime) |
| Styling | SCSS + Semi Design |
| Deploy | Vercel |

### Existing docs structure:

```
website/
  rspress.config.ts
  docs/
    index.mdx              -> homepage
    guide/
      introduction.mdx
      quick-start.mdx
      vant.mdx              -> Vant integration guide
      api/                  -> TypeDoc auto-generated API reference
  src/components/
    go/Go.tsx               -> Go component wrapper (Lynx Web runtime preview)
    home-comps/             -> homepage components
  scripts/
    generate-api.ts         -> TypeDoc API generation
    prepare-examples.mjs    -> copies demo bundles from examples/
  theme/                    -> custom Rspress theme
```

### Existing vant-lynx components (examples/vant-lynx/):

- **94 components** ported (Button, Cell, Icon, Popup, Switch, etc.)
- Each component: `src/components/{Name}/index.vue` + `test/index.spec.ts`
- **79 demo pages**: `src/pages/{name}.vue` (with DemoPage wrapper)
- Router: `vue-router` with memory history, 80 routes
- Build: `rspeedy` (Lynx bundler)
- Features: dark mode toggle, component index page, demo sections

---

## 8. Gap Analysis: What Needs to Change

### What we CAN reuse from Vant's approach:
- Per-component doc structure (Usage + API tables in markdown)
- Nav category grouping (Basic, Form, Display, Navigation, etc.)
- The demo-per-component pattern (already exists)
- Phone simulator visual chrome (CSS frame around preview area)

### What we CANNOT reuse:
- iframe simulator -- Lynx components don't render in browser iframe
- `@vant/cli` build system -- tightly coupled to Vant's monorepo
- Virtual module system -- we already have Rspress

### Key adaptations needed:

1. **Replace iframe with Go Web Explorer**: The existing `<Go>` component already solves this -- it renders Lynx bundles in the browser via `@lynx-js/web-core`
2. **Use Rspress instead of @vant/cli**: Already in place for vue-lynx website
3. **Demo bundles**: Each vant-lynx component's demo page needs to be pre-built as a `.lynx.bundle` for the Go component to render
4. **API docs**: Can use TypeDoc auto-generation (already working) OR hand-write like Vant
5. **Component doc pages**: Need to create MDX files for each of the 94 components, with usage examples + API tables + embedded Go preview
