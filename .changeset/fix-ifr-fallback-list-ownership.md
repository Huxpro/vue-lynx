---
"vue-lynx": patch
---

Fix the IFR hydration fallback discarding background batches and leaving native `<list>` registries behind. On a structural mismatch the main-thread tree is torn down, but batches the background thread had already sent (skipped as identical, or value-patched) were never re-applied — everything they described disappeared from the page. The fallback now replays the complete background history onto the clean page. Teardown also resets `list-apply`'s state: a native list does not own its rows, so the abandoned render's list registries survived teardown and a later background `INSERT` whose parent id had been a `<list>` in the discarded stream was routed into the dead list instead of the element tree, with `update-list-info` committed onto whatever element reused that id.
