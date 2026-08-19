# `vue-lynx/vapor-app` → `vue-lynx/vapor`

Date: 2026-07-15. Companion to `0715-1-pr209-review-and-protocol-cleanup.md`.

## Why the good name was free to take

`vue-lynx/vapor` is what users naturally type, but the subpath was
occupied by the internal Vapor adapter surface (helpers + DOM shims +
`createVaporApp`), which forced the application entry to live at
`vue-lynx/vapor-app`. A consumer census showed the adapter subpath had
**exactly one importer — our own tests** — and the app entry re-exports
the full adapter surface anyway (`export * from './vapor/index.js'`), so
handing the name to the app entry loses nothing.

## Execution — two steps, on purpose

1. **Remap with aliases** (`d8e470f`): `./vapor` → the app entry
   (dist keeps its historical `vapor-app.js` filename — only the subpath
   is public API); `./vapor-app` and `./with-vapor` stayed as deprecated
   aliases. Plugin alias (`'vue'` → `vue-lynx/vapor`), vitest maps, docs,
   API-reference package (route `/guide/api/vapor/`) all moved.
2. **Remove the aliases** (`e0bf798`): the package has never been
   published, so a clean break beats carrying dead names. Deleted
   `with-vapor.ts` and both alias exports; migrated the remaining
   consumers — the overlay generator's import rewrite, `examples/vapor`,
   benchmark apps, the SFC-e2e rewrite target.

**Why the examples migrated only in step 2:** `vapor-support.json` pins
each entry's source hash. Changing `examples/vapor`'s import without
re-running the 45-entry verification would have tripped `verify-status`;
the alias kept everything working until the full rerun (see `0715-4`)
could refresh the hashes in the same change.

## Verification

Not just suites (917/107/41/27 green): hello-world's `dist-vapor` was
rebuilt end-to-end through the new alias chain
(`'vue'` → `vue-lynx/vapor` → package exports), the site was rebuilt,
and the browser confirmed `/guide/api/vapor/` renders and the switch
still runs examples on Vapor.

## Residue

- The entry's source file keeps the name `runtime/src/vapor-app.ts`
  (renaming it would churn the build config for zero user-visible gain);
  the adapter surface stays at `runtime/src/vapor/`.
- The upstream-tests vitest aliases map both `vue-lynx/vapor` (kept for
  spec readability) to the entry source.
