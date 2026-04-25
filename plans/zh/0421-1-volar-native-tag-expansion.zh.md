# Volar 插件：原生标签扩展与 IDE 诊断

## 范围

三项 DX 改进，涉及 `vue-lynx` Volar 插件与元素类型：

1. 所有 Lynx 内置元素注册为原生标签——消除"Unknown component" IDE 错误
2. 不支持的事件修饰符诊断：`.capture` / `.passive`
3. `global-bind:*`、`global-catch:*`、`main-thread:*` 及 `main-thread-ref` 识别为合法 prop

## 问题

Volar 插件此前只声明了三个原生标签：`block`、`template`、`slot`。所有真实的 Lynx 元素——`<view>`、`<text>`、`<image>`、`<scroll-view>` 等——即使 `@lynx-js/types` 已提供完整的 IntrinsicElements 类型覆盖，在安装了 Volar 的 VS Code 中仍会被标记为"Unknown component"。

根本原因：类型通过 `GlobalComponents` 声明（TypeScript 可识别），但 `isNativeTag` / `nativeTags` 对 Volar 模板编译器未知——后者对原生标签有独立的概念。

## 为何 `require('@lynx-js/types')` 无效

`@lynx-js/types` 是纯类型包——其 `exports` 映射只暴露 `"types"` 条件，不含任何运行时 JS。在 Volar 工具链时调用 `require('@lynx-js/types')` 什么也得不到。

## 解决方案

**静态列表 + 代码生成脚本。**

插件中的 `nativeTags` 数组拆分为：

```js
const metaTags = ['block', 'template', 'slot']; // Vue 模板编译所需
const lynxTags = [                               // 来自 @lynx-js/types IntrinsicElements
    'component', 'filter-image', 'image', 'inline-image',
    'inline-text', 'inline-truncation', 'list', 'list-item',
    'list-row', 'page', 'scroll-view', 'text', 'view',
    'raw-text', 'input', 'textarea', 'frame', 'overlay', 'svg',
];
const nativeTags = [...metaTags, ...lynxTags];
```

`scripts/generate-native-tags.mjs` 脚本读取 `@lynx-js/types/types/common/element/element.d.ts`，通过正则提取 `IntrinsicElements` 的键，并重写 `src/volar-plugin.cjs` 中的 `lynxTags` 数组。升级 `@lynx-js/types` 后执行：

```
pnpm generate:native-tags   # 在 packages/vue-lynx/types 目录下运行
```

## IntrinsicElements 来源

`@lynx-js/types@3.7.0` — `types/common/element/element.d.ts`：

| 标签 | Props 类型 |
|------|------------|
| `component` | `ComponentProps` |
| `filter-image` | `FilterImageProps` |
| `image` | `ImageProps` |
| `inline-image` | `ImageProps` |
| `inline-text` | `TextProps` |
| `inline-truncation` | `NoProps` |
| `list` | `ListProps` |
| `list-item` | `ListItemProps` |
| `list-row` | `StandardProps` |
| `page` | `PageProps` |
| `scroll-view` | `ScrollViewProps` |
| `text` | `TextProps` |
| `view` | `ViewProps` |
| `raw-text` | `StandardProps & { text }` |
| `input` | `InputProps` |
| `textarea` | `TextAreaProps` |
| `frame` | `FrameProps` |
| `overlay` | `OverlayProps` |
| `svg` | `SVGProps` |

## 修饰符诊断

`lynxModifierTransform` 是一个通过 `resolveTemplateCompilerOptions`（Volar >= 2.0.14）注入的 `nodeTransforms` 条目。它遍历 `ELEMENT` 节点，找到 `v-on` 指令节点，并对 `.capture` 或 `.passive` 修饰符调用 `context.onError`：

```js
const ELEMENT_NODE = 1;   // NodeTypes.ELEMENT
const DIRECTIVE_NODE = 7; // NodeTypes.DIRECTIVE

function lynxModifierTransform(node, context) {
  if (node.type !== ELEMENT_NODE) return;
  for (const prop of node.props) {
    if (prop.type !== DIRECTIVE_NODE || prop.name !== 'on') continue;
    for (const modifier of prop.modifiers) {
      // Vue <3.3 为 string[]；Vue >=3.3 为 SimpleExpressionNode[]
      const name = typeof modifier === 'string' ? modifier : modifier.content;
      if (!['capture', 'passive'].includes(name)) continue;
      const loc = (typeof modifier === 'object' && modifier.loc) ? modifier.loc : prop.loc;
      const err = new SyntaxError(`Lynx does not support the .${name} event modifier.`);
      err.code = 1001;
      err.loc = loc;
      context.onError(err);
    }
  }
}
```

NodeType 常量硬编码，避免在 IDE 时 `require('@vue/compiler-core')`。

## 特殊 Prop 类型

在 `elements/index.ts` 的 `VueLynxProps<T>` 中新增 `LynxSpecialProps`：

```ts
type LynxSpecialProps = {
  'main-thread-ref'?: string;
  [key: `global-bind:${string}`]: ((event: any) => void) | undefined;
  [key: `global-catch:${string}`]: ((event: any) => void) | undefined;
  [key: `main-thread:${string}`]: any;
}
```

模板字面量索引签名消除"unknown prop"错误，并在 TypeScript 补全中可见。

## 修改的文件

| 文件 | 变更 |
|------|------|
| `packages/vue-lynx/types/src/volar-plugin.cjs` | 扩展 `nativeTags`；新增 `lynxModifierTransform` 及 `nodeTransforms` 注入 |
| `packages/vue-lynx/types/dist/volar-plugin.cjs` | 同上（dist 副本；由 `pnpm build` 重新生成） |
| `packages/vue-lynx/types/src/elements/index.ts` | 在 `VueLynxProps<T>` 中新增 `LynxSpecialProps` |
| `packages/vue-lynx/types/scripts/generate-native-tags.mjs` | 新增代码生成脚本 |
| `packages/vue-lynx/types/package.json` | 新增 `generate:native-tags` 脚本 |

## IDE 测试方法

### 1. 原生标签无报错
打开任意 `.vue` 文件，使用 `<view>`、`<text>`、`<image>`、`<scroll-view>` 等——无"Unknown component"波浪线。悬停可见来自 `@lynx-js/types` 的 prop 补全。

### 2. 修饰符诊断
```vue
<view @tap.capture="handler" />
```
Volar 应在 `.capture` 处显示红色波浪线，提示：*"Lynx does not support the .capture event modifier."*

### 3. global-bind / global-catch
```vue
<view global-bind:tap="handler" />
<view global-catch:tap="handler" />
```
无"unknown prop"错误。值类型解析为 `((event: any) => void) | undefined`。

### 4. main-thread-ref
```vue
<view main-thread-ref="myEl" />
```
无"unknown prop"错误。`main-thread-ref` 在补全中显示为 `string` 类型。

### 5. main-thread: 命名空间
```vue
<view main-thread:ref="myEl" />
```
无"unknown prop"错误（由 `[key: \`main-thread:${string}\`]: any` 覆盖）。
