# `v-bind()` in `<style>` blocks

## Overview

Vue's SFC compiler lets you reference reactive JavaScript values directly inside CSS:

```vue
<script setup>
import { ref } from 'vue'
const textColor = ref('#1565c0')
</script>

<style>
.title {
  color: v-bind(textColor);
}
</style>
```

The compiler transforms this at build time:

- **CSS** — `color: v-bind(textColor)` becomes `color: var(--v33993c7f)`
- **JS** — a `useCssVars` call is injected into `setup()`: `useCssVars(_ctx => ({ "v33993c7f": _ctx.textColor }))`

The hash (`v33993c7f`) is deterministic and scoped per component.

---

## Setup

Two flags must be set in `lynx.config.ts`:

```ts
pluginVueLynx({
  enableCSSInlineVariables: true, // allows --* properties in inline styles
  enableCSSInheritance: true,     // allows CSS vars to cascade to child elements
})
```

Without `enableCSSInlineVariables` the engine ignores `--*` on inline styles. Without `enableCSSInheritance` the variable is set on the component root but never reaches descendant elements.

---

## What works

```vue
<style>
.title {
  color: v-bind(textColor);         /* ✓ paint property — updates reactively */
}
.card {
  background-color: v-bind(bgColor); /* ✓ paint property — updates reactively */
}
</style>
```

Paint-only properties (`color`, `background-color`, `opacity`, `border-color`) update correctly when the reactive value changes.

---

## Known limitation — layout properties

```vue
<style>
.text {
  font-size: v-bind(fontSize); /* ✗ does not update reactively */
}
</style>
```

`font-size` and other layout-affecting properties do not update visually when the reactive value changes. The CSS var is set correctly on the root element, but the Lynx engine does not appear to trigger a layout re-pass when an inherited inline CSS var changes. This is specific to dynamic updates — the initial render value is applied correctly.

**Workaround:** drive layout properties via `:style` binding directly on the element.

```vue
<text :style="{ fontSize }">...</text>
```

This is undocumented behaviour in the Lynx engine. See [`LYNX-ISSUES.md`](./LYNX-ISSUES.md) for the issue to file upstream.

---

## Use `<style>` not `<style scoped>`

`<style scoped>` does not work in Lynx — the engine does not support the `[data-v-xxx]` attribute selectors Vue generates for scoped styles. Use plain `<style>` for global rules, or `<style module>` for component-scoped styles.

```vue
<!-- ✗ scoped — rules are silently ignored in Lynx -->
<style scoped>
.title { color: v-bind(textColor); }
</style>

<!-- ✓ plain — works -->
<style>
.title { color: v-bind(textColor); }
</style>
```

A DEV-mode console warning is emitted when a scoped component mounts, pointing to `<style module>` as the alternative.

---

## How it works internally

`use-css-vars.ts` provides a Lynx-native `useCssVars` that replaces the `@vue/runtime-dom` version (which uses DOM APIs unavailable in Lynx's Background Thread). It is re-exported from `index.ts` so the compiler-generated `import { useCssVars } from 'vue'` resolves correctly.

```
useCssVars(getter)
  └── watchPostEffect(() => {
        vars = getter(instance.proxy)
        applyVarsToVNode(instance.subTree, vars)
      })

applyVarsToVNode(vnode, vars)
  ├── SF_ELEMENT       → applyVarsToEl(el, vars)
  ├── SF_COMPONENT     → recurse into vnode.component.subTree
  └── SF_ARRAY_CHILDREN → walk each child (Fragment support)

applyVarsToEl(el: ShadowElement, vars)
  ├── merge vars into el._style as '--key': value
  ├── preserve vShow hidden state
  └── pushOp(OP.SET_STYLE, el.id, style) + scheduleFlush()
```

The SFC compiler passes keys without a leading `--` (e.g. `"v33993c7f"`). The implementation adds `--` here, matching `@vue/runtime-dom`'s `el.style.setProperty('--v33993c7f', value)`.

---

## File map

| File | Role |
|---|---|
| `runtime/src/use-css-vars.ts` | Lynx-specific `useCssVars` implementation |
| `runtime/src/index.ts` | Re-exports `useCssVars` so the compiler alias resolves |
| `runtime/src/node-ops.ts` | `setScopeId` — emits DEV warning for `<style scoped>` |
| `examples/css-features/src/VBindCSS.vue` | Live example |
| `examples/css-features/lynx.config.ts` | Config with required flags |
