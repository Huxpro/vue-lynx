# Native Scoped CSS Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make nested Vue scoped styles compose correctly in native Lynx for both VDOM and Vapor applications.

**Architecture:** Encode Vue's `data-v-*` scope tokens as unique CSS classes instead of native Lynx CSS IDs. The CSS serializer rewrites Vue attribute selectors to class selectors, while both renderers merge every scope token into the element's resolved class string; the legacy Main Thread scope opcode remains supported for old bundles.

**Tech Stack:** TypeScript, Vue 3.6 Vapor/VDOM runtimes, Rspeedy CSS serializer plugins, Vitest, Lynx DevTool, iOS Lynx Explorer.

---

### Task 1: Lock the CSS selector contract with a failing test

**Files:**
- Create: `packages/upstream-tests/src/plugin/vue-scope-class-css-plugin.spec.ts`
- Modify: `packages/vue-lynx/plugin/src/plugins/vue-scope-strip-css-plugin.ts`

- [ ] **Step 1: Write a failing unit test**

Create a small css-tree-shaped AST and assert that the plugin changes only
Vue-generated selectors:

```ts
expect(rewriteVueScopeAttribute(scopeAttribute('data-v-a1b2c3d4'))).toEqual({
  type: 'ClassSelector',
  name: 'data-v-a1b2c3d4',
});
expect(rewriteVueScopeAttribute(scopeAttribute('aria-label'))).toBe(false);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm --filter vue-lynx-upstream-tests exec vitest run \
  --config vitest.local.config.ts \
  src/plugin/vue-scope-class-css-plugin.spec.ts
```

Expected: FAIL because `rewriteVueScopeAttribute` is not exported.

- [ ] **Step 3: Implement the minimal selector rewrite**

Replace the strip behavior with an in-place conversion:

```ts
export function rewriteVueScopeAttribute(node: ASTNode): boolean {
  const name = node.type === 'AttributeSelector' ? node.name?.name : undefined;
  if (!name?.startsWith('data-v-')) return false;
  node.type = 'ClassSelector';
  node.name = name;
  delete node.matcher;
  delete node.value;
  delete node.flags;
  return true;
}
```

Walk the complete AST and call this function without removing list items.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/vue-lynx/plugin/src/plugins/vue-scope-strip-css-plugin.ts \
  packages/upstream-tests/src/plugin/vue-scope-class-css-plugin.spec.ts
git commit -m "fix(css): encode Vue scopes as native classes"
```

### Task 2: Lock runtime multi-scope behavior with failing tests

**Files:**
- Modify: `packages/testing-library/src/__tests__/scoped-css.test.ts`
- Modify: `packages/upstream-tests/src/vapor/html-parser.spec.ts`
- Modify: `packages/upstream-tests/src/vapor/vapor-sfc-e2e.spec.ts`
- Modify: `packages/vue-lynx/runtime/src/tree-ops.ts`
- Modify: `packages/vue-lynx/runtime/src/node-ops.ts`
- Modify: `packages/vue-lynx/runtime/src/shadow-element.ts`

- [ ] **Step 1: Write failing VDOM and Vapor tests**

Assert two calls compose into one resolved class string:

```ts
nodeOps.setScopeId!(el, 'data-v-parent');
nodeOps.setScopeId!(el, 'data-v-child');
expect(el._scopeClasses).toEqual(new Set(['data-v-parent', 'data-v-child']));
expect(resolveClass(el)).toBe('data-v-parent data-v-child');
expect(takeOps()).not.toContain(OP.SET_SCOPE_ID);
```

Update the parser assertion to require `data-v-test123` in `_scopeClasses`,
and add a compiled nested scoped Vapor fixture whose child root contains both
the parent and child tokens in `SET_CLASS`/template structure output.

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter vue-lynx-testing-library exec vitest run src/__tests__/scoped-css.test.ts
pnpm --filter vue-lynx-upstream-tests exec vitest run \
  --config vitest.local.config.ts \
  src/vapor/html-parser.spec.ts src/vapor/vapor-sfc-e2e.spec.ts
```

Expected: FAIL because `_scopeClasses` and class-based runtime handling do not exist.

- [ ] **Step 3: Implement shared class resolution**

Add `readonly _scopeClasses = new Set<string>()` to `ShadowElement` and make
`resolveClass` concatenate base, scope, then transition classes:

```ts
export function resolveClass(el: ShadowElement): string {
  const parts: string[] = [];
  if (el._baseClass) parts.push(el._baseClass);
  for (const cls of el._scopeClasses) parts.push(cls);
  for (const cls of el._transitionClasses) parts.push(cls);
  return parts.join(' ');
}
```

Make `nodeOps.setScopeId` add/dedupe the token and emit `SET_CLASS`.
Make inert and live Vapor `data-v-*` handling do the same. Copy scope classes
in granular/template clones and serialize `resolveClass(proto)` into template
`props.c`; stop serializing `props.sc` for new templates.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run both commands from Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/vue-lynx/runtime packages/testing-library/src/__tests__/scoped-css.test.ts \
  packages/upstream-tests/src/vapor
git commit -m "fix(runtime): compose Vue scope classes"
```

### Task 3: Remove new-build dependence on native CSS IDs

**Files:**
- Modify: `packages/vue-lynx/plugin/src/entry.ts`
- Modify: `packages/vue-lynx/plugin/src/css.ts`
- Delete: `packages/vue-lynx/plugin/src/plugins/vue-scoped-cssid-plugin.ts`
- Modify: package/build references if reported by TypeScript or lint

- [ ] **Step 1: Remove `VueScopedCSSIdPlugin` registration**

Delete its import and bundler-chain registration from `entry.ts`. Keep the
legacy `SET_SCOPE_ID` Main Thread interpreter unchanged.

- [ ] **Step 2: Rename the CSS plugin symbol and file to class semantics**

Use `vueScopeClassCSSPlugin` from
`plugins/vue-scope-class-css-plugin.ts` in both CSS extraction paths. Remove
the obsolete scoped-CSS-ID query plugin.

- [ ] **Step 3: Run build-time verification**

```bash
pnpm build
rm -rf examples/vapor/node_modules/.cache
pnpm --dir examples/vapor build
strings examples/vapor/dist/main.lynx.bundle | rg 'data-v-|@cssId'
```

Expected: builds pass; templates contain `data-v-*` class tokens, CSS has no
Vue SFC `@cssId` isolation, and no runtime template path emits scope IDs.

- [ ] **Step 4: Commit**

```bash
git add packages/vue-lynx/plugin
git commit -m "fix(plugin): emit composable scoped CSS classes"
```

### Task 4: Full verification and native acceptance

**Files:**
- Modify only if a verified failure requires an in-scope correction.

- [ ] **Step 1: Run repository verification**

```bash
pnpm lint
pnpm test
pnpm test:upstream
pnpm build
pnpm --dir examples/vapor build
```

Expected: all commands exit 0 with no test failures.

- [ ] **Step 2: Restart native environment cleanly**

Clear `examples/vapor/node_modules/.cache`, restart the Rspeedy dev server,
terminate/relaunch `com.lynx.LynxExplorer`, and open the emitted
`main.lynx.bundle` URL with lynx-devtool.

- [ ] **Step 3: Verify native rendering and behavior**

Use `DOM.getDocument`, `CSS.getMatchedStylesForNode`,
`CSS.getComputedStyleForNode`, `DOM.getBoxModel`, background
`Runtime.evaluate`, screenshots, and console collection to prove:

- Counter root matches `.counter.data-v-*` and computes `display:flex`.
- Minus, count, and plus share one horizontal row.
- Increment/decrement update count and history.
- Input events update the note and conditional text.
- Background and Main Thread logs contain no application errors.

- [ ] **Step 4: Inspect final diff and commit any verification-driven fix**

```bash
git diff 018bff7...HEAD --check
git status --short
```

Expected: no whitespace errors and no untracked verification artifacts.
