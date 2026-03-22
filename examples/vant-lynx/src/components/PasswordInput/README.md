# PasswordInput 密码输入框

基于 Vant PasswordInput 组件的 Lynx 移植版本。

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| HTML 元素 | `<ul>`, `<li>`, `<i>`, `<div>` | `<view>`, `<text>` | Lynx 原生元素 |
| `::after` 圆角边框 | 使用 `::after` 伪元素实现圆角边框 | 直接在容器上应用 `border` + `border-radius` | Lynx 不支持 `::after` |
| `user-select: none` | 禁止文本选择 | 无操作 | Lynx 无文本选择功能 |
| 触摸事件 | `onTouchstartPassive` | `@tap` | Lynx 事件系统 |
