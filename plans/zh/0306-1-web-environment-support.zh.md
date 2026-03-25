# 计划 07：Web 环境支持

## 目标

在 Vue Lynx 项目中启用 `environments: { web: {}, lynx: {} }`，使
`rspeedy dev` 同时生成 `*.lynx.bundle`（原生）和 `*.web.bundle`（浏览器
预览），与 React Lynx 插件的 web 环境支持保持一致。

## 背景

React 插件（`@lynx-js/plugin-react`）已经支持 `web` 环境，
通过在 `isLynx` 之外检测 `isWeb` 并应用 `WebEncodePlugin`（来自
`@lynx-js/template-webpack-plugin`）替代 `LynxEncodePlugin`。rspeedy
核心处理所有 web 相关的管道（target 设置、HMR、`/__web_preview`
处的 web 预览中间件）。

Vue 插件（`vue-lynx/plugin`）目前对任何非 lynx 环境都提前返回或跳过
处理，这意味着 `environments: { web: {} }` 会生成空的/损坏的输出。

## 参考：React 插件入口处理

文件：`packages/rspeedy/plugin-react/src/entry.ts`

```
isLynx  → RuntimeWrapperWebpackPlugin + LynxEncodePlugin
isWeb   → WebEncodePlugin
两者    → LynxTemplatePlugin（将 main-thread + background 打包为 *.bundle）
都不是  → 跳过
```

`intermediate` 目录对 lynx 是 `.rspeedy`，对 web 是空字符串（web
入口不会被 template 插件删除）。

## 变更

所有变更集中在**一个文件**：`packages/vue/rspeedy-plugin/src/entry.ts`，
外加 e2e 应用的配置更新。

### 步骤 1：导入 `WebEncodePlugin`

```ts
import {
  LynxEncodePlugin,
  LynxTemplatePlugin,
  WebEncodePlugin, // ← 新增
} from '@lynx-js/template-webpack-plugin';
```

添加插件名称常量：

```ts
const PLUGIN_WEB_ENCODE = 'lynx:vue-web-encode';
```

### 步骤 2：为 CSS 和 worklet-loader 回调添加 `isWeb` 检测

前两个 `modifyBundlerChain` 回调（CSS ignore-loader 和 worklet-loader）
目前有 `if (!isLynx) return;` 守卫。两者都需要在 web 环境下运行，因为：

- CSS ignore-loader：web 环境中也存在 main-thread 层；如果没有它，
  VueLoaderPlugin 克隆的 CSS 规则会在 MT 层报错。
- Worklet loader：MTS `'main thread'` 指令函数在 web bundle 中仍然需要
  SWC 转换。

将：

```ts
if (!isLynx) return;
```

改为：

```ts
const isWeb = environment.name === 'web'
  || environment.name.startsWith('web-');
if (!isLynx && !isWeb) return;
```

（`isLynx` 变量在每个回调中已经定义。）

### 步骤 3：在主入口分割回调中添加 `isWeb` 检测

在第三个 `modifyBundlerChain` 回调（约第 266 行）中，在已有的
`isLynx` 之后添加 `isWeb`：

```ts
const isWeb = environment.name === 'web'
  || environment.name.startsWith('web-');
```

### 步骤 4：对 lynx 和 web 都应用 `LynxTemplatePlugin`

将守卫从：

```ts
if (isLynx) {
```

改为：

```ts
if (isLynx || isWeb) {
```

并更新 `intermediate` 路径，使用已经正确的 `intermediate`
变量（非 lynx 时为 `''`），替代硬编码的 `DEFAULT_INTERMEDIATE`：

```ts
intermediate: path.posix.join(intermediate, entryName),
```

（第 296 行的 `intermediate` 变量已经是
`isLynx ? DEFAULT_INTERMEDIATE : ''`，这会为 web 生成正确的空字符串。）

### 步骤 5：对两者都应用 `VueMainThreadPlugin` + `VueWorkletRuntimePlugin`

将：

```ts
if (isLynx && mainThreadFilenames.length > 0) {
```

改为：

```ts
if ((isLynx || isWeb) && mainThreadFilenames.length > 0) {
```

两个插件在 web 环境中都需要，因为：

- `VueMainThreadPlugin`：扁平的 main-thread bundle 必须替换
  webpack 生成的 stub 并标记 `lynx:main-thread: true`，以便
  `LynxTemplatePlugin` 将其路由到 `lepusCode.root`。
- `VueWorkletRuntimePlugin`：worklet-runtime chunk 必须存在，以便
  MTS 事件分发在 web 预览中正常工作。

### 步骤 6：为 web 应用 `WebEncodePlugin`（新增代码块）

在注册 `RuntimeWrapperWebpackPlugin` + `LynxEncodePlugin` 的已有
`if (isLynx)` 代码块之后，添加：

```ts
if (isWeb) {
  chain
    .plugin(PLUGIN_WEB_ENCODE)
    .use(WebEncodePlugin, [])
    .end();
}
```

`RuntimeWrapperWebpackPlugin` 和 `LynxEncodePlugin` 仍然只受
`if (isLynx)` 守卫保护 -- web bundle 不需要 AMD 包装器或 Lynx
二进制编码。

### 步骤 7：更新 e2e 配置

在 `packages/vue/e2e-lynx/lynx.config.ts` 中，添加：

```ts
environments: {
  web: {},
  lynx: {},
},
```

## 守卫变更总结

| 代码块                        | 当前守卫                | 新守卫                                    |
| ----------------------------- | ----------------------- | ----------------------------------------- |
| CSS ignore-loader             | `if (!isLynx) return`   | `if (!isLynx && !isWeb) return`           |
| Worklet loader                | `if (!isLynx) return`   | `if (!isLynx && !isWeb) return`           |
| `mainThreadFilenames.push`    | `if (isLynx)`           | `if (isLynx \|\| isWeb)`                 |
| `LynxTemplatePlugin`          | `if (isLynx)`           | `if (isLynx \|\| isWeb)`                 |
| `VueMainThreadPlugin`         | `if (isLynx && ...)`    | `if ((isLynx \|\| isWeb) && ...)`        |
| `VueWorkletRuntimePlugin`     | （同上代码块）          | （同上代码块）                            |
| `RuntimeWrapperWebpackPlugin` | `if (isLynx)`           | `if (isLynx)` -- **不变**                 |
| `LynxEncodePlugin`            | `if (isLynx)`           | `if (isLynx)` -- **不变**                 |
| `WebEncodePlugin`             | （无）                  | `if (isWeb)` -- **新增**                  |

## 风险

- **Web 中的 worklet-runtime**：web 预览运行时可能不支持
  `__LoadLepusChunk`。如果是这样，MTS 示例在 web 预览中会失败，但非 MTS
  示例可以正常工作。这与 React 的行为一致（MTS 是仅限原生的功能）。
- **无 web 专用 Vue 运行时**：与 React 拥有 `@lynx-js/web-*`
  包不同，Vue 目前没有 web 专用渲染器。web 预览使用与 lynx 相同的
  LynxTemplatePlugin 打包方式，web 运行时（来自
  `@lynx-js/web-core`）解释该 bundle。Vue 侧无需任何变更。

## 验证

1. 在 `packages/vue/e2e-lynx` 中执行 `pnpm dev` 应同时打印每个入口的
   `.lynx.bundle` 和 `.web.bundle` URL
2. 在浏览器中打开 `/__web_preview` 应显示 web 预览
3. 非 MTS 入口（counter、todomvc、gallery-list）应在 web 预览中正常渲染
4. 已有的 lynx bundle 应继续正常工作，不受影响
