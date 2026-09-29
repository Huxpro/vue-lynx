---
"vue-lynx": patch
---

Only diff `<list>` elements whose items or platform info changed since the last flush. Previously every Main Thread patch re-ran the LIS diff over every registered list, including untouched long feeds; `updateAction` index lookups are now O(1) as well.
