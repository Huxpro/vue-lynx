---
"vue-lynx": patch
---

Fix `<style scoped>` rules not applying to a component's own root element. Vue applies several scope ids to a component root (its own, then those of the ancestor components whose subtree root it is); on the web these coexist as separate `data-v-*` attributes, but Lynx associates an element with exactly one CSS fragment, so the last `__SetCSSId` won and moved the root into the *parent's* fragment. `nodeOps.setScopeId` now keeps the first scope an element is given — the one of the component that authored it — so static `class`/`style` on a component root works natively without the extra wrapper element workaround.
