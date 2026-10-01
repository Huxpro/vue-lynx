---
"vue-lynx": patch
---

Fix `runOnMainThread` / `runOnBackground` types rejecting functions with typed parameters under `strictFunctionTypes`. Arguments and return type are now inferred from the function directly, so the returned wrapper is `(...args: A) => Promise<R>` instead of `Promise<unknown>`. Types only, no runtime change.
