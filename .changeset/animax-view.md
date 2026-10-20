---
"vue-lynx": minor
---

Type the `<animax-view>` element (the AnimaX Lottie and alpha video player Lynx ships as an xelement and `@lynx-js/animax` on the web) in `vue-lynx/types`: every attribute the native element reads and every event it emits, so `@ready`, `@completion`, `@update` and the rest are checked. Add `useAnimaX(ref)`, a controller over the element's UI methods (`play`, `pause`, `resume`, `stop`, `seek`, `playSegment`, `getDuration`, `getCurrentFrame`, `isAnimating`, update-event subscriptions) that returns Promises instead of hand-written `invoke` options. New `examples/animax`.
