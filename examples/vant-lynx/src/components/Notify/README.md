# Notify 消息通知

## 与 Vant 的差异

| 功能 | Vant Web | Lynx | 原因 |
|------|---------|------|------|
| lockScroll | 支持 | 接受但无效 | Lynx 无 document.body 滚动锁定 |
| teleport | 支持 | 接受但无效 | Lynx 无 Teleport 支持 |
| white-space: pre-wrap | 支持 | 不支持 | Lynx `<text>` 自动换行 |
| word-wrap: break-word | 支持 | 不支持 | Lynx `<text>` 自动换行 |
| onClick callback | 通过 Popup 冒泡 | 不支持 | Notify 不包裹 Popup（fragment root 限制） |
| Popup 包装 | 使用 Popup 组件 | 独立实现 | Vue SFC Popup 为 fragment 组件，无法传递 class/style |
