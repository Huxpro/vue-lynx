---
"vue-lynx": patch
---

The plugin sets the ES2019 syntax floor through `env.targets` instead of `jsc.target`, so a build that already sets `env` is not refused by SWC.
