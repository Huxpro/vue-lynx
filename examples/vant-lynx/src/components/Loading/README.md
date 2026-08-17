# Loading 加载

基于 Vant Loading 组件的 Lynx 移植版本。

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| Circular 动画 | SVG `<circle>` + stroke-dasharray 动画 | CSS border ring（静态） | Lynx 不支持 SVG |
| Spinner 动画 | 12 个 `<i>` 元素 + steps(12) 旋转 | Dotted border ring（静态） | Lynx 无 `::before` 伪元素 |
| CSS @keyframes | 旋转动画 (`van-rotate`, `van-circular`) | 无动画，静态指示器 | Lynx CSS 动画支持有限 |
| HTML 元素 | `<span>`, `<div>`, `<i>` | `<view>`, `<text>` | Lynx 原生元素 |
