# Suspense Example

Tests Vue's `<Suspense>` API with vue-lynx.

## Features Exercised

- `<Suspense>` with `#default` / `#fallback` slots
- `defineAsyncComponent` with dynamic import (triggers Suspense fallback)
- Code-splitting via lazy-loaded components

> **Note:** `async setup()` (top-level `await` in `<script setup>`) is **not** supported because vue-lynx does not export `withAsyncContext`. This example focuses on `defineAsyncComponent` which does trigger the Suspense fallback.
