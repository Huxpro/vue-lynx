# Overlay 遮罩层

基于 Vant Overlay 组件的 Lynx 移植版本。

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| `<Transition>` 动画 | Vue `<Transition name="van-fade">` | inline CSS opacity transition | Lynx 不支持 Vue `<Transition>` 组件 |
| `teleport` prop | 将 Overlay 传送到指定 DOM 节点 | 接受但不生效 | Lynx 无 DOM 概念 |
| `lockScroll` prop | 阻止背景页面滚动 | 接受但不生效 | Lynx 无 `touchmove.preventDefault()` |
| `className` prop | 添加 CSS class 到遮罩层 | 接受但不生效 | Lynx 无 CSS class 系统 |
| `v-show` | 使用 `display: none` 隐藏 | 使用 `opacity: 0` + `pointerEvents: none` | Lynx 无 `v-show`，用 opacity 模拟 |
