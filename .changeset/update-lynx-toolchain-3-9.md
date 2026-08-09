---
"vue-lynx": patch
---

Update the Lynx toolchain to the 3.9 release line.

Bumps the upstream `@lynx-js/*` dependencies to their latest versions: `@lynx-js/react` `0.121.1`, `@lynx-js/template-webpack-plugin` `0.11.2`, `@lynx-js/css-extract-webpack-plugin` `0.7.1`, and `@lynx-js/types` `3.9.0` (the engine-3.9 API surface). The worklet transform, main-thread bootstrap, and CSS pipeline now build against this toolchain.

Notable internal adjustments: `__SetID` accepts `string | null` (Lynx types 3.9), and the testing setup tracks the `@lynx-js/testing-environment` `0.2` API (`new LynxTestingEnv({ window })`, `env.env.window`).

Also fixes removing a row from a native `<list>`. A list does not own its rows up front — `componentAtIndex` attaches them to the element tree only when native asks for that cell — so a row native never requested was never in the tree, and removing it called `__RemoveElement` with an element the list is not the parent of. `list-apply` now records which rows native pulled in and only detaches those. Previously the stray call was silently absorbed; on the 3.9 element API it surfaces as `child N is not in parent M, cannot remove it!`.

The website pins `@lynx-js/lynx-core` to the exact version `web-core` resolves it as a peer (`0.1.4`); it's only added so `web-core`'s `/web` subpath resolves after the lockfile re-resolution, and a range would risk a second, mismatched copy.
