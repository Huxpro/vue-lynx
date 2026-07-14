---
"vue-lynx": patch
---

fix(runtime): suppress empty native layout anchors

Vue's renderer emits comment nodes (`v-if`/`v-for` fragment anchors) and empty text nodes as real host nodes. Previously these were materialized on the Lynx Main Thread as native elements. An empty native `<text>` still gets a default line box from Lynx's layout engine, so these anchors introduced phantom vertical spacing between rendered content.

Comment anchors are now kept entirely off the Main Thread, and empty text nodes are materialized lazily — a native `<text>` element is created only while the node actually holds visible text, and is removed again when its content becomes empty. This eliminates the spurious gaps without changing the Background Thread VNode tree that Vue reconciles against.
