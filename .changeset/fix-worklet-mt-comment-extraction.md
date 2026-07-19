---
"vue-lynx": patch
---

Fix `worklet-loader-mt` silently dropping main-thread worklet registrations when worklet bodies contain comments with apostrophes, backticks, or unmatched parens. Registration extraction now slices `registerWorkletInternal(...)` calls by AST node span (`@babel/parser`, already shipped via `@vue/compiler-core`) instead of textually scanning the LEPUS output, so string/comment/regex content can never corrupt the scan.
