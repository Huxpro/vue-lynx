# 支持 `with { runtime: 'shared' }` Import Attributes

## 背景

SWC worklet 转换(`@lynx-js/react/transform`)已经支持 `with { runtime: 'shared' }` import attributes -- 它会在 LEPUS 输出中保留该 import,并跳过将 shared 标识符作为闭包变量捕获。然而,Vue Lynx 的 MT loader 剥离过于激进,同时丢弃了 shared import 语句和 shared 模块的代码。

**根因**: `worklet-loader-mt.ts` 仅从 LEPUS 输出中提取 `registerWorkletInternal(...)` 调用,并将所有 import 转换为裸副作用 import。这导致丢失了:
1. shared import 中的命名说明符(导入文件侧)
2. shared 模块文件的模块代码(因为它们没有 `'main thread'` 指令)

**ReactLynx 对比**: ReactLynx 的 MT loader 直接返回完整的 LEPUS 输出 -- 不做激进剥离。Vue Lynx 做剥离是为了避免将 Vue 组件代码拉入 MT bundle,这是必要的但范围过广。

## 已经可用的部分(无需修改)

| 层 | 状态 |
|-------|--------|
| **SWC 转换** -- `is_shared_runtime_import()` 检测 `with { runtime: 'shared' }`,将标识符添加到 `shared_identifiers` HashSet,在变量提取时跳过它们 | 已可用 -- 使用相同的 `@lynx-js/react/transform` SWC 插件 |
| **LEPUS 输出** -- 保留 `import { fn } from './utils' with { runtime: 'shared' }` 以及 `registerWorkletInternal(...)` 函数体直接引用 shared 标识符 | 已可用 |
| **JS 输出** -- shared 标识符不会被捕获到 `_c` 闭包对象中,import 被保留 | 已可用 |

## 实现

### 步骤 1: `plugin/src/loaders/worklet-utils.ts` -- 提取 shared imports

添加 `extractSharedImports(source: string): string`,功能如下:
- 查找包含 `with { runtime: 'shared' }` 或 `with { runtime: "shared" }` 的 import 语句
- 完整保留它们(包含命名说明符和 attributes)
- 返回拼接后的 shared import 语句

更新 `extractLocalImports()`,使其**跳过**带有 `with { runtime: ... }` 的 import -- 这些由 `extractSharedImports()` 处理,不应被转换为裸副作用 import。

### 步骤 2: `plugin/src/loaders/worklet-loader-mt.ts` -- 在输出中包含 shared imports

在两个代码路径(vue 子模块和常规 JS/TS)中:
- LEPUS 转换后,对 **LEPUS 输出**调用 `extractSharedImports()`
- 最终输出 = shared imports + local imports + registrations (+ vue 子模块的虚拟导出)

### 步骤 3: `plugin/src/entry.ts` -- 在 MT 层透传 shared 模块

在 `vue:worklet-mt` **之前**添加一条模块规则,匹配在 MT 层以 `{ runtime: 'shared' }` 导入的文件,跳过 worklet-loader-mt。这使得 shared 模块的代码(纯函数)在 MT 侧可用。

方案: 使用 rspack 的 `module.rule` 配合 `with` 条件:
```ts
chain.module
  .rule('vue:shared-runtime-mt')
  .issuerLayer(LAYERS.MAIN_THREAD)
  .test(/\.[cm]?[jt]sx?$/)
  .merge({ with: { runtime: 'shared' } })
  // 无 loader → 文件作为普通 JS 透传
```

如果 rspack 不支持 `rule.with`,备选方案: 在 loader 中检查 `this._module?.resourceResolveData`,或使用自定义条件。

### 步骤 4: 重新构建插件,添加示例和文档

- 重新构建 vue-lynx 插件
- 添加 `examples/main-thread/src/shared-module/`,包含 `color-utils.ts`(纯函数,无 `'main thread'` 指令)和使用 `import ... with { runtime: 'shared' }` 的 `App.vue`
- 在 `website/docs/guide/main-thread-script.mdx` 中添加"跨线程共享模块"章节

## 验证

1. `pnpm build` -- 重新构建 vue-lynx (plugin + runtime)
2. `pnpm --filter vue-lynx-example-main-thread build` -- 所有示例必须构建成功
3. 在 web 预览或 LynxExplorer 中测试: 点击 shared-module 区域,验证颜色循环正常工作
4. 验证现有示例仍然正常工作
