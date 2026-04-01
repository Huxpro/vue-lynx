# Lynx Engine Issues to File

Issues discovered while implementing `v-bind()` in `<style>` blocks for vue-lynx.
File these at https://github.com/lynx-family/lynx/issues.

---

## 1. `font-size: var(--*)` does not trigger relayout on dynamic inline CSS var update

**Repo:** `lynx-family/lynx`
**Suggested label:** `bug`, `css`

### Description

When a CSS custom property is set as an inline style and a CSS class rule references it via `var()`, paint-only properties (e.g. `color`) update correctly on dynamic change. Layout-affecting properties (e.g. `font-size`) do not — the initial render value is applied, but subsequent reactive updates have no visual effect.

### Reproduction

Enable `enableCSSInlineVariables: true` and `enableCSSInheritance: true`. Mount a component where:

1. A CSS custom property `--font-size` is set on the root element's inline style
2. A descendant element has a CSS class rule `font-size: var(--font-size)`
3. The inline style is updated (e.g. from `14px` to `20px`)

**Expected:** the descendant element re-renders at the new font size.
**Actual:** the font size does not change. The CSS var value is updated in the inline style, but no layout re-pass is triggered.

### Contrast

`color: var(--color)` in the same setup updates correctly, suggesting the engine re-evaluates paint properties on CSS var change but does not re-trigger layout measurement.

### Context

- `font-size` is in the default `enableCSSInheritance` property list
- `font-size: var(--x)` in static CSS class rules works on initial render
- Inline CSS variable support shipped in Lynx 3.6.0 ([#3136](https://github.com/lynx-family/lynx/pull/3136), [#3518](https://github.com/lynx-family/lynx/pull/3518))
- No prior issue filed for this specific case

### Workaround

Drive `font-size` via an inline `:style` binding directly on the element instead of through a CSS class rule with `var()`.

---

## 2. Attribute selectors (`[data-v-xxx]`) not supported — `<style scoped>` silently broken

**Repo:** `lynx-family/lynx`
**Suggested label:** `enhancement`, `css`

### Description

Vue's `<style scoped>` compiles CSS rules to use attribute selectors (e.g. `.title[data-v-abc123]`) and adds the matching attribute to every element at render time. Lynx's CSS engine does not support attribute selectors, so scoped CSS rules are silently ignored — no error, no warning, styles simply don't apply.

### Impact

Any Vue component that uses `<style scoped>` (the default in most Vue tooling and tutorials) will appear unstyled. Because there is no error, this is a silent failure that is difficult to diagnose.

### Behaviour observed

- Elements have the correct class names in the rendered tree
- The `data-v-xxx` scope attributes are never present on elements (vue-lynx's renderer does not implement `setScopeId` since the attributes serve no purpose without engine support)
- CSS rules with attribute selectors produce no match

### Request

Support attribute selectors in the CSS engine, or document the limitation explicitly in the Lynx CSS reference with a recommended alternative.

### Workaround

Use `<style module>` with `:class="$style.className"` bindings. CSS Modules achieve the same component-scoping goal using hashed class names (plain class selectors), which Lynx fully supports.

---

## 3. (Known, open) Chained CSS variable references not evaluated

**Repo:** `lynx-family/lynx`
**Existing issue:** [#816](https://github.com/lynx-family/lynx/issues/816)
**Status:** Open, assigned, as of April 2026

### Description

A CSS variable that references another variable (`--color-critical: var(--color-red)`) is not evaluated correctly and can cause elements to disappear from rendering.

This is already tracked. No action needed unless you have additional reproduction context to add to the existing issue.
