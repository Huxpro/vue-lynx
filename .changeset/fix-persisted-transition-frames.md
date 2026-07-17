---
"vue-lynx": patch
---

Fix persisted CSS transitions used with `v-show` by running the Vue transition lifecycle before changing display state. Preserve the initial transition classes for a rendered frame on both Web and native Lynx so enter and leave animations work on every toggle.
