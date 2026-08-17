# AddressList 地址列表

Vant `AddressList` component ported to Lynx with matching props, events, slots, and styling structure.

## 与 Vant 的差异

| Feature | Vant (Web) | Lynx | Reason |
|---|---|---|---|
| Bottom safe area inset | browser `env(safe-area-inset-bottom)` | uses `env(safe-area-inset-bottom)` when host supports it | safe area env support depends on the Lynx host |
| `click-item` event payload | DOM `MouseEvent` | Lynx tap event object in `{ event }` | Lynx does not expose browser DOM events |
