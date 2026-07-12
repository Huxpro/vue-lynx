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
};
