# 我如何用两周 Vibe 出了 Vue Lynx

Vue 开发者想要 native 已经很多年了。["Vue + Lynx = Vue Native"](https://x.com/danielkelly_io/status/1899746975588737407) 这条推文收获了 1.7k 点赞。我们仓库里的 [Vue 集成 issue](https://github.com/lynx-family/lynx/issues/193) 拿到了 1,600 个 upvote——有史以来最多的 feature request。需求很明确，问题在于工程量。

一年前 [Lynx](https://lynxjs.org) 开源时，[Evan You](https://x.com/youyuxi/status/1898663514581168173) 和 [Rich Harris](https://x.com/Huxpro/status/1927276405328429259) 都转发推荐了，但生产级的框架集成向来需要大量工程投入。后来 [Vercel 重写 web streams](https://vercel.com/blog/we-ralph-wiggumed-webstreams-to-make-them-10x-faster) 和 [Cloudflare 的 ViNext](https://blog.cloudflare.com/vinext/) 让我看到，借助 AI，一个人也能交付过去需要一个团队才能完成的东西。这改变了我的判断。

Vue 本身已经有了基础：成熟的 Custom Renderer API。我用了一个周末来验证。一场约 $1,400、37 小时的 hackathon。起点是一个架构探索："Vue 的 Custom Renderer 能否适配双线程代码分割？怎么做？"周日凌晨 3 点，我在和 Claude 调试"点击加一不生效"。到了周一早上，我已经有了一个可运行的 [TodoMVC](https://vue.lynxjs.org/zh/guide/todomvc)（[推文](https://x.com/Huxpro/status/2028672358912086524)）。忍不住发了条若有所指的推文，结果立刻在 X 上火了。

[Embedded X]

---

## 介绍 Vue Lynx

接下来两周的晚上和周末都投入了进去：160+ 次提交，约 180 个会话。

```
▎ 第 1 周   ████████████░░░░░░░░  运行时 + 工具链
▎ 第 2 周   ░░░░░░░░████████████  文档 + 示例 + 国际化
```

第一周结束时就可以发布了。但了解我的人都知道我的原则：

>*东西真的能跑的时候，让 demo 自己说话。*

去 [vue.lynxjs.org](https://vue.lynxjs.org) 看 20 多个示例应用，原生和 Web **同时运行**——不用离开浏览器就能体验。

我们覆盖了完整的 Composition API、[`<Transition>`](https://vue.lynxjs.org/zh/guide/vue-compatibility)、[`<Suspense>`](https://vue.lynxjs.org/zh/guide/vue-compatibility)，以及 [Vue Router](https://vue.lynxjs.org/zh/guide/routing)、[Pinia](https://vue.lynxjs.org/zh/guide/pinia)、[Tailwind CSS](https://vue.lynxjs.org/zh/guide/tailwindcss)、[TanStack Query](https://vue.lynxjs.org/zh/guide/data-fetching) 等生态集成。同时移植了 Lynx 官方教程（[瀑布流 Gallery](https://vue.lynxjs.org/zh/guide/tutorial-gallery) 和 [Swiper](https://vue.lynxjs.org/zh/guide/tutorial-swiper)）来展示原生组件和[主线程脚本](https://vue.lynxjs.org/zh/guide/main-thread-script)实现的零延迟手势交互。一个 [HackerNews 克隆](https://vue.lynxjs.org/zh/guide/hackernews)将这一切串联在了一起。


[Embedded X]

### 现在就试试

  ```
  npm create vue-lynx@latest
  ```

当然，它是[开源的](https://github.com/huxpro/vue-lynx)。我知道你会 star 它，但也别忘了给 [Lynx](https://github.com/lynx-family/lynx) 和 [Lynx Stack](https://github.com/lynx-family/lynx-stack) 点个 star。

希望 Vue 和 Lynx 社区能一起把它做下去。欢迎提 Issue、PR 和任何反馈。

---

## 工程实现

> 这个项目没有让任何人类写过代码

### 为 AI 搭建架构

之前有两次社区尝试。第二次来自 Vue Vine 的维护者，进展相当深入，甚至跑通了主线程脚本。但两个项目都和 Web 一样把 Vue 跑在主线程上。这在 Lynx 上能工作，但没有利用 Lynx 最核心的[双线程架构](https://lynxjs.org/blog/lynx-unlock-native-for-more#use-the-main-thread-responsibly-for-interactivity)：将繁重的框架重渲染卸载到后台线程，保持原生 UI 线程不阻塞，只在需要时介入（通过主线程脚本）。

这是我在第一天就验证的核心架构假设。在 Vue Lynx 中，整个 Vue 运行时跑在后台线程（Background Thread）。一棵轻量的 `ShadowElement` 链表树在内存中镜像 DOM 元素树，供 Custom Renderer 操作，所有 DOM 变更被序列化为扁平的 ops 缓冲区，每个 tick 批量发送到主线程：

```
┌──────────────────────────────────────────────────────┐
│                     后台线程                          │
│  Vue 3 运行时 · 响应式 · 生命周期 · 你的代码           │
└──────────────┬──────────────────────▲────────────────┘
          ops  │                      │  事件
               ▼                      │
┌──────────────────────────────────────┴───────────────┐
│                      主线程                           │
│  原生元素 · 布局 · 渲染 · 主线程脚本处理器              │
└──────────────────────────────────────────────────────┘
```

为了让 agent 始终对齐双线程架构、不滑向它默认的单线程 Web 模型，我把所有[关键设计文档直接嵌入了源码树](https://github.com/Huxpro/vue-lynx/tree/main/plans)：设计讨论记录、决策日志、以及实现后的复盘，作为*跨会话上下文*。每个新会话都能从上一个离开的地方继续，继承塑造代码的架构约束和推理过程。

### ["Harness"](https://openai.com/index/harness-engineering/) 工程

> 得蹭上 AI、Vibe 和 "Agentic" 之后最热的词
#### 桥接 Vue 上游测试基础设施

AI 驱动开发中最关键的投资是反馈。理想情况下，为了确保与官方 Vue 的一致性，我们会直接复用 Vue 的上游测试套件。但 Vue 的测试假定了单线程 DOM。怎么用它来测试双线程渲染器？

好在 Lynx 已经有了[双线程测试环境](https://lynxjs.org/next/api/lynx-testing-environment/index.html#lynx-jstesting-environment)的基础设施。我们可以将测试套件改接到我们的**双线程流水线**：后台线程 `ShadowElement` -> ops 缓冲区 -> `syncFlush()` -> 主线程 `applyOps` -> PAPI -> jsdom，然后让 agent 持续**磨**到没有可修复的失败为止（本质上就是 [Ralph Loop](https://ghuntley.com/loop/)）。结果：949 个上游测试中通过了 852 个。每个失败用例都记录在 [skiplist](https://github.com/Huxpro/vue-lynx/blob/main/packages/upstream-tests/skiplist.json) 中并附有原因说明，且都是可忽略的。详见[完整报告和 skip 分析](https://github.com/Huxpro/vue-lynx/blob/main/packages/upstream-tests/README.md)。

我们还为 Lynx 特有的功能面添加了自己的测试，比如 `<list>` 元素、`bindtap` 事件、主线程脚本 API。流水线验证通过后，我进一步从 Vue 官方文档中 fork 了 [7GUIs benchmark](https://eugenkiss.github.io/7guis/) 作为[压力测试](https://vue.lynxjs.org/zh/guide/7guis)。


```
              后台线程  ┃  主线程
                        ┃
Vue → ShadowElement → Ops  ┃  PAPI → Lynx 引擎 → UI
                        ┃
├─ vue runtime-core ─┤  ┃
├─── vue runtime-dom ───────╂──┤
       ├── E2E 流水线 ──────╂─────────────┤
                        ┃         ├── Agentic ───┤
```

#### Agentic E2E 验证闭环

但那些传统的机械测试无法捕捉过去需要人工评估的真实 UI bug：CSS 布局错位、真机上的交互异常。对于 `<Transition>`、`<Suspense>` 这样的高级 Vue 功能，你需要看到它们运行并交互才能验证行为。

有了正确的 harness，编写示例不只是做 demo——它们同时也是 agent 能自动评估的工作负载。我搭建了两个执行环境：通过 Lynx DevTool CLI/MCP/Skill 驱动的 iOS 模拟器，以及通过 Lynx for Web 驱动的 agent 控制浏览器。闭环很简单：在两个环境中运行示例，观察并验证输出，任何回归都触发修复。无需人工介入。

```
┌──── 修复 ◀────────────────────────────────┐
│                                           │
▼                                           │
示例 ──┬──▶ iOS 模拟器 ────────┬──▶ 评估
       │    (DevTool MCP)     │
       │                      │
       └──▶ Lynx for Web ─────┘
            (agent-browser)
```

我从 Vue 核心功能开始，这里正确性有明确定义：agent 阅读官方文档，编写示例，检查输出是否符合预期。然后我扩展到生态集成：Vue Router、Pinia、TanStack Query、Tailwind CSS。

在最终考试中，我尝试了另一种方法——后来我才知道它有个名字：**差分评估（differential evaluation）**：让 agent 移植已有应用，并将输出与原版对比验证。第一组以 Vue HackerNews 的标准实现为基准，在浏览器中将 Web 版本和 vue-lynx 移植版通过 Lynx for Web 并排运行；第二组以现有的 ReactLynx demo 为参考，移植到 vue-lynx 后在 iOS 模拟器上通过 Lynx DevTool MCP 验证一致性。harness 不需要在抽象层面知道什么是"正确的"。它只需要两边的输出一致。

```
| 基准真值                | 候选版本         | 环境                      |
|-----------------------|-----------------|--------------------------|
| Vue HackerNews (Web)  | vue-lynx 移植版  | Lynx Web (浏览器)         |
| ReactLynx demo        | vue-lynx 移植版  | Lynx Native (模拟器)      |


                    ┌─────────────────────────────┐
       ┌────────────▶  基准真值 ────────▶     A   │
       │            │                         │   │
输入 ──┤            │                        对比 ──▶  差异
       │            │                         │   │      │
       └────────────▶  Lynx (候选版本) ──▶    B   │      ▼
                    └─────────────────────────────┘   修复闭环
```


#### 账单

```
┌──────────────────────────────────────────┐
│ 账单（按 Opus 费率）                      │
├──────────────────────────────┬───────────┤
│ 输入 (3.8M tokens)           │ $      57 │
│ 输出 (6.8M tokens)           │ $     510 │
│ 缓存写入 (117.9M tokens)     │ $   2,211 │
│ 缓存读取 (2.5B tokens)       │ $   3,769 │
├──────────────────────────────┼───────────┤
│ 合计                         │ $   6,547 │
└──────────────────────────────┴───────────┘
```

数字本身就在讲故事。输出 token——Claude 实际*写出*的代码和文本——只占总费用的 8%。其余 92% 是理解：重读代码库、消化工具输出、在 31,700 次 API 调用中反复处理对话历史。每一轮，agent 都会重读之前所有的上下文。25 亿 token 的阅读量，产出 680 万 token 的写作——370:1 的比率。

这就是"agentic"在账单层面的真实面貌。agent 不是代码打印机。它是反馈循环的参与者：读上下文、做改动、跑测试、读结果、迭代。它的大部分算力花在了*理解现状*，而非*生成新内容*。AI 辅助工程的真正成本不在生成，而在理解。

这 $6,500 值吗？我不知道。我用的是 Max 订阅。$200。


## 接下来做什么？

### 长期维护

这个项目始于一个人利用晚上和周末的努力。我很期待能和 Evan You 及 Vue 核心团队一起探索 Vue on native 的未来。我个人，以及代表 Lynx 团队，都承诺持续支持它的发展。

### 功能完善

Vue Lynx 目前是 pre-alpha 阶段。架构已经稳固，但 Vue 的 API 面很大，我们还没有验证每一个角落。
- `KeepAlive` 和 `Teleport` 等功能可能需要运行时适配。
- `<style scoped>` 和原生输入上的 `v-model` 可以实现但尚未完成。
- 主线程脚本 API 目前复用了 ReactLynx 的指令式设计。更符合 Vue 风格的方案（如 `<script main-thread setup>`）值得探索。
- Vue DevTools 与 Lynx DevTool 应用的集成。

Vue 核心之外，还有一个庞大的 Vue 生态等待在 native 上生长。

愿景很简单：Vue 开发者应该能像今天发布 Web 应用一样自然地发布 native 应用。我们还没到那一步，但地基已经打好，路径已经清晰。

---

如果你看到了这里：去试试吧。做点什么。搞坏点什么。告诉我们还缺什么。
