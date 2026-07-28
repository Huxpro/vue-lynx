---
"vue-lynx": minor
"@vue-lynx-example/main-thread": patch
"@vue-lynx-example/swiper": patch
"@vue-lynx-example/gallery": patch
---

Experimental `<script main>` SFC block (#314): group a component's main-thread code in a dedicated script block instead of marking every function with a `'main thread'` directive. A pre-vue-loader rewrite lowers the block into the existing SWC worklet pipeline — every top-level function gets the directive injected and the block merges into `<script setup>`, so value capture, `MainThreadRef`, cross-thread calls, and shared modules all behave exactly as before.

The syntax style ships with a dedicated guide page (EN/ZH), a new `script-main-block` entry in the main-thread example, and three existing MTS examples migrated to the block style as living proof: `main-thread/shared-module` (shared-module import used on the main thread), `swiper/SwiperMTS` (three touch handlers sharing `MainThreadRef` state), and `gallery/GalleryComplete` (worklet-calling-worklet scrollbar). Each migration compiles to worklet code identical to its directive-style original, verified by diffing the emitted main-thread registrations and by driving the built bundles in a Lynx-for-Web browser harness.
