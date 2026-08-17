# Icon 图标

基于 Vant Icon 组件的 Lynx 移植版本。

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| `::before` 渲染图标 | CSS `::before { content }` | `<text>` 元素 + `font-family` | Lynx 不支持 `::before` 伪元素 |
| `tag` prop | 改变根 HTML 标签 | 接受但不生效 | Lynx 无 HTML 标签概念 |
| ConfigProvider `iconPrefix` | 通过 inject 全局覆盖前缀 | 未实现 | 待 ConfigProvider 完善后支持 |
| 字体加载 | `@font-face` + base64 内联 | `@font-face` + CDN URL | 依赖网络加载字体文件 |
