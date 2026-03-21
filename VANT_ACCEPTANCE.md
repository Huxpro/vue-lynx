# Vant Component Acceptance Criteria

本文档定义了将 **所有** Vant 组件移植到 vue-lynx-vant 时的通用验收标准。

**适用范围：所有组件**（Popup, Button, Cell, Toast, Dialog, ActionSheet, Picker 等）

每个组件在提交前必须通过所有适用检查项。以下示例以 Popup 为例，但规则适用于每一个组件。

## 工作流程

1. **对比差距** — 先用本文档对比 Vant 源码与当前实现的差距
2. **列出 TODO** — 明确需要补齐的 Props / Events / 动画 / Composables / CSS 变量
3. **逐项实现** — 按优先级补齐
4. **验收检查** — 确认所有检查项通过
5. **无差距后提交** — 只有确认与 Vant 行为一致后才能提交

---

## 一、Props 验收

### 检查方法
```bash
# 获取 Vant 组件的所有 props
curl -s "https://raw.githubusercontent.com/youzan/vant/main/packages/vant/src/{component}/{Component}.tsx" | grep -E "^\s+\w+:" 
# 或查看 shared.ts / types.ts
```

### 必须支持的 Props

| 分类 | Props | 说明 |
|------|-------|------|
| **基础** | show, position, round, closeable, overlay, zIndex | 必须 100% 支持 |
| **关闭按钮** | closeIcon, closeIconPosition | 支持 Icon 组件 + 4个位置 |
| **动画** | duration, transition, transitionAppear | 必须实现动画 |
| **遮罩** | closeOnClickOverlay, overlayClass, overlayStyle, overlayProps | 可配置遮罩 |
| **渲染** | lazyRender, destroyOnClose | 性能优化 |
| **拦截** | beforeClose | 关闭拦截器 |
| **安全区** | safeAreaInsetTop, safeAreaInsetBottom | iPhone 刘海适配 |
| **其他** | lockScroll, closeOnPopstate, teleport | 按需支持 |

### Props 差距检查表

对于每个组件，填写：

```markdown
## {ComponentName} Props 差距

| Prop | Vant | 我们 | 状态 |
|------|------|------|------|
| show | ✅ | ✅ | ✅ 完成 |
| position | ✅ | ✅ | ✅ 完成 |
| closeIcon | ✅ | ❌ | ⏳ 待实现 |
| ... | ... | ... | ... |

**支持率: X/Y (Z%)**
```

---

## 二、Events 验收

### 必须支持的 Events

| Event | 触发时机 | 注意事项 |
|-------|----------|----------|
| `update:show` | v-model 更新 | 必须支持 |
| `open` | 打开时 | show 变为 true 时 |
| `close` | 关闭时 | show 变为 false 时 |
| `opened` | 打开动画结束后 | ⚠️ 必须在动画结束后触发 |
| `closed` | 关闭动画结束后 | ⚠️ 必须在动画结束后触发 |
| `click-overlay` | 点击遮罩 | 必须支持 |
| `click-close-icon` | 点击关闭按钮 | 如有关闭按钮必须支持 |

### Events 时序要求

```
show=true  → emit('open') → 动画开始 → 动画结束 → emit('opened')
show=false → emit('close') → 动画开始 → 动画结束 → emit('closed')
```

**错误示例:**
```typescript
// ❌ 错误：立即触发 opened/closed
watch(() => props.show, (val) => {
  if (val) {
    emit('open');
    emit('opened');  // 应该在动画结束后
  }
});
```

**正确示例:**
```typescript
// ✅ 正确：使用 Transition 的 after-enter/after-leave
<Transition @after-enter="emit('opened')" @after-leave="emit('closed')">
```

---

## 三、动画验收

### 必须实现的动画

| 动画类型 | 适用场景 | CSS 类名 |
|----------|----------|----------|
| fade | center position | `van-fade-enter-active` / `van-fade-leave-active` |
| slide-top | position="top" | `van-popup-slide-top-*` |
| slide-bottom | position="bottom" | `van-popup-slide-bottom-*` |
| slide-left | position="left" | `van-popup-slide-left-*` |
| slide-right | position="right" | `van-popup-slide-right-*` |

### 动画实现要求

1. **使用 Vue Transition 组件**
```vue
<Transition
  :name="transitionName"
  @after-enter="onOpened"
  @after-leave="onClosed"
>
  <div v-show="show">...</div>
</Transition>
```

2. **定义完整的 CSS 动画**
```less
// enter
.van-popup-slide-bottom-enter-from {
  transform: translate3d(0, 100%, 0);
}
.van-popup-slide-bottom-enter-active {
  transition: transform var(--van-duration-base) var(--van-ease-out);
}

// leave
.van-popup-slide-bottom-leave-active {
  transition: transform var(--van-duration-base) var(--van-ease-in);
}
.van-popup-slide-bottom-leave-to {
  transform: translate3d(0, 100%, 0);
}
```

3. **支持 duration prop 控制时长**

### 动画检查项

- [ ] 有 Vue Transition 组件包裹
- [ ] 4 个方向各有 slide 动画
- [ ] center 有 fade 动画
- [ ] opened/closed 在动画结束后触发
- [ ] duration prop 生效
- [ ] transitionAppear 支持首次渲染动画

---

## 四、Composables 验收

### Vant 常用 Composables

| Composable | 功能 | 优先级 |
|------------|------|--------|
| `useLockScroll` | 锁定背景滚动 | P1 |
| `useLazyRender` | 懒渲染 | P2 |
| `useGlobalZIndex` | 全局 z-index 递增 | P2 |
| `useExpose` | 暴露组件方法/ref | P2 |
| `useEventListener` | 事件监听 (popstate) | P3 |

### 实现检查

- [ ] lockScroll 阻止背景滚动
- [ ] lazyRender 首次 show 前不渲染 DOM
- [ ] 多个 Popup 的 z-index 自动递增
- [ ] popstate (浏览器返回) 关闭支持

---

## 五、CSS 变量验收

### 必须定义的 CSS 变量

每个组件应定义自己的 CSS 变量，允许主题定制：

```less
:root {
  // Popup 示例
  --van-popup-background: var(--van-background-2);
  --van-popup-transition: transform var(--van-duration-base);
  --van-popup-round-radius: 16px;
  --van-popup-close-icon-size: 22px;
  --van-popup-close-icon-color: var(--van-gray-5);
  --van-popup-close-icon-margin: 16px;
  --van-popup-close-icon-z-index: 1;
}
```

### CSS 变量检查项

- [ ] 组件有独立的 `.less` / `.css` 文件
- [ ] 使用 CSS 变量而非硬编码值
- [ ] 变量命名遵循 `--van-{component}-{property}` 格式
- [ ] 支持主题覆盖

---

## 六、关闭按钮验收 (closeable)

### 要求

1. **使用 Icon 组件**（不是硬编码 `×`）
```vue
<Icon :name="closeIcon" :class="closeIconClass" @click="onClickCloseIcon" />
```

2. **支持 4 个位置**
```typescript
type CloseIconPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
```

3. **支持自定义图标**
```vue
<Popup closeable close-icon="close" />
```

---

## 七、安全区验收

### iPhone 刘海 / Home Indicator 适配

```less
.van-safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.van-safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] safeAreaInsetTop 支持
- [ ] safeAreaInsetBottom 支持

---

## 八、验收检查清单模板

每个组件提交前，填写此清单：

```markdown
## {ComponentName} 验收检查

### Props
- [ ] 所有 Vant props 已实现 (X/Y)
- [ ] 默认值与 Vant 一致

### Events  
- [ ] 所有 events 已实现
- [ ] opened/closed 在动画后触发

### 动画
- [ ] Transition 组件使用
- [ ] 所有方向动画实现
- [ ] duration 可配置

### Composables
- [ ] lockScroll
- [ ] lazyRender  
- [ ] globalZIndex

### CSS
- [ ] 独立样式文件
- [ ] CSS 变量定义
- [ ] 无硬编码颜色/尺寸

### 其他
- [ ] closeIcon 可配置
- [ ] safeArea 支持
- [ ] 无 TypeScript 错误
- [ ] 示例页面可运行

### 差异说明
- [ ] 不支持的功能已在 README「与 Vant 的差异」章节说明
- [ ] 说明包含功能名 + 具体原因
- [ ] 不支持的 props 仍有定义（API 兼容）

**验收状态:** ✅ 通过 / ❌ 未通过
```

---

## 九、提交规范

1. **Commit Message 格式**
```
feat(popup): implement slide animations and CSS variables

- Add Transition component with slide-top/bottom/left/right
- Define CSS variables for theming
- Fix opened/closed event timing
- Support closeIconPosition prop

Closes #123
```

2. **PR 描述必须包含**
- 与 Vant 的差距对比表（实现前）
- 验收检查清单（实现后）
- 截图/GIF 展示动画效果

---

## 十、Vue Lynx 限制说明

当某个 Vant 功能因 Vue Lynx / Lynx 平台限制无法支持时：

1. **在组件 README.md 最下方添加说明**

```markdown
## 与 Vant 的差异

### 不支持的功能

| 功能 | 原因 |
|------|------|
| `teleport` | Lynx 无 DOM，不支持 Vue Teleport |
| `lockScroll` | Lynx 滚动机制不同，暂无等效 API |
| `closeOnPopstate` | Lynx 无浏览器 history API |

### 行为差异

| 功能 | Vant 行为 | Vue Lynx 行为 | 原因 |
|------|-----------|---------------|------|
| 动画 | CSS transition | JS 动画 | Lynx CSS 动画支持有限 |
```

2. **Props 仍应定义以保持 API 兼容**
```typescript
// 即使不支持，也定义 prop，只是不生效
teleport: String,  // Lynx 不支持，prop 会被忽略
```

3. **运行时警告（可选）**
```typescript
if (props.teleport && __DEV__) {
  console.warn('[Popup] teleport is not supported in Lynx environment');
}
```

---

## 十一、常见问题

### Q: Lynx 不支持某些 CSS 特性怎么办？

优先级：
1. 寻找 Lynx 等效实现
2. 使用 JS 模拟
3. 记录为已知限制，在组件 README 说明原因

### Q: 某些 Props 在 Lynx 环境无意义怎么办？

- `teleport`: Lynx 没有 DOM，不支持
- `lockScroll`: 需要 Lynx 滚动 API 支持
- `closeOnPopstate`: Lynx 无浏览器 history

**必须**：在组件 README 的「与 Vant 的差异」章节说明原因。

### Q: 如何处理 Icon 组件依赖？

1. 先实现 Icon 组件
2. 或临时使用 text fallback，但必须支持 prop 传入
