# Basic Example

Validates the full SFC pipeline end-to-end:

```
.vue file → @vue/compiler-dom → template render function
→ vue-lynx nodeOps → ops buffer → callLepusMethod
→ Main Thread applyOps → PAPI → native render
```

## SFC Features Exercised

See `src/App.vue` and `src/Counter.vue`:

- `<script setup>` with `defineProps` / `defineEmits`
- `{{ interpolation }}`
- `:style` / dynamic binding
- `v-if` / `v-else`, `v-show`, `v-for`
- `@tap` event
- Child component reference

## h() Counter

`src/h-counter.ts` is a standalone entry using plain `h()` render functions (no SFC, no compiler). It validates the renderer stack in the simplest possible way:

```
h() + ref() + onMounted() + bindtap
→ nodeOps → ops buffer → callLepusMethod('vuePatchUpdate')
→ Main Thread applyOps → PAPI → native render
```

Preserved from the original MVP proof-of-concept session.
