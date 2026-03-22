# Overlay 遮罩层

Vant Overlay component ported to Lynx with full feature parity.

## Lynx Limitations

| Feature | Vant (Web) | Lynx | Reason |
|---|---|---|---|
| `teleport` | `<Teleport :to="...">` | accepted for API compat, not applied | Lynx has no Teleport support |
| `lockScroll` | prevents `touchmove` scroll | accepted for API compat, not applied | Lynx has no document.body scroll |
| `<Transition>` | `<Transition name="van-fade">` | CSS opacity transition | Vue `<Transition>` experimental in Lynx |
| `v-show` | `display: none` toggle | `opacity: 0` + `pointerEvents: none` | Lynx does not support `v-show` |
