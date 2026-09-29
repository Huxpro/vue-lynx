---
"vue-lynx": patch
---

Add experimental template-staging plugin options: `templateNaming`, `templateStaging`, `templateDelivery` and `ifrPaint`. They select how element and Vapor templates are named, staged across threads and painted for Instant First-Frame Rendering. The defaults keep current behavior. These options exist for benchmarking and may change or be removed without a major version bump. `enableSparseNaming` is deprecated in favor of `templateNaming`.
