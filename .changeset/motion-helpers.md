---
"vue-lynx": minor
---

Add `vue-lynx/motion`, a shared module of numeric animation helpers for main thread functions: `animateValue` (a damped spring or an eased tween, first frame written synchronously), and `animateStyle`, `springStyle` and `animateTranslate`, which write one style property or one `transform` per frame on a main thread element. It carries no dependency: `@lynx-js/motion` is written for ReactLynx and its entries import the React runtime at module load, which a Vue Lynx bundle must not carry. The options vocabulary (`type: 'spring'`, `stiffness`, `damping`, `mass`, `duration`, `ease`, `from`, `velocity`) matches it, so a later swap is a one-line change.
