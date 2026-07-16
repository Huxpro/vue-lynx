---
"vue-lynx": patch
---

Fix explicit `<page>` roots by reusing Lynx's existing native page instead of creating a second page element. Root attributes, styles, events, scope IDs, and refs are forwarded to the native root. Development builds now preserve the Main Thread bootstrap, and flushes have a bounded fallback for engines that do not invoke the `vuePatchUpdate` callback.
