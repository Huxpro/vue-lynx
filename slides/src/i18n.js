// =========================================================
// Bilingual deck — English is the inline source; this module
// supplies the Chinese. Elements are matched by their
// normalized English textContent (no per-element markup
// needed), and their innerHTML is swapped in place so
// magic-move data-flip identity is preserved.
// =========================================================

export function normalizeKey(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// Cover verbs cycle via main.js — swapped there, not here.
export const ZH_VERBS = ['解锁', '随手写', '渲染', '发布'];

// key = normalized English textContent · value = Chinese innerHTML
export const ZH = {
  // ---- Cover ----
  'Native for Vue': '原生,给 <span class="brand-text">Vue</span>',
  'Develop Lynx with the familiar Vue 3.': '用熟悉的 Vue 3 开发 Lynx。',

  // ---- Pitch ----
  'I · The Pitch': 'I · 主张',
  'Apps upgrading from web to native.':
    'App 从 Web <em style="font-family:var(--serif);font-weight:400">升级</em>到原生。',
  'Same Vue codebase. Real native UI. Three things change the moment you cross the bridge.':
    '同一套 Vue 代码。真正的原生 UI。跨过这道桥,有三件事会变。',

  // ---- Pillars ----
  'i · Speed': 'i · 速度',
  'ii · Experience': 'ii · 体验',
  'iii · Capabilities': 'iii · 能力',
  'i. Speed': '<span class="pstack__num">i.</span> 速度',
  'ii. Experience': '<span class="pstack__num">ii.</span> 体验',
  'iii. Capabilities': '<span class="pstack__num">iii.</span> 能力',
  'Native rendering, native layout, native scrolling. Cold start measured in milliseconds — not seconds.':
    '原生渲染、原生布局、原生滚动。冷启动以毫秒计 —— 不是秒。',
  'Silky 60fps gestures via Main-Thread Script. Native list virtualization. Inputs that feel like the OS — because they are the OS.':
    '主线程脚本带来丝滑的 60fps 手势。原生列表虚拟化。输入体验就像系统原生 —— 因为它<em>就是</em>系统原生。',
  'Camera, sensors, deep links, native modals. Every platform API is one element away — without leaving your <template>.':
    '相机、传感器、深链、原生弹窗。每个平台 API 都只差一个元素 —— 无需离开你的 <code>&lt;template&gt;</code>。',

  // ---- Demos ----
  'TodoMVC, redrawn natively.': '<span class="brand-text">TodoMVC</span>,用原生重绘。',
  "Same Composition API you'd write for the web — reactive state, v-model, computed totals. Tap latency stays under one frame.":
    '和写 Web 时一样的 Composition API —— 响应式状态、<code>v-model</code>、computed 合计。点击延迟不到一帧。',
  'A waterfall that scrolls like the OS.':
    '像系统一样滚动的<span class="brand-text">瀑布流</span>。',
  'Backed by the native <list> — not a virtual one. Cells recycle, images stream, the scroll thread never waits on JavaScript.':
    '背后是原生 <code>&lt;list&gt;</code> —— 不是虚拟列表。单元格复用、图片流式加载,滚动线程从不等 JavaScript。',
  'Touch handlers on the UI thread.':
    '触摸回调跑在 <span class="brand-text">UI 线程</span>。',
  "A carousel that follows your finger pixel-for-pixel. Drag events run on Lynx's main thread — never round-tripping through Vue's reactivity tick.":
    '一个逐像素跟手的轮播。拖拽事件在 Lynx 主线程上运行 —— 从不绕经 Vue 的响应式 tick。',
  'Every Vue primitive — on native.':
    '你熟悉的每个 Vue 原语 —— <span class="brand-text">跑在原生上。</span>',
  '<Transition> and <Suspense>, slots, provide/inject — powered by CSS animation on the native compositor.':
    '<code>&lt;Transition&gt;</code> 和 <code>&lt;Suspense&gt;</code>、插槽、provide/inject —— 由原生合成器上的 CSS 动画驱动。',
  'native <input>': '原生 &lt;input&gt;',
  'native <list>': '原生 &lt;list&gt;',
  'MTS scrollbar': 'MTS 滚动条',
  'no JS bridge': '无 JS 桥',

  // ---- Story ----
  'Chapter II': '第二章',
  'The story of Vue Lynx.': 'Vue Lynx 的故事。',
  'Two weeks of nights and weekends. One person, one Max plan, one stubborn architectural bet.':
    '两周的夜晚和周末。一个人、一个 Max 订阅、一个固执的架构赌注。',
  '160 commits': '<span class="brand-text">160</span> 次提交',
  '21 active days. One person. One repo.': '21 个活跃日。一个人。一个仓库。',
  'The arc': '过程',
  'Zero to native runtime in four moves.': '四步,从零到原生运行时。',
  'Weekend · 3/01–3/03': '周末 · 3/01–3/03',
  'Week 1 · 3/04–3/09': '第 1 周 · 3/04–3/09',
  'Week 2 · 3/10–3/16': '第 2 周 · 3/10–3/16',
  'Final · 3/17–3/23': '收尾 · 3/17–3/23',
  'Dual-thread MVP': '双线程 MVP',
  'MTS & demos': 'MTS 与示例',
  'Toolchain & site': '工具链与站点',
  'Polish & HackerNews': '打磨与 HackerNews',
  'Vue runtime on BG, ops buffer to Main. By Monday: TodoMVC working.':
    'Vue 运行时跑在后台线程,ops 缓冲送往主线程。周一早上:TodoMVC 跑通。',
  'Main-Thread Script, Gallery, Swiper. Cross-thread APIs.':
    '主线程脚本、Gallery、Swiper。跨线程 API。',
  'Dual-bundle plugin. Rspress site. 9 apps in one 22h session.':
    '双产物插件。Rspress 站点。一次 22 小时会话里做了 9 个应用。',
  'Transition, Vue Query, Tailwind. HackerNews port. Bilingual docs.':
    'Transition、Vue Query、Tailwind。移植 HackerNews。双语文档。',
  'The receipts': '成绩单',
  'commits': '提交',
  'human hours': '人力小时',
  'upstream tests pass': '上游测试通过',
  'example apps': '示例应用',

  // ---- Lynx platform divider ----
  'Chapter III': '第三章',
  'The Lynx platform itself.': 'Lynx 平台本身。',
  'Web-friendly on the surface, architecturally serious underneath.':
    '表面亲和 Web,底层架构够硬。',

  // ---- Landscape ----
  'The landscape': '格局',
  'The landscape · the map': '格局 · 地图',
  'The landscape · the answer': '格局 · 答案',
  'Every stack is layers — and seams.':
    '每个技术栈都是<span class="brand-text">层</span> —— 以及缝。',
  "Split a cross-platform stack into five layers. What decides openness isn't any one layer — it's whether the seam between them stays open (an extension point) or gets welded into a wall.":
    '把一个跨端技术栈拆成五层。决定开放性的不是某一层 —— 而是层与层之间那条<em>缝</em>:是留着(一个扩展点),还是被焊成一堵墙。',
  'open — an extension point': '<i></i>开 —— 一个扩展点',
  'half-open': '<i class="part"></i>半开',
  'welded shut': '<i class="seal"></i>焊死',
  'Web — open on top, sealed below. Takes any frontend, but the sandbox welds rendering and capabilities shut.':
    '<b style="color:#4FB8F0">Web</b> —— 上层全开,下层焊死。前端随便接,但沙箱把渲染和能力都封死了。',
  'React Native — capabilities wide open, but the frontend is bound to React and each new platform is ported by hand.':
    '<b style="color:#9E86F0">React Native</b> —— 能力层全开,但前端绑死 React,每上一个新端都要手动适配。',
  'Flutter — the bottom half is wide open, at the cost of a single Dart-only door on top.':
    '<b style="color:#F27A9E">Flutter</b> —— 下半场全开,代价是上层只留 Dart 一扇门。',
  'NativeScript — the most direct native access, but rendering and new platforms are both welded shut.':
    '<b style="color:#E8B44A">NativeScript</b> —— 原生接入最直接,但渲染和上新端两处都焊死。',
  'Lynx is the only column with all four seams open — every layer leaves an extension point.':
    '<b class="brand-text">Lynx</b> 是唯一四条缝全开的一列 —— 每层都留了扩展点。',
  'Four seams. Lynx welds none.':
    '四条缝。<span class="brand-text">Lynx</span> 一条都不焊。',
  "Framework-agnostic by design — the Web's developer experience, native's user experience, and room to reach any platform. That's the opening for Vue.":
    '天生框架无关 —— Web 的开发体验、原生的用户体验,还有上任意平台的余地。这就是留给 Vue 的口子。',

  // ---- Web-friendly ----
  'a · Web-friendly': 'a · 亲和 Web',
  "The code you'd write anyway.":
    '你<em style="font-family:var(--serif);font-weight:400">本来</em>就会写的代码。',
  'The same .vue file — only the tags are HTML-shaped: <view>, <text>, <image>, <list>.':
    '同一个 <code>.vue</code> 文件 —— 只是标签换成了 HTML 形状:<code>&lt;view&gt;</code>、<code>&lt;text&gt;</code>、<code>&lt;image&gt;</code>、<code>&lt;list&gt;</code>。',
  'And it renders on the web, too.':
    '而且,它也能跑在 <span class="brand-text">Web</span> 上。',
  'Every demo in this deck is a real Vue Lynx app running through Lynx for Web — right now, no simulator.':
    '这套 deck 里的每个 demo,都是真实的 Vue Lynx 应用,通过 Lynx for Web 跑着 —— 此刻,无需模拟器。',

  // ---- Architecture ----
  'b · Architecturally performing': 'b · 架构够硬',
  'Two threads, by design.': '两条线程,天生如此。',
  'Lynx splits your app across a dedicated background thread and a main thread that owns the UI.':
    'Lynx 把你的应用拆到一条专用的后台线程,和一条掌管 UI 的主线程上。',
  'Background thread': '<span class="dot"></span>后台线程',
  'Main (UI) thread': '<span class="dot"></span>主(UI)线程',
  'Vue 3 runtime & your code': 'Vue 3 运行时与你的代码',
  'Native elements & render': '原生元素与渲染',
  'reactivity & lifecycle': '响应式与生命周期',
  'component tree diff': '组件树 diff',
  'event handlers': '事件处理',
  'data fetching': '数据请求',
  'layout & paint': '布局与绘制',
  'gestures & scrolling': '手势与滚动',
  'ops interpreter': 'ops 解释器',
  'flat buffer': '扁平缓冲',
  'Your whole Vue app runs here — on a thread of its own.':
    '你的整个 Vue 应用都跑在这里 —— 一条属于自己的线程上。',
  'One bundle, two layers — no JS bridge round-trip on the hot path.':
    '一个产物,两个层 —— 热路径上没有 JS 桥的往返。',

  // ---- Combine ----
  'A new path': '一条新路',
  'Vue, on native.': 'Vue,<span class="brand-text">跑在原生上。</span>',

  // ---- Close divider ----
  'Chapter IV': '第四章',
  "And we'd love your help.": '也很希望你能<br/>搭把手。',
  "Vue Lynx is pre-alpha. The architecture is solid; Vue's API surface is large. What ships next depends on who shows up.":
    'Vue Lynx 还是 pre-alpha。架构很稳;Vue 的 API 面很大。接下来能做出什么,取决于谁愿意来。',

  // ---- Ask ----
  'The ask': '我们的请求',
  "Native shouldn't be a different team.":
    '原生,不该是另一个<span class="brand-text">团队</span>的事。',
  'Vue developers should ship native apps as naturally as they ship for the web today.':
    'Vue 开发者应该能像今天发 Web 一样,自然地发原生应用。',

  // ---- What's there / open ----
  'Where it stands': '现状',
  "What's there": '已经有的',
  "What's open": '还缺的',
  'Composition API & SFCs': '<b>Composition API 与 SFC</b>',
  'Transition, Suspense, slots': '<b>Transition、Suspense、插槽</b>',
  'Pinia, Router, Query, Tailwind': '<b>Pinia、Router、Query、Tailwind</b>',
  'Main-Thread Script': '<b>主线程脚本</b>',
  'KeepAlive, Teleport': '<b>KeepAlive、Teleport</b>',
  'Vue DevTools integration': '<b>Vue DevTools 集成</b>',
  "The ecosystem you'd port": '<b>等你来移植的生态</b>',

  // ---- Try ----
  'Try it tonight': '今晚就试',
  "One npm create, and you're shipping native.":
    '一行 <span class="brand-text">npm create</span>,你就在发原生了。',
  'for Agent': '给 Agent',
  'Quick Start →': '快速开始 →',
  'Read the intro': '读简介',

  // ---- Thank you ----
  'Fin.': '完。',
  'Thank you.': '<span class="brand-text">谢</span>谢。',
  'Questions, PRs, opinions — all welcome.': '提问、PR、想法 —— 都欢迎。',

  // ---- Ch II · It's really Vue / Ch III · web→native / architecture (added) ----
  'a · Same language': 'a · 同一种语言',
  'The one swap': '唯一的替换',
  'The language · reactivity': '语言 · 响应式',
  'The language · both API styles': '语言 · 两种 API 风格',
  'Components · slots': '组件 · 插槽',
  'Components · v-model': '组件 · v-model',
  'Components · provide / inject': '组件 · provide / inject',
  'The ecosystem · Pinia': '生态 · Pinia',
  'The ecosystem · Vue Router': '生态 · Vue Router',
  'The ecosystem · data fetching': '生态 · 数据请求',
  'Built-ins · async': '内置 · 异步',
  'Built-ins · Transition & KeepAlive': '内置 · Transition 与 KeepAlive',
  'Built-ins · event modifiers': '内置 · 事件修饰符',
  'Styling · real CSS': '样式 · 真 CSS',
  'The Lynx twist · virtualized by default': 'Lynx 的转折 · 默认虚拟化',
  'And portable': '而且可移植',
  'Not a claim — a test suite': '不是口号 —— 是一套测试',
  'HTML-shaped tags, one map away.': 'HTML 形状的标签,一次映射即可。',
  'It renders on the web, too.': '它也能跑在 <span class="brand-text">web</span> 上。',
  'One .vue file, <script setup>, scoped <style>. The compiler targets native elements instead of the DOM — nothing else moves.': '一个 <code>.vue</code> 文件、<code>&lt;script setup&gt;</code>、scoped <code>&lt;style&gt;</code>。编译器把目标从 DOM 换成原生元素 —— 别的都不动。',
  'Reactivity, computed, template syntax, @tap handlers — the same file you\'d write for the web.': '响应式、<code>computed</code>、模板语法、<code>@tap</code> 回调 —— 和你为 Web 写的同一个文件。',
  'The mental model doesn\'t change — the vocabulary does. <list> is native virtualization, built in.': '心智模型不变 —— 变的是词汇。<code>&lt;list&gt;</code> 是内建的原生虚拟化。',
  'reactive, ref, toRefs, computed, watch — the reactivity system runs unchanged.': '<code>reactive</code>、<code>ref</code>、<code>toRefs</code>、<code>computed</code>、<code>watch</code> —— 响应式系统原样运行。',
  'Composition or Options — data, computed, watch, methods, $emit, lifecycle all fire.': 'Composition <em>或</em> Options —— <code>data</code>、<code>computed</code>、<code>watch</code>、<code>methods</code>、<code>$emit</code>、生命周期全都触发。',
  'Named slots, scoped slots, #shorthand, fallback content — all standard.': '具名插槽、作用域插槽、<code>#</code> 简写、fallback 内容 —— 全是标准写法。',
  'v-model on a native <input>, on a component via defineModel, and named models — all three.': '<code>v-model</code> 用在原生 <code>&lt;input&gt;</code> 上、用 <code>defineModel</code> 用在组件上、以及具名 model —— 三种都行。',
  'Reactive provide / inject, defaults included — dependency injection across the tree.': '响应式 <code>provide</code> / <code>inject</code>,带默认值 —— 跨树的依赖注入。',
  'Stock Pinia — defineStore, getters, actions, createPinia(). Unmodified.': '原装 Pinia —— <code>defineStore</code>、getter、action、<code>createPinia()</code>。零改动。',
  'The real vue-router — dynamic params, guards, <RouterView>. Swap the history to createMemoryHistory and go.': '真正的 <code>vue-router</code> —— 动态参数、守卫、<code>&lt;RouterView&gt;</code>。把 history 换成 <code>createMemoryHistory</code> 就行。',
  '@tanstack/vue-query — useQuery, useMutation, caching, dependent queries. It just works.': '<code>@tanstack/vue-query</code> —— <code>useQuery</code>、<code>useMutation</code>、缓存、依赖查询。直接就能用。',
  '<Suspense>, defineAsyncComponent, dynamic import(), top-level await — all resolve.': '<code>&lt;Suspense&gt;</code>、<code>defineAsyncComponent</code>、动态 <code>import()</code>、顶层 <code>await</code> —— 全部可用。',
  '<Transition> drives real Lynx CSS transitions; <KeepAlive> preserves state across <component :is>.': '<code>&lt;Transition&gt;</code> 驱动真实的 Lynx CSS 过渡;<code>&lt;KeepAlive&gt;</code> 在 <code>&lt;component :is&gt;</code> 之间保留状态。',
  '.stop, .once, .prevent, .self, chained — on @tap, Lynx\'s native gesture.': '<code>.stop</code>、<code>.once</code>、<code>.prevent</code>、<code>.self</code>、可链式 —— 都在 <code>@tap</code>(Lynx 的原生手势)上。',
  'Scoped styles, CSS Modules, v-bind() in CSS, and Tailwind — real CSS, bridged to Lynx\'s native cssId.': 'scoped 样式、CSS Modules、CSS 里的 <code>v-bind()</code>、以及 Tailwind —— 真 CSS,桥接到 Lynx 原生的 <code>cssId</code>。',
  'The one place it\'s not identical — and it\'s an upgrade: v-for over a native, recycling <list>.': '唯一不完全相同的地方 —— 而且是升级:<code>v-for</code> 跑在原生、可复用的 <code>&lt;list&gt;</code> 上。',
  'Upstream vue/core tests, run against our renderer through the full BG → ops → MT → PAPI pipeline. Zero failing. 131 skipped, every one categorized.': '上游 <b>vue/core</b> 测试,跑在我们的渲染器上,走完整的 BG&nbsp;→&nbsp;ops&nbsp;→&nbsp;MT&nbsp;→&nbsp;PAPI 管线。<b>零失败。</b>131 个跳过,每个都归了类。',
  'Case 1 · AI Chat': '案例 1 · AI Chat',
  'Case 1 · the fork': '案例 1 · 这次分叉',
  'Case 1 · the headline delta': '案例 1 · 最关键的差异',
  'Case 2 · Elk': '案例 2 · Elk',
  'Case 2 · the fork': '案例 2 · 这次分叉',
  'Case 2 · the crown jewel': '案例 2 · 皇冠上的宝石',
  'Case 2 · where the work really was': '案例 2 · 真正的功夫在哪',
  'The recipe': '配方',
  'Keep the logic. Rebuild the surface.': '保留逻辑,重建表层。',
  'Reuse the framework-agnostic layers.': '复用框架无关的层。',
  'Real apps hit real edges.': '真实的应用会撞上真实的边缘。',
  'The Vue stays Vue. The edges are the work.': 'Vue 还是 Vue。功夫在边缘。',
  'A production AI chatbot, ported.': '一个生产级 <span class="brand-text">AI 聊天机器人</span>,已移植。',
  'Elk — a real Mastodon client.': '<span class="brand-text">Elk</span> —— 一个真正的 Mastodon 客户端。',
  'Forked from the official Nuxt AI Chatbot template — streaming responses, tool cards, markdown, model picker, chat history. 65 features carried over, 10 dropped with reasons.': '从官方 Nuxt AI 聊天模板分叉而来 —— 流式回复、工具卡片、Markdown、模型选择、聊天历史。65 个功能移过来了,10 个带着理由砍掉。',
  'Anthony Fu\'s Nuxt 3 client: ~196 components, 55 pages, 50 composables. Timelines, threads, profiles, rich content, dark mode — browsing any public instance, natively.': 'Anthony Fu 的 Nuxt 3 客户端:约 196 个组件、55 个页面、50 个 composable。时间线、thread、个人页、富内容、暗色模式 —— 原生浏览任意公开实例。',
  '@ai-sdk/vue\'s useChat assumed browser streaming. A custom composable keeps its exact surface — and picks the transport by capability.': '<code>@ai-sdk/vue</code> 的 <code>useChat</code> 假设了浏览器流式。一个自定义 composable 保持完全相同的 API —— 并按能力挑选传输方式。',
  'The content renderer — emoji, mentions, hashtags, polls, media. The parse half is identical; only the render half retargets its vnodes to native.': '内容渲染器 —— emoji、提及、话题标签、投票、媒体。<em>解析</em>那半原样保留;只有<em>渲染</em>那半把 vnode 重新指向原生。',
  'Two real apps, one recipe: reuse every framework-agnostic layer, rebuild the DOM surface on native, pay down a bounded list of platform gaps. The logic never had to change.': '两个真实应用,一个配方:复用每一层框架无关的代码,在原生上重建 DOM 表层,还清一份有限的平台差异清单。逻辑从来不必改。',
  'b · the build': 'b · 构建',
  'b · the build · the split': 'b · 构建 · 拆分',
  'b · the build · one artifact': 'b · 构建 · 一个产物',
  'b · the build · in the plugin': 'b · 构建 · 插件内部',
  'b · the runtime': 'b · 运行时',
  'b · the runtime · background': 'b · 运行时 · 后台',
  'b · the runtime · the bus': 'b · 运行时 · 总线',
  'b · the runtime · to the metal': 'b · 运行时 · 直达底层',
  'b · the runtime · in the renderer': 'b · 运行时 · 渲染器内部',
  'b · the trade-off': 'b · 权衡',
  'One source. Two bundles.': '一份源码,<span class="brand-text">两个产物。</span>',
  'Vue mutates. Native renders.': 'Vue 变更,<span class="brand-text">原生渲染。</span>',
  'Why split at all?': '为什么要拆?',
  'At build time, your single Vue app is compiled into two programs — one per thread — without you writing two of anything.': '在构建期,你那一个 Vue 应用被编译成两个程序 —— 一条线程一个 —— 而你什么都不用写两遍。',
  'One source tree — the code you already wrote.': '一棵源码树 —— 你已经写好的代码。',
  'One plugin — reusing Lynx\'s rspeedy toolchain and React Lynx\'s worklet transform. It\'s a sibling of the React plugin, not a rewrite.': '一个插件 —— 复用 Lynx 的 <b>rspeedy</b> 工具链和 React Lynx 的 <b>worklet transform</b>。它是 React 插件的兄弟,不是重写。',
  'The same files, compiled twice — a background pass (JS) and a main-thread pass (LEPUS bytecode) — routed by webpack\'s issuerLayer.': '同一批文件,编译两遍 —— 一遍后台(JS),一遍主线程(LEPUS 字节码)—— 由 webpack 的 <code>issuerLayer</code> 分流。',
  'Both are packaged by the reused LynxTemplatePlugin into a single .lynx.bundle — one file that boots both threads.': '两者由复用的 <code>LynxTemplatePlugin</code> 打进一个 <code>.lynx.bundle</code> —— 一个文件,启动两条线程。',
  'Two webpack entries, two layers, one reused worklet runtime.': '两个 webpack 入口、两个 layer、一个复用的 worklet 运行时。',
  'At runtime, Vue never touches a native view directly. It mutates a shadow tree; the changes travel as ops and are replayed on the UI thread.': '在运行期,Vue 从不直接碰原生视图。它变更一棵影子树;改动作为 ops 传递,在 UI 线程上重放。',
  'Vue runs through a custom renderer. Every createElement, insert, patchProp is one nodeOps call.': 'Vue 跑在一个自定义渲染器上。每次 <code>createElement</code>、<code>insert</code>、<code>patchProp</code> 都是一次 <code>nodeOps</code> 调用。',
  'nodeOps mutates a ShadowElement tree — a lightweight mirror on the background thread — and appends each change to a flat ops buffer.': '<code>nodeOps</code> 变更一棵 <b>ShadowElement 树</b> —— 后台线程上的一个轻量镜像 —— 并把每次改动追加进一段扁平的 <b>ops 缓冲</b>。',
  'All ops from one reactive tick coalesce into a single cross-thread call. The main thread\'s applyOps replays them.': '一个响应式 tick 里的所有 ops 合并成一次跨线程调用。主线程的 <code>applyOps</code> 把它们重放出来。',
  'applyOps replays each op through the Element PAPI — __CreateView, __SetAttribute, __AddEvent — then __FlushElementTree() commits to native.': '<code>applyOps</code> 把每个 op 通过 <b>Element PAPI</b> 重放 —— <code>__CreateView</code>、<code>__SetAttribute</code>、<code>__AddEvent</code> —— 再由 <code>__FlushElementTree()</code> 提交到原生。',
  'Fourteen methods. Each mutates the shadow tree and pushes one op. That\'s the entire Vue→native adapter.': '十四个方法。每个都变更影子树、推一个 op。这就是整个 Vue→原生适配器。',
  'Kept — unchanged Vue': '保留 —— 原样的 Vue',
  'Rebuilt — for native': '重建 —— 为了原生',
  'Kept — verbatim': '保留 —— 逐字照搬',
  'What you win': '你赢得什么',
  'What you pay': '你付出什么',
  'Composition API, SFCs, reactivity': 'Composition API、SFC、响应式',
  'vue-router (memory history)': 'vue-router(memory history)',
  'UIMessage data model': '<code>UIMessage</code> 数据模型',
  'Sidebar / date-grouping composables': '侧栏 / 按日期分组的 composable',
  'Server contract & wire protocol': '服务端契约与 wire 协议',
  'Nuxt UI → Lynx elements': 'Nuxt UI → Lynx 元素',
  'Streaming: SSE → poll transport': '流式:SSE → poll 传输',
  'Markdown / charts → native nodes': 'Markdown / 图表 → 原生节点',
  'Icons baked per theme': '图标按主题烘焙',
  'Overlays: portals → root host': '浮层:portal → 根宿主',
  'masto.js REST client': 'masto.js REST 客户端',
  'Content parse / sanitize pipeline': '内容解析 / 消毒管线',
  'Timeline reorder, optimistic updates': '时间线重排、乐观更新',
  'Search, cache, paginator logic': '搜索、缓存、分页逻辑',
  'Theme palette (Elk\'s own CSS vars)': '主题配色(Elk 自己的 CSS 变量)',
  'UnoCSS → scoped CSS + tokens': 'UnoCSS → scoped CSS + 令牌',
  'virtua → native <list>': 'virtua → 原生 <code>&lt;list&gt;</code>',
  'File routes → vue-router table': '文件路由 → vue-router 路由表',
  'Icons → inline SVG, color baked': '图标 → 内联 SVG,颜色烘焙',
  'OAuth → guest mode + token paste': 'OAuth → 访客模式 + 粘贴 token',
  'UI thread free for 60fps gestures': 'UI 线程空出来,做 60fps 手势',
  'Reactivity can\'t jank the scroll': '响应式卡不了滚动',
  'One bundle, no native rebuild': '一个产物,无需重编原生',
  'Batched ops, no per-node bridge': '批处理 ops,没有逐节点的桥',
  'Reads across threads are async': '跨线程读取是异步的',
  'No synchronous DOM-style measure': '没有 DOM 式的同步测量',
  'Truly-instant work → Main-Thread Script': '真正即时的活 → 主线程脚本',
  'AbortSignal.any — masto.js calls it on every request; missing on native, it broke every fetch. A 387-line polyfill fills it.': '<b><code>AbortSignal.any</code></b> —— masto.js 每次请求都调它;原生上缺失,于是<em>每一次</em> fetch 都挂了。一个 387 行的 polyfill 补上。',
  'change-case — its Unicode-property regexes crash PrimJS and abort the whole bundle. Aliased to an ASCII adapter.': '<b><code>change-case</code></b> —— 它的 Unicode 属性正则让 PrimJS 崩溃,整个 bundle 直接中止。别名指向一个 ASCII 适配器。',
  'No DOMParser · no SVG decoder · no currentColor — entity decoding, icons, and colors all rebuilt for the native runtime.': '<b>没有 DOMParser · 没有 SVG 解码器 · 没有 <code>currentColor</code></b> —— 实体解码、图标、颜色全为原生运行时重建。',
  'issuerLayer routes the same files through two loaders': '<b>issuerLayer</b> 把同一批文件送进两个 loader',
  'callLepusMethod(\'vuePatchUpdate\') — one call per reactive tick ↓': '<b>callLepusMethod(\'vuePatchUpdate\')</b> —— 每个响应式 tick 一次调用 ↓',
  'AI SDK protocol': 'AI SDK 协议',
  'streaming': '流式',
  'It\'s reallyVue.': '真的<br/>就是 Vue。',
  'From web appto native.': '从 Web 应用<br/>到原生。',
  'The Lynxplatform itself.': 'Lynx 平台<br/>本身。',
  'And we\'d loveyour help.': '也很希望你能<br/>搭把手。',
  'Not a Vue-flavored dialect. The actual Vue 3 you already write — Composition API, SFCs, the ecosystem — compiled to native.': '不是 Vue 味的方言。就是你已经在写的 Vue 3 —— Composition API、SFC、整个生态 —— 编译到原生。',
  'Not toy demos — two real, production-grade Vue apps, forked from the web and upgraded to run natively. What stays, and what changes.': '不是玩具 demo —— 两个真实的、生产级的 Vue 应用,从 Web 分叉出来、升级到原生运行。什么留下,什么改变。',
  'Chapter V': '第五章',
  'Chapter VI': '第六章',
};

// Speaker-view chrome labels.
export const SPEAKER_LABELS = {
  en: {
    view: 'Speaker view', now: 'Now', next: 'Next', notes: 'Speaker notes',
    empty: 'No notes for this slide.', prev: '‹ Prev', nextBtn: 'Next ›',
    pause: 'Pause', resume: 'Resume', reset: 'Reset',
    blackout: 'Blackout (b)', restore: 'Restore (b)', end: '— end of deck —',
    hints: '←/→ navigate · <kbd>s</kbd> from main deck toggles this view · ' +
      '<kbd>.</kbd> dark · <kbd>l</kbd> 中/EN · <kbd>b</kbd> blackout · ' +
      '<kbd>r</kbd> reset timer · <kbd>f</kbd> fullscreen',
  },
  zh: {
    view: '演讲者视图', now: '当前', next: '下一页', notes: '演讲备注',
    empty: '本页没有备注。', prev: '‹ 上一页', nextBtn: '下一页 ›',
    pause: '暂停', resume: '继续', reset: '重置',
    blackout: '黑屏 (b)', restore: '恢复 (b)', end: '— 结束 —',
    hints: '←/→ 翻页 · 主 deck 按 <kbd>s</kbd> 开关此视图 · ' +
      '<kbd>.</kbd> 深浅色 · <kbd>l</kbd> 中/EN · <kbd>b</kbd> 黑屏 · ' +
      '<kbd>r</kbd> 重置计时 · <kbd>f</kbd> 全屏',
  },
};

// Speaker notes, indexed by slide order (matches the <section.slide>
// sequence). null → keep the English source for that slide.
export const ZH_NOTES = [
  // 0 0a Logo·React
  `<p><strong>冷开场。</strong>从 React 讲起 —— 重塑了我们构建 UI 的组件模型。让它单独停一拍。</p>`,
  // 1 0b Logo·+Vue
  `<p><strong>Vue 入场。</strong>React 让到一侧,Vue 出现在旁边 —— 现代 Web 组件模型的两大基石。</p>`,
  // 2 0c Logo·+Lynx
  `<p><strong>Lynx 升起。</strong>第三个 logo 从下方升上来,把两者顶成一个三角 —— React 和 Vue 在上,Lynx 在下托着它们。这就是主张:Web 的开发体验,Native 的用户体验。</p>`,
  // 3 Cover
  `<p><strong>开场:</strong>Vue Lynx —— 一个用 Vue 3 构建原生应用的框架。</p><p>Pre-alpha,两周内一个人做出来。今天:先看有什么,简单讲讲故事,再聊为什么 Lynx 是让这一切成为可能的平台。</p><p><em>随时按 <kbd>s</kbd> 在演讲者视图之间切换。</em></p>`,
  // 4 Pitch
  `<p><strong>立框架:</strong>Vue Lynx 不是移植,而是一次品类跃迁。同一套代码,跨过桥后有三件事会变。</p><p>接下来三页逐一点名:速度、体验、能力。别停留,先把结构立起来。</p>`,
  // 5 Speed
  `<p><strong>速度。</strong>没有 DOM,没有重排税。原生渲染、原生布局、原生滚动。</p><p>这三个词会在接下来两页叠起来 —— 节奏要快。</p>`,
  // 6 Experience
  `<p><strong>体验。</strong>主线程脚本带来 60fps 的手势与滚动;原生列表虚拟化。</p>`,
  // 7 Capabilities
  `<p><strong>能力。</strong>平台暴露的每一个原生 API。</p><p>这三点接下来就是三页 demo。</p>`,
  // 8 Demo TodoMVC
  `<p><strong>速度。</strong>同样的 Composition API、同样的 <code>v-model</code>、同样的 computed 合计。输入是<em>原生</em>的,滚动是<em>原生</em>的。没有 DOM,没有重排税。</p><p><strong>现场演示:</strong>点几个 todo、勾选完成、展示输入框 —— 单帧延迟。</p>`,
  // 9 Demo Waterfall
  `<p><strong>体验,其一。</strong>双列瀑布流,滚动得就像系统 —— 因为它<em>就是</em>系统在滚。侧边自定义滚动条是主线程脚本,与滚动同步。</p><p><strong>现场演示:</strong>快速拖动;滚动条毫不迟滞地跟随。</p>`,
  // 10 Demo Swiper
  `<p><strong>体验,其二。</strong>滑动回调跑在 <strong>UI 线程</strong>上,而非 Vue 的响应式 tick —— 回调从 Vue 代码里编译出来,注册到原生侧。</p><p><strong>现场演示:</strong>慢慢拖,指示器跟手;再快速一甩,吸附到位。</p>`,
  // 11 Demo Transition
  `<p><strong>能力。</strong>你已经熟悉的 Vue —— 全都在。Composition API、SFC、插槽、provide/inject、Suspense、跑在原生合成器上的 Transition。还有生态:Pinia、Router、TanStack Query、Tailwind。</p>`,
  // 12 Ch II divider
  `<p><strong>「证明」章。</strong>demo 看着像原生 —— 现在证明它就是你的 Vue。快速翻过示例里的真实代码:语言、组件、生态、内置。节奏要快,重在覆盖面。</p>`,
  // 13 Same language
  `<p><strong>亲和 Web 就是全部意义。</strong>SFC、模板、scoped CSS —— 都一样。下一页是真实文件,再下一页映射元素词汇。</p>`,
  // 14 SFC
  `<p>一个真实的单文件组件。<code>ref</code>、<code>computed</code>、模板、tap 回调 —— 全是标准 Vue。唯一的破绽是标签名,下一页映射。</p>`,
  // 15 Vocabulary
  `<p>元素词汇是 HTML 形状的:<code>&lt;view&gt;</code>↔<code>&lt;div&gt;</code>、<code>&lt;text&gt;</code>↔<code>&lt;p&gt;</code>、<code>&lt;image&gt;</code>↔<code>&lt;img&gt;</code>,而 <code>&lt;list&gt;</code> 自带虚拟化。之后每页都是仓库里的真实代码。</p>`,
  // 16 Reactivity
  `<p>纯粹的 Vue 响应式,和 Web 逐字节一致。响应式内核正是那 882 个通过测试的一部分。</p>`,
  // 17 Options API
  `<p>不只是 Composition API —— 完整的 Options API 对象也能跑,通过插件开启。两种编程模型,一个渲染器。</p>`,
  // 18 Slots
  `<p>插槽 —— 具名、作用域、简写、fallback —— 与 Web Vue 完全一致;只是宿主换成 <code>&lt;view&gt;</code>/<code>&lt;text&gt;</code>。</p>`,
  // 19 v-model
  `<p><code>v-model</code> 编译成 <code>:modelValue</code> + <code>@update:modelValue</code>,和 Web 一样;原生输入框、组件上都能用。</p>`,
  // 20 provide/inject
  `<p>没有任何 Lynx 特有之处 —— 响应式 provide/inject 穿过中间组件,原样工作。</p>`,
  // 21 Pinia
  `<p>真正的 Pinia,原封不动。附近唯一的 Lynx 味道:<code>app.mount()</code> 不带选择器 —— 挂到原生根,而非 <code>#app</code>。</p>`,
  // 22 Router
  `<p>Vue Router 能用;唯一适配是 memory history(没有 <code>window.location</code>)。下一章每个移植应用都用它。</p>`,
  // 23 Data fetch
  `<p>TanStack Query 能在 Lynx 上跑。一个关键细节:<code>fetch</code> 要从 <code>globalThis</code> 取 —— Web 运行时包装器遮蔽了裸绑定。移植应用都用这招。</p>`,
  // 24 Suspense
  `<p>异步组件边界和 Suspense 都能用;fallback 就是 <code>&lt;view&gt;</code>/<code>&lt;text&gt;</code>。</p>`,
  // 25 Transition+KeepAlive
  `<p>Vue 的 <code>-enter-from</code>/<code>-leave-to</code> 类机制切换真实原生 CSS。<code>&lt;KeepAlive&gt;</code> 在 #153 落地 —— <code>onActivated</code>/<code>onDeactivated</code> 都在。</p>`,
  // 26 Event modifiers
  `<p>修饰符编译到 <code>@tap</code>(原生点击手势)上,驱动真实的原生冒泡控制。</p>`,
  // 27 Styling
  `<p>scoped CSS 映射到 Lynx 原生 <code>cssId</code>(不是 <code>[data-v]</code>);<code>v-bind()</code> 走 CSS 变量;flexbox 是默认布局。Tailwind 工具类直接落在原生标签上。</p>`,
  // 28 Lynx twist·list
  `<p>这里 Vue 遇上原生 primitive:<code>v-for</code> 渲染进真正虚拟化的 <code>&lt;list&gt;</code>/<code>&lt;list-item&gt;</code> —— 单元格复用,没有 DOM。这是「就是 Vue」升级成「比 Web 更好」的接缝。</p>`,
  // 29 Renders on web
  `<p>同一个产物通过 Lynx for Web 也能跑在网页上 —— 这套 deck 里每个内嵌 demo 就是这么实时跑着的。</p>`,
  // 30 Test suite
  `<p>兼容性主张由重跑 Vue 自己的测试套件(锁定 v3.5.12)背书,跑在我们的自定义渲染器上。882 通过、0 失败、131 个有记录的跳过。「就是 Vue」不是感觉 —— 是一套绿灯。</p>`,
  // 31 Ch III divider
  `<p><strong>最强的证据。</strong>两个严肃应用:一个 Nuxt AI 聊天、一个 Elk(Mastodon 客户端)。配方每次相同 —— 复用框架无关的 Vue,在原生上重建 DOM 表层。差异才是重点。</p>`,
  // 32 AI Chat intro
  `<p><strong>案例一。</strong>经典 Nuxt AI 聊天模板,跑在原生上。它甚至能离线 —— 应用内兜底后端喂历史和 mock 流,扫码即用。</p><p><strong>现场:</strong>问「波尔多天气怎样?」—— 先推理,再来一张天气卡。</p>`,
  // 33 AI Chat fork
  `<p>PORTING.md 分层表的浓缩。框架无关的一切 —— Vue、数据模型、组合式逻辑、类名词汇 —— 逐字复用。碰过 DOM/Nuxt 的,都在 Lynx primitive 上重建。</p>`,
  // 34 AI Chat streaming
  `<p>#200 的故事。原生 <code>fetch</code> 会把 SSE 响应体整个缓冲而非流式,于是应用检测平台、切到 poll 传输 —— 同服务器、同协议,<code>useChat</code> 的无缝替身,API 完全一致。</p>`,
  // 35 Elk intro
  `<p><strong>案例二 —— 有野心的那个。</strong>Elk 是真正复杂的产品。Lynx 上没有 Nuxt、没有 DOM —— 移植复用 Elk 框架无关的层,在原生元素上重建 UI。访客浏览已完全跑通。</p><p><strong>现场:</strong>滚一条时间线 —— 原生 <code>&lt;list&gt;</code> 复用;打开一条 thread。</p>`,
  // 36 Elk fork
  `<p>和 AI Chat 同一条脊梁,表层更大。API 客户端、内容管线、领域逻辑 —— 全复用。UnoCSS、DOM 虚拟滚动、Nuxt 文件路由、图标系统 —— 全在原生上重建。</p>`,
  // 37 Elk crown jewel
  `<p>移植的情感核心。Elk 的 parse/sanitize/transform 管线原样复制;曾产出 <code>&lt;p&gt;</code>/<code>&lt;a&gt;</code>/<code>&lt;picture&gt;</code> 的渲染器,现在产出 <code>&lt;text&gt;</code>/<code>&lt;image&gt;</code>,提及点击时 push vue-router 路由。</p>`,
  // 38 Elk landmines
  `<p>最诚实的一页。移植真实应用会撞见玩具里永远见不到的平台边缘。每个都是具体、有记录的修复 —— 且每次真机运行都会发现下一个。这是真实代价,而且有界。</p>`,
  // 39 Recipe
  `<p>钻进引擎盖前的收束:价值在于你的 Vue —— 那些辛苦攒下的领域逻辑 —— 原封不动地迁移。剩下的是一组有限、清楚的原生适配。那么:平台到底怎么做到的?</p>`,
  // 40 Ch IV divider
  `<p><strong>转场。</strong>故事这一章要短。“简单说说它怎么做出来的 —— 因为答案很短,而且这套方法能推广。”</p>`,
  // 41 Scale 160
  `<p><strong>规模。</strong>160 次提交、21 个活跃日、一个人。接下来两页看过程和成绩单。</p>`,
  // 42 Timeline
  `<p><strong>过程。</strong>三块地基:Vue 成熟的自定义渲染器 API、Lynx 的双线程架构、以及作为“机架”的 Claude。别陷进 harness 工程 —— 那是另一场演讲。</p>`,
  // 43 Receipts
  `<p><strong>成绩单。</strong>硬指标:1013 个上游 Vue 测试通过 882 个,<strong>零失败</strong> —— 锁定 vuejs/core v3.5.12,跑在我们自己的渲染器上,走完整 BG→ops→MT→PAPI 管线。131 个跳过都在有记录的 skiplist 里。转场:“底层地基,才让这一切成为可能。”</p>`,
  // 44 Ch V divider
  `<p><strong>为 Lynx 平台铺垫。</strong>“Vue Lynx 的上限,取决于它所站的平台。”两段论:表面亲和 Web,内核性能够硬。</p>`,
  // 45 Landscape framing
  `<p><strong>立框架。</strong>不要一层一层地给框架打分 —— 给缝打分。开着的缝是扩展点,焊死的缝是墙。我们来数谁留的缝最多。</p>`,
  // 46 Landscape map
  `<p><strong>地图。</strong>五层,从上到下。层间四条缝,每条是个是非题:EP1 能接任意前端?EP2 能换渲染模型?EP3 能加原生能力?EP4 能上新平台?</p>`,
  // 47 Web
  `<p>Web:EP1 开(任意框架),但 EP2/EP3 被沙箱封死;EP4 只算半开 —— 你拿到的是浏览器,不是底层。</p>`,
  // 48 React Native
  `<p>RN:EP3 开(Native Module),但 Metro 只认 React(EP1 半开),换渲染要 fork(EP2 半开),新端逐个适配(EP4 半开)。</p>`,
  // 49 Flutter
  `<p>Flutter:EP3/EP4 开(自渲染 + embedder),但 EP1 焊死在 Dart,EP2 半开(引擎固定)。</p>`,
  // 50 NativeScript
  `<p>NativeScript:EP3 开(直连原生,无需桥),但 EP2/EP4 焊死,EP1 半开(并不真的是 Web)。</p>`,
  // 51 Lynx answer
  `<p><strong>答案。</strong>EP1:Rspack 框架无关 → React/Vue/Svelte + 真 CSS。EP2:引擎适配各端 primitive,也能自渲染。EP3:Native Module。EP4:桌面已落地,TV/VR/穿戴已用自渲染跑通。四条缝,一条不焊。</p>`,
  // 52 Payoff
  `<p><strong>收束。</strong>正因为没有一条缝焊死,Vue 才能插进 EP1、驱动整个栈。Web 开发体验 + 原生用户体验。这正是 Vue Lynx 能成立的原因。</p>`,
  // 53 Arch headline
  `<p><strong>架构的点睛之笔。</strong>两条线程,都在你的产物里、都可编程。看它在接下来两页里搭起来。</p>`,
  // 54 Arch BG solo
  `<p>Vue 运行时 —— 响应式、diff、生命周期、事件处理 —— 都住在<strong>后台</strong>线程。下一页:主线程落到它旁边。</p>`,
  // 55 Arch both
  `<p>它们通过一段扁平的 <em>ops</em> 缓冲通信,按 Vue 的 tick 批处理。<strong>热路径上没有 JS 桥</strong> —— 这就是为什么响应式在干活、手势还能稳在 60fps。对 RN 的同学:Lynx 没有桥,两条线程<em>就是</em>你的产物。</p>`,
  // 56 Build headline
  `<p><strong>编译期的故事。</strong>看它搭起来。点睛在于复用:Vue Lynx 没另写工具链 —— 它站在 Lynx 的 rspeedy 插件和 React Lynx 的 worklet transform 上。</p>`,
  // 57 Build src
  `<p>从输入开始:你普通的 Vue 应用,一个入口。</p>`,
  // 58 Build plugin
  `<p>复用那一行。<code>pluginVueLynx</code> = 官方 <code>@rsbuild/plugin-vue</code> 编 SFC + 一层薄薄的 Lynx 适配。MTS 抽取直接调 React Lynx 的 SWC transform;worklet 运行时就是 <code>require.resolve(&#39;@lynx-js/react/worklet-runtime&#39;)</code>。</p>`,
  // 59 Build split
  `<p>两个 layer 都导入<em>同一份</em>用户代码;layer 决定 loader。BG 走 JS worklet pass;MT 走 LEPUS pass,只留 <code>registerWorkletInternal()</code>。这就是一个 <code>&#39;main thread&#39;</code> 函数如何正确落到两侧。</p>`,
  // 60 Build merge
  `<p>Lynx 的 template/encode webpack 插件(复用,非重写)把两个 entry 打成一个 bundle,并打标记让编码器当普通 Lynx bundle 对待。发一个文件;跑两个程序。</p>`,
  // 61 Build code
  `<p>真正的拆分,约 14 行。最后那行注释就是整个复用主张:worklet 运行时是 React Lynx 的,resolve 出来原样打包。</p>`,
  // 62 Runtime headline
  `<p><strong>运行期的故事。</strong>接下来搭这条链:nodeOps → 影子树 → ops → 总线 → applyOps → Element PAPI → 原生。这就是手势为何稳:Vue 的活和 UI 线程的活被一段缓冲解耦。</p>`,
  // 63 Runtime renderer
  `<p>Vue 的 <code>createRenderer(nodeOps)</code> —— 和 React Native 等用同一个扩展点。<code>nodeOps</code> 是 Vue→Lynx 适配器,核心所在。</p>`,
  // 64 Runtime shadow+ops
  `<p>影子树让 Vue 能同步调 <code>parentNode()</code>/<code>nextSibling()</code>;真实元素只在主线程。每个节点只持有一个 <code>id</code> —— 跨线程句柄。ops 是扁平、可 JSON 序列化的数组,按 id 索引。</p>`,
  // 65 Runtime bus
  `<p>批处理是性能关键:<code>scheduleFlush</code> 搭 Vue 的 post-flush 队列,于是一整个 tick 的改动合成一次 <code>callLepusMethod</code>。热路径上没有逐 op 的桥接闲聊。</p>`,
  // 66 Runtime PAPI
  `<p>Element PAPI 是 Lynx 底层的元素接口 —— React Lynx 瞄准的也是它。每批一次提交。事件反向流动:按 <code>sign</code> 注册,投递回 BG 处理器。</p>`,
  // 67 Runtime code
  `<p>整个面很小 —— <code>createElement</code>、<code>insert</code>、<code>patchProp</code>、<code>remove</code>、<code>setElementText</code>,加几个树遍历。主线程上,<code>OP.CREATE</code> → <code>__CreateView</code>;每批以 <code>__FlushElementTree()</code> 收尾。</p>`,
  // 68 Trade-off
  `<p>诚实的权衡。那段让手势顺滑的缓冲,也意味着你不能从后台线程同步读布局 —— 要么 await,要么把热代码作为 worklet 丢到主线程。和 React Lynx 同一笔交易;划算。</p>`,
  // 69 Combine
  `<p><strong>标题句。</strong>Vue × Lynx = Vue 跑在原生上。停顿一下,让这个等式落地。然后:“也很希望大家来一起把它做成。”</p>`,
  // 70 Ch VI divider
  `<p><strong>转向请求。</strong>项目是真的,但需要社区。架构很稳;Vue 的表面积很大。</p>`,
  // 71 Ask
  `<p>落在这句上 —— <em>“原生,不该是另一个团队的事。”</em>这是你想让他们记住的一句。</p>`,
  // 72 Where it stands
  `<p>左边 = 今天就能用、可用于生产探索的。右边 = 贡献者能发力的地方。</p>`,
  // 73 Try
  `<p><strong>行动号召。</strong>一行命令 —— <code>npm create vue-lynx@latest</code>。“给 Agent”按钮会复制一段引导 prompt。承诺:“今晚回家的公交上,你就能让一个 Vue 应用跑在 iPhone 上。”</p>`,
  // 74 Thank you
  `<p><strong>收尾。</strong>感谢,邀请提问,停在这页做 Q&amp;A。</p><p>“能上生产吗?” —— pre-alpha,架构稳,已覆盖的部分测试充分。“Android?” —— Lynx 跨平台,同一产物两端都跑。</p>`,
];
