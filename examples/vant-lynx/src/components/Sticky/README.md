# Sticky 粘性布局

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|---------|-----------|------|
| 自动滚动监听 | `useScrollParent` + `useEventListener` | 需手动调用 `handleScroll()` | Lynx 无 DOM scroll parent 检测 |
| 元素尺寸测量 | `getBoundingClientRect` / `useRect` | 不支持 | Lynx 无同步 DOM 测量 API |
| 容器边界限制 | `container` prop 限制吸附范围 | `container` prop 仅保留 API 兼容 | 无法测量容器 rect |
| 可见性变化 | `IntersectionObserver` | 不支持 | Lynx 无 IntersectionObserver |
| 窗口尺寸变化 | `windowWidth` / `windowHeight` watch | 不支持 | Lynx 无 window resize |
| 占位高度 | 自动测量 `rootRect.height` | 无自动占位 | 无 DOM 测量 |
| `position: fixed` | 浏览器原生支持 | Lynx fixed 定位 | 行为一致 |

### Lynx 特有 API

- `handleScroll(event)`: 暴露给父级 scroll 容器调用，传入 `{ detail: { scrollTop } }` 格式
- `isFixed`: 暴露当前吸附状态
