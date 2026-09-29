---
"vue-lynx": patch
---

Fix three element-template bugs (`enableElementTemplates`, on by default with `enableIFR`):

- Content inside a lowered template's `v-if` / `v-for` / component slot no longer disappears after its component is moved by `<KeepAlive>` or `<Teleport>` (deactivate → toggle → activate).
- Scoped CSS now applies to lowered interior elements that have a static `class` or a dynamic `:class`; the `data-v-*` scope class was previously overwritten.
- The main thread now releases the elements of unmounted template instances, including holes, slot content and nested templates. Before, clearing a lowered list retained most of its elements.
