---
"vue-lynx": minor
---

Scoped CSS now composes like it does on the web. `<style scoped>` selectors are compiled to class selectors (`[data-v-xxx]` → `.data-v-xxx`), and every scope id Vue assigns becomes a class on the element. Previously each element got a single native CSS id.

- A component root carries its own scope and those of the ancestors whose subtree root it is. A component's own scoped rules and a parent's rules targeting the child's root both apply, without extra wrapper elements.
- `:deep()`, `:slotted()` and `:global()` compile to selectors that match structurally, the same as on the web.

Scoped selectors now carry the scope's extra class-level specificity, as they do on the web; the previous release stripped the scope attribute. If a scoped rule now wins over an unscoped rule it used to lose to, raise the unscoped rule's specificity.
