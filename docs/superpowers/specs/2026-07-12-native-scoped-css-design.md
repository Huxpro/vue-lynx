# Native scoped CSS composition

## Problem

Vue applies more than one scope token to a nested component root: the child
component's own scope and the parent component's scope. Vue Lynx currently
converts each token into a numeric Lynx CSS ID and emits repeated
`__SetCSSId` calls.

Native Lynx stores one `css_id_` per element. Each call replaces the previous
value. In PR #195's Vapor example, the parent scope replaces the Counter
scope, so the Counter root loses its `.counter` rule in Lynx Explorer even
though the same page works on Lynx for Web.

## Design

Represent Vue scope tokens as ordinary, collision-resistant CSS classes:

- Transform generated selectors such as `.counter[data-v-cb80395f]` into
  `.counter.data-v-cb80395f` during Lynx CSS serialization.
- Attach every `data-v-*` token to the element's class list instead of mapping
  it to a native numeric CSS ID.
- Keep all transformed scoped rules in the common stylesheet rather than
  wrapping each SFC stylesheet in one native `@cssId` block.
- Preserve the public DOM-like attribute behavior: scope tokens remain an
  internal compiler/runtime concern and do not enter the generic attribute
  map.

This matches browser selector semantics while allowing a component root to
carry any number of parent, child, or slotted scope tokens.

## Components

### CSS serialization

Replace the existing scope-stripping AST plugin with a scope-class plugin.
Only Vue-generated `data-v-*` attribute selectors change; unrelated attribute
selectors retain their existing behavior.

Disable `VueScopedCSSIdPlugin`, because adding `cssId` to style module queries
would still isolate each stylesheet behind a native scope that an element
cannot compose.

### VDOM runtime

`nodeOps.setScopeId` adds the scope token to the `ShadowElement` class state
and emits `SET_CLASS`. It must preserve static, dynamic, and previously added
scope classes without duplicates.

### Vapor runtime

Both inert template parsing and live `setAttribute('data-v-*', '')` handling
add the token to the same scope-class state. Template registration and cloning
serialize the resolved class string, so no `SET_SCOPE_ID` operation is needed.

### Compatibility

The `SET_SCOPE_ID` opcode remains readable by the Main Thread for bundles
built by older Vue Lynx versions. New bundles stop emitting it for Vue scopes.
This avoids a wire-format break while fixing new builds.

## Testing

- Unit-test selector conversion, including compound and multiple selectors.
- Verify VDOM elements retain two scope classes after repeated `setScopeId`.
- Compile and mount nested scoped Vapor SFCs and assert the child root carries
  both scope classes.
- Build the package and Vapor example.
- In iOS Lynx Explorer, verify `.counter` matches, the controls form one row,
  taps update the count/history, input updates `v-model`, and both VM threads
  have no application errors.

## Non-goals

- No changes to user-authored class names or non-Vue attribute selectors.
- No removal of the legacy `SET_SCOPE_ID` interpreter path.
- No unrelated benchmark or Vapor runtime refactoring.
