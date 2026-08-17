# Benchmark Timing Pipeline — Device Verification Checklist

> Companion to `plans/0803-1-lynx-benchmark-timing-pipeline.md`
> Commit: see `git log --oneline vapor -4`

## Prerequisites

- Android device with Lynx SDK ≥ the version declaring `__GeneratePipelineOptions`
- LynxExplorer installed
- Build a `.lynx.bundle` from one of the benchmark cases
- `adb` available

## 1. Build a flagged update bundle

Use any benchmark case that sets `__lynx_timing_flag` on a view during an update.
The minimal test is a Vapor SFC:

```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
const flag = ref('vue-timing-test')
function update() { count.value++ }
</script>
<template>
  <view :__lynx_timing_flag="flag" @tap="update">
    <text>{{ count }}</text>
  </view>
</template>
```

Build with `rspeedy build` (Vapor mode enabled, IFR off first).

## 2. Load on device

```bash
adb push dist/main.lynx.bundle /sdcard/lynx_bundles/
# Open in LynxExplorer via local file or adb-forwarded HTTP
```

## 3. Trigger the flagged update

Tap the view. Each tap triggers one reactive update with `__lynx_timing_flag="vue-timing-test"`.

## 4. Read raw timing results

```bash
# Pull timing data from the Lynx performance listener
# (exact path depends on benchmark runner or LynxExplorer's DevTools)
adb shell dumpsys lynx timing
# or use the benchmark_script/utils.js readback
```

## 5. Expected fields in raw result

### Per-update sample (lynxUpdateTimings[])

| Field | Source | Expected |
|-------|--------|----------|
| `pipelineID` | `__GeneratePipelineOptions().pipelineID` | Non-empty string |
| `timingFlag` | `__BindPipelineIDWithTimingFlag` | `"vue-timing-test"` |
| `vueRenderStart` | BG `_markTiming` | Timestamp (ms) |
| `vueRenderEnd` | BG `_markTiming` | > vueRenderStart |
| `packChangesStart` | BG `_markTiming` | ≥ vueRenderEnd |
| `packChangesEnd` | BG `_markTiming` | ≥ packChangesStart |
| `parseChangesStart` | MT `__MarkTiming` | ≥ packChangesEnd |
| `parseChangesEnd` | MT `__MarkTiming` | ≥ parseChangesStart |
| `applyChangesStart` | MT `__MarkTiming` | ≥ parseChangesEnd |
| `applyChangesEnd` | MT `__MarkTiming` | ≥ applyChangesStart |
| `measureTiming` | Native pipeline | Present, non-zero |
| `layoutTiming` | Native pipeline | Present, non-zero |
| `drawTiming` | Native pipeline | Present, non-zero |
| `pipelineTiming` (Render Time) | Native `drawEnd - pipelineStart` | > 0, reasonable |

### Negative check (no flag)

An update without `__lynx_timing_flag` (or with empty string) must NOT produce a
timing sample in `lynxUpdateTimings`. `takePipelineOptions()` returns `undefined`,
so `__FlushElementTree` receives no `pipelineOptions`.

## 6. Setup pipeline (first mount)

On page load, `triggerRenderPage()` calls `beginPipeline('setup')`. If the Lynx
engine archives this as `lynxSetupTiming`, the raw result should show:
- Stage = 'setup', with framework marks
- If engine does NOT surface this in `lynxSetupTiming`, record it as an engine gap

## 7. IFR pipeline

Build with IFR enabled (`enableIFR: true` in rspeedy config). On renderPage:
- `runIfrRender()` creates a pipeline via `__GeneratePipelineOptions`
- `__FlushElementTree(page, { pipelineOptions })` delivers it
- Verify only ONE setup/IFR pipeline sample — not a duplicate from BG hydration

## 8. Cross-framework comparison

Only compare these fields across React/TTML/Vue:
- `pipelineTiming` (Render Time) — same native contract
- `measureTiming`, `layoutTiming`, `drawTiming` — same native pipeline

Vue-specific marks (vueRenderStart, etc.) are diagnostic only and NOT comparable.

## 9. PerfLab considerations

Before full re-run:
- [ ] Confirm `interval` in PerfLab manifest > max case duration (14s cases need ≥ 15s)
- [ ] Confirm `enableJSRuntime: true` in task spec
- [ ] One manual task with 2-3 cases first; validate raw JSON has expected fields
- [ ] Full batch only after manual validation passes
