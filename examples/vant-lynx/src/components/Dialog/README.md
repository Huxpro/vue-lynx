# Dialog 弹出框

## 与 Vant 的差异

| 特性 | Vant Web | Lynx 实现 | 原因 |
|------|----------|-----------|------|
| teleport | 支持 | 接受但无效 | Lynx 无 Teleport 支持 |
| lockScroll | 支持 | 接受但无效 | Lynx 无 document.body 滚动 |
| closeOnPopstate | 支持 | 接受但无效 | Lynx 无浏览器 history API |
| keydown/keyboardEnabled | 支持 | 接受但无效 | Lynx 无键盘事件 |
| allowHtml | 支持 innerHTML | 渲染为纯文本 | Lynx 无 innerHTML |
| theme='round-button' | ActionBar 按钮 | 简化圆角按钮 | 无 ActionBar/ActionBarButton |
| 按钮 | Button 组件 | view + text | 简化实现，避免循环依赖 |
| 过渡动画 | van-dialog-bounce | CSS opacity transition | Popup 统一管理动画 |
| 滚动消息 | overflow-y: auto | 不支持长消息滚动 | Lynx 需 scroll-view |
