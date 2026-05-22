---
"vue-lynx": patch
---

fix(types): re-export Vue core type aliases and drop stale Volar 1.x plugin entry

- Re-export `Ref`, `ComputedRef`, `WritableComputedRef`, `ShallowRef`, `UnwrapRef`, `UnwrapNestedRefs`, `MaybeRef`, `MaybeRefOrGetter`, `Reactive`, `DeepReadonly`, `VNode`, `VNodeRef`, `VNodeChild`, `DefineComponent`, `FunctionalComponent`, `ComponentInternalInstance`, `SetupContext`, `Plugin`, `Directive`, `InjectionKey`, `PropType`, `ExtractPropTypes`, `EmitsOptions`, `SlotsType`, `WatchOptions`, `WatchHandle`, `WatchStopHandle` from `vue-lynx` so consumers that alias `vue → vue-lynx` for types pick them up.
- Drop the `version: 1` Volar plugin entry (for Vue Language Tools ≤ 1.8.27, EOL 2023). Modern Vue Language Tools warns on the v1 handler on every run.
