---
"vue-lynx": patch
---

fix(types): re-export Vue core type aliases and drop stale Volar plugin entries

- Re-export `Ref`, `ComputedRef`, `WritableComputedRef`, `ShallowRef`, `UnwrapRef`, `UnwrapNestedRefs`, `MaybeRef`, `MaybeRefOrGetter`, `Reactive`, `DeepReadonly`, `VNode`, `VNodeRef`, `VNodeChild`, `DefineComponent`, `FunctionalComponent`, `ComponentInternalInstance`, `SetupContext`, `Plugin`, `Directive`, `InjectionKey`, `PropType`, `ExtractPropTypes`, `EmitsOptions`, `SlotsType`, `WatchOptions`, `WatchHandle`, `WatchStopHandle` from `vue-lynx` so consumers that alias `vue → vue-lynx` for types pick them up.
- Drop the legacy Volar plugin handlers for Vue Language Tools ≤ 1.8.27 (EOL 2023) and ≤ 2.0.13 (Feb 2024). Only the modern `>= 2.0.14` handler remains; the legacy `version: 1` handler triggered a warning on every run, and the middle handler was strictly subsumed by the modern one.
