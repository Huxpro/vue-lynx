---
"vue-lynx": patch
---

Fix `'main thread'` worklet registrations being silently dropped when a worklet body contains a comment with an apostrophe, quote, or unpaired paren (e.g. `// the finger's position`). The LEPUS transform preserves user comments, and worklet-loader-mt's balanced-paren scan treated quote characters inside them as string delimiters — derailing the scan and discarding every registration after the offending one, which surfaced at runtime as `TypeError: cannot read property 'bind' of undefined` on the Main Thread. The scanner now skips line and block comments. Also adds the `touch-fx` example — a Main Thread touch playground (spring-chasing orb, continuous water ripples, firework sparks) with a headless-browser verification harness.
