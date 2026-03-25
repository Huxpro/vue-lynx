# 将 vue-lynx 提取为独立仓库

## 决策

- **仓库名称**: `vue-lynx`（初始为私有 GitHub 仓库）
- **npm 包**: 仅 **两个** -- `vue-lynx` 和 `create-vue-lynx`
- **当前内部名称**: `@lynx-js/vue-*`（需要整合 -- 见下文）

## 动机

`packages/vue/` 已足够自包含，可以独立为一个仓库。将其从
lynx-stack 中分离出来可以让 Vue Lynx 项目拥有自己的发布节奏、CI
流水线和贡献者界面，同时仍通过 npm 无缝集成。

## 可行性分析

### 提交历史

`research/vue-lynx` 上有 33 个提交涉及 `packages/vue/`。
部分也涉及外部文件；这些都是**集成胶水代码**，而非功能代码:

| 外部文件                                      | 提交数 | 性质                                                      |
| --------------------------------------------- | ------- | --------------------------------------------------------- |
| `pnpm-lock.yaml`                              | 6+      | 自动生成；独立仓库有自己的                                |
| `pnpm-workspace.yaml`                         | 2       | 注册 `packages/vue/*`；独立后不需要                       |
| 根目录 `tsconfig.json`                        | 2       | 添加项目引用；独立后不需要                                |
| `.gitmodules`                                  | 1       | 添加 vuejs/core 子模块（已在 `packages/vue/` 下）         |
| `biome.jsonc` + `eslint.config.js`            | 1       | vue 测试目录的忽略列表项                                  |
| `packages/testing-library/.../ElementPAPI.ts`  | 1       | CSS 自定义属性修复（`--*` setProperty）                   |

只有 `ElementPAPI.ts` 的修改是真正的上游修复 -- 应该独立提交 PR 回
lynx-stack `main`。其他一切在仓库独立后都会消失。

**提取命令:**

```bash
git clone <lynx-stack> /tmp/vue-lynx
cd /tmp/vue-lynx
git filter-repo --path packages/vue/ --path-rename packages/vue/:
```

所有提交的原始消息、作者和日期均保留。

### 对 lynx-stack 的依赖图

```
vue-lynx
  └─ @lynx-js/types（仅类型，已发布到 npm）

vue-lynx/main-thread
  └─ @lynx-js/type-element-api（仅类型，已发布到 npm）

vue-lynx/plugin
  ├─ @lynx-js/template-webpack-plugin（已发布到 npm）
  ├─ @lynx-js/runtime-wrapper-webpack-plugin（已发布到 npm）
  └─ @lynx-js/react（仅 worklet-runtime 部分）

vue-lynx/internal/ops
  └─ （无 @lynx-js 依赖 -- 纯共享代码）
```

Runtime 和 main-thread 对 lynx-stack **零运行时依赖** -- 仅有
类型包。rspeedy-plugin 的 webpack 依赖都已发布到 npm。

唯一的紧密耦合是 `@lynx-js/react` 的 worklet-runtime。可以通过
将 worklet-runtime 提取为独立包或内联所需的部分来解决。

## 包策略: 两个 npm 包

### 为什么要整合

- `vue-lynx` 运行时仅在 Lynx 项目中使用，这些项目总是安装了
  构建插件 -- 不存在"有运行时但没有插件"的场景
- 内部包（`main-thread`、`internal`）用户永远不会直接导入
- 更少的包 = 更少的版本需要协调，更简单的安装，更少的 npm 噪音
- 子路径导出可以在不拆分包的情况下清晰地分离关注点

### 两个包

| npm 包                | 用途                                                         |
| --------------------- | ------------------------------------------------------------ |
| **`vue-lynx`**        | 全部: 运行时、插件、主线程、内部实现、测试                   |
| **`create-vue-lynx`** | 脚手架 CLI（`npm create vue-lynx`）                          |

`create-vue-lynx` 必须是独立的，因为 `npm create <name>` 硬编码
查找 `create-<name>`。

### `vue-lynx` 子路径导出

```jsonc
{
  "name": "vue-lynx",
  "exports": {
    ".": "./runtime/dist/index.js", // createApp, ref, ...
    "./plugin": "./plugin/dist/index.js", // pluginVueLynx
    "./main-thread": "./main-thread/dist/entry-main.js", // 由插件 require.resolve
    "./ops": "./internal/dist/ops.js", // OP 枚举（共享）
    "./testing": "./testing-library/dist/index.js" // render, fireEvent
  }
}
```

**面向用户的导入:**

```typescript
// 应用代码
import { createApp, ref, onMounted } from 'vue-lynx';

// lynx.config.ts
import { pluginVueLynx } from 'vue-lynx/plugin';

// 测试文件
import { render, fireEvent } from 'vue-lynx/testing';
```

**内部使用（用户无需编写）:**

```typescript
// 插件源码内部 -- 为 webpack 解析主线程入口
require.resolve('vue-lynx/main-thread');

// runtime/main-thread 内部 -- 共享 OP 枚举
import { OP } from 'vue-lynx/ops';
```

### 从当前包的整合映射

| 当前（`@lynx-js/`）             | -> 子路径               | 说明                    |
| ------------------------------ | ---------------------- | ----------------------- |
| `vue-lynx`         | `vue-lynx`（根）       | 主入口                  |
| `vue-lynx/plugin`  | `vue-lynx/plugin`      | 构建插件                |
| `vue-lynx/main-thread`     | `vue-lynx/main-thread` | 内部                    |
| `vue-lynx/internal/ops`        | `vue-lynx/ops`         | 共享 OP 枚举            |
| `vue-lynx/testing-library` | `vue-lynx/testing`     | 测试工具                |
| `vue-lynx/upstream-tests`  | （不导出）             | 仅开发使用，保留在仓库中 |

### 设计目标

1. **最小化面向用户的表面** -- 用户只需学习两个名字，而非六个
2. **不暴露构建工具内部** -- 导入路径中不出现"rsbuild"
3. **最大化迁移灵活性** -- 扁平名称，无作用域承诺

### 可能的未来和迁移路径

| 结果                   | 需要的变更                                            |
| ---------------------- | ----------------------------------------------------- |
| 保持独立               | （无变更）                                            |
| 被 `@lynx-js` 吸收     | `vue-lynx` -> `@lynx-js/vue`，保持相同子路径导出      |
| 获得 `@vue` 背书        | `vue-lynx` -> `@vue/lynx`，保持相同子路径导出          |

所有情况下: `npm deprecate vue-lynx "已迁移至 @xxx/yyy"`，发布一个最终
版本从新名称重新导出。子路径结构保持不变。

### 执行计划

**提取后，在 vue-lynx 仓库中:**

1. 重组 monorepo: 每个当前包变为单一 `vue-lynx` 包下的一个目录（它们仍可作为独立构建目标）
2. 在 `vue-lynx/package.json` 中添加 `exports` 映射
3. 将所有跨包导入更新为使用子路径导入
4. 将 `dependencies` 整合到根 `vue-lynx/package.json`
5. 更新所有文档和示例

另一种方案是在开发期间保持使用 `workspace:*` 的 monorepo 结构，
但通过 build/prepublish 脚本以单一包的形式发布，组装子路径导出。
这兼具两种方案的优势: 开发时独立构建，消费者使用单一包。

## 脚手架: `create-vue-lynx`

### 设计

`create-vue-lynx` 基于 `create-rstack`（与 `create-rspeedy` 相同的基础），
模板结构**与 create-rspeedy 的约定完全一致**，以便未来合并时无缝衔接。

### 为什么不包装/分叉 create-rspeedy

- `create-rspeedy --template` 仅支持硬编码的 `react-ts`/`react-js`
  -- 没有外部模板机制
- create-rspeedy 源码仅约 120 行；分叉与从头编写的工作量相同，
  且没有需要保留的 git 历史（新仓库）
- 直接依赖 `create-rstack` 是最干净的方案

### 未来合并的兼容性契约

为确保 `create-vue-lynx` 模板可以被 `create-rspeedy` 吸收
（或 create-rspeedy 获得外部模板支持），需要保持:

1. **相同的目录布局**: `template-vue-ts/`、`template-vue-js/`，结构与
   `template-react-ts/` 一致（lynx.config.ts、src/ 等）
2. **相同的 `template-common/` 模式**: 跨语言变体的共享文件
3. **相同的 package.json 版本占位符约定**: `devDependencies`
   版本从 CLI 自身 package.json 的 `devDependencies` 中获取
4. **相同的 `create-rstack` API**: `create()`、`select()`、`checkCancel()`

如果 `create-rspeedy` 后续添加 Vue 支持（内置或外部模板）:

- 将 `template-vue-*` 目录复制到 create-rspeedy
- 在 TEMPLATES 数组中添加 `{ template: 'vue', lang: 'ts' }`
- 废弃 `create-vue-lynx`，指向 `create-rspeedy`

### 包含内容

模板来自 lynx-stack 中已有的 `create-rspeedy/template-vue-*/`。
将其移入 vue-lynx 仓库。

## 提议的结构（vue-lynx 仓库）

```
vue-lynx/                          <- 仓库根目录
├─ packages/
│  └─ create-vue-lynx/             <- npm: create-vue-lynx
│     ├─ src/index.ts              （约 120 行，基于 create-rstack）
│     ├─ template-common/
│     ├─ template-vue-ts/
│     └─ template-vue-js/
├─ runtime/                        <- vue-lynx（根导出）
├─ plugin/                         <- vue-lynx/plugin
├─ main-thread/                    <- vue-lynx/main-thread（内部）
├─ internal/                       <- vue-lynx/ops（内部）
├─ testing-library/                <- vue-lynx/testing
├─ upstream-tests/                 <- 不发布
├─ package.json                    <- name: "vue-lynx", exports: { ... }
├─ tsconfig.json
└─ ...
```

### 源码管理

- 所有 `@lynx-js/*` 依赖使用 **npm 版本范围**（非 `workspace:*`）
- lynx-stack 中 `create-rspeedy` 的 Vue 模板可以选择:
  - 指向已发布的 `vue-lynx`，或
  - 在 `create-vue-lynx` 成为规范入口后移除

### CI 管理

**vue-lynx 仓库 CI:**

- 构建所有子路径目标
- 单元测试（vue-lynx/testing 管道）
- 上游测试（upstream-tests: 800 通过 / 141 跳过 / 0 失败）
- 发布时将 `vue-lynx` + `create-vue-lynx` 发布到 npm

**lynx-stack CI（集成）:**

- 考虑 **ecosystem-ci** 模式（类似 vuejs/ecosystem-ci）:
  在发布 `@lynx-js/types`、`template-webpack-plugin` 等的破坏性变更前，
  通过 `repository_dispatch` 触发 vue-lynx 的测试套件以尽早发现回归

### 提取后需要在 lynx-stack 中完成的工作

1. 移除 `packages/vue/` 目录
2. 清理 `pnpm-workspace.yaml`（移除 `packages/vue/*` 条目）
3. 清理根 `tsconfig.json`（移除 vue 项目引用）
4. 清理 `biome.jsonc` / `eslint.config.js`（移除 vue 忽略条目）
5. 将 `ElementPAPI.ts` CSS 自定义属性修复独立提交 PR 到 `main`
6. 决定是保留 `create-rspeedy` Vue 模板（指向 npm `vue-lynx`）
   还是移除它们以支持 `create-vue-lynx`

## 状态

- [ ] 将 `ElementPAPI.ts` 修复提交 PR 到 lynx-stack main
- [ ] 解决 `@lynx-js/react` worklet-runtime 耦合
- [ ] 使用 `git filter-repo` 提取仓库
- [ ] 将 `@lynx-js/vue-*` 包整合为带子路径导出的单一 `vue-lynx`
- [ ] 创建 `create-vue-lynx` 包（基于 `create-rstack`）
- [ ] 搭建独立 CI（构建 + 测试 + 发布）
- [ ] 在 lynx-stack 中添加 ecosystem-ci 集成
