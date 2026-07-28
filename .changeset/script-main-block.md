---
"vue-lynx": minor
"@vue-lynx-example/main-thread": patch
---

Experimental `<script main>` SFC block (#314): group a component's main-thread code in a dedicated script block instead of marking every function with a `'main thread'` directive. A pre-vue-loader rewrite lowers the block into the existing SWC worklet pipeline — every top-level function gets the directive injected and the block merges into `<script setup>`, so value capture, `MainThreadRef`, cross-thread calls, and shared modules all behave exactly as before. The main-thread example gains a `script-main-block` entry demonstrating the syntax.
