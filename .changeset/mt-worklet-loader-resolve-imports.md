---
"vue-lynx": patch
---

Fix MT worklet loader dropping non-relative imports from the module graph. Aliased, tsconfig-path, and package worklets are now resolved and followed, so they no longer fail at runtime. Imports inside comments and string/template literals are ignored when following the worklet graph. Adds opt-in `includeWorkletPackages` to follow worklet imports into named `node_modules` packages.
