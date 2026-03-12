# Vue Router Example

Demonstrates [Vue Router](https://router.vuejs.org/) running in a Lynx environment using `createMemoryHistory()`.

## Why Memory History?

Lynx has no `window.location` or History API, so the standard `createWebHistory()` and `createWebHashHistory()` won't work. `createMemoryHistory()` keeps all routing state in-process — similar to React Router's `MemoryRouter` or TanStack Router's memory history.

## Key Patterns

- **`NavLink.vue`** — Lynx has no `<a>` tag, so `RouterLink`'s default rendering doesn't apply. This component uses `RouterLink`'s `custom` + `v-slot` API to render native `<text>` elements with `@tap` handlers while preserving `isActive` state for styling.
- **Programmatic navigation** — `router.push()`, `router.back()` work as expected.
- **Dynamic route params** — `/users/:id` with `useRoute().params`.

## Getting Started

Install dependencies from the repo root:

```bash
pnpm install
```

Then build or run the dev server:

```bash
pnpm run dev
# or
pnpm run build
```
