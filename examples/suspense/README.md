# Suspense Example

Tests Vue's `<Suspense>` API with vue-lynx.

## Features Exercised

- `<Suspense>` with `#default` / `#fallback` slots
- `defineAsyncComponent` with delayed / microtask resolution (triggers Suspense fallback)
- Async `setup()` via top-level `await` in `<script setup>` (requires `withAsyncContext`)

> **Note:** This example avoids dynamic `import()` code-splitting. Webpack async
> chunks rely on `lynx.requireModuleAsync` / `lynx.loadLazyBundle`, which are not
> available in Lynx Web Preview's iframe runtime. Use delayed promises (or a
> dedicated lazy-bundle setup) when you need Suspense without native chunk loading.
