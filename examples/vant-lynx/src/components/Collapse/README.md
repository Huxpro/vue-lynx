# Collapse 折叠面板

基于 Vant Collapse 组件的 Lynx 移植版本。

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| 高度过渡动画 | CSS `transition: height` 实现平滑展开/收起 | 无动画，内容直接显示/隐藏 | Lynx 不支持 CSS height 过渡 |
| `::after` 发丝线边框 | CSS 伪元素实现 0.5px 边框 | 使用 `border` 内联样式 | Lynx 无伪元素支持 |
| `tag` prop | 改变根 HTML 标签 | 接受但不生效 | Lynx 无 HTML 标签概念 |
| `titleClass`/`valueClass`/`labelClass` | 自定义 CSS 类名 | 接受但不生效 | Lynx 内联样式限制 |
| `iconPrefix` prop | 切换图标字体类名前缀 | 接受但不生效 | 无字体图标系统 |
| `role`/`aria` 属性 | 无障碍支持 | 未实现 | Lynx 无 ARIA 支持 |
