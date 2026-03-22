# Icon 图标

基于 Vant Icon 组件的 Lynx 移植版本。

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| Icon Font | `@font-face` 字体图标 | Unicode/Emoji 回退映射 | Lynx 不支持 `@font-face` |
| `tag` prop | 改变根 HTML 标签 | 接受但不生效 | Lynx 无 HTML 标签概念 |
| `classPrefix` prop | 切换图标字体类名前缀 | 接受但不生效 | 无字体图标系统 |
| ConfigProvider `iconPrefix` | 通过 inject 全局覆盖前缀 | 未实现 | 依赖字体图标系统 |
| 图标覆盖率 | 300+ 图标名称 | ~35 常用图标映射 | Unicode 字符有限，覆盖核心图标 |
