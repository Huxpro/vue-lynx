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

  // ---- Chapter I · The gap ----
  'IV · The landscape': 'IV · 格局',
  'IV · The landscape · the map': 'IV · 格局 · 地图',
  'IV · The landscape · the answer': 'IV · 格局 · 答案',
  'Zoom out: every stack is layers — and seams.':
    '拉远看:每个技术栈都是<span class="brand-text">层</span> —— 与缝。',
  'self-rendered': '自渲染',
  'Dart — wrong language': 'Dart',
  'native UI': '原生 UI',
  'bound to React — wrong model': '绑定 React',
  'plugs in — model half-survives': '接得上',
  'layout ≠ Web': '布局 ≠ Web',
  'no Web — low ROI': '不含 Web',
  'not native enough': '不够 Native',
  'out-of-tree': '树外维护',
  'open — an extension point': '<i></i>开',
  'half-open': '<i class="part"></i>半开',
  'welded shut': '<i class="seal"></i>焊死',
  'Web — the DX everyone wants. But the sandbox caps how native it can ever feel.':
    '<b style="color:#4FB8F0">Web</b> —— 人人都想要的开发体验。但沙箱封死了它的原生上限。',
  'Ionic — the Web in a shell. Not native enough.':
    '<b style="color:#6FA8FF">Ionic</b> —— 套壳里的 Web。不够 <em>Native</em>。',
  'NativeScript — direct native access. Not Web enough.':
    '<b style="color:#E8B44A">NativeScript</b> —— 最直接的原生访问。不够 <em>Web</em>。',
  'Flutter — Dart plus self-rendering. A parallel universe.':
    '<b style="color:#F27A9E">Flutter</b> —— Dart + 自渲染。一个平行宇宙。',
  'React Native — closest to the dream. But the frontend seam is React-only.':
    '<b style="color:#9E86F0">React Native</b> —— 离梦想最近。但前端那条缝,只对 React 开。',
  'Lynx — all four seams open. Exactly the door Vue was waiting for.':
    '<b class="brand-text">Lynx</b> —— 四条缝全开。正是 Vue 在等的那扇门。',
  'Lynx evolved framework-agnostic.':
    'Lynx 被演进为<span class="brand-text">框架无关</span>。',
  'Web DX. Native UX.':
    '<span style="color:#4FB8F0">Web</span> 的开发体验。<br/><span class="brand-text">Native</span> 的用户体验。',

  // ---- Chapter II · The proof ----
  'Chapter II': '第二章',
  'So, how far does it go?': '那,它到底<br/>做到哪一步了?',
  'A feast of live demos — every phone in this deck is a real Vue Lynx app, running right now.':
    '一桌丰盛的现场 demo —— 这套 deck 里的每台手机,都是一个此刻正在运行的 Vue Lynx 应用。',
  'II · The proof': 'II · 完成度',
  'upstream Vue core tests, passing on our renderer.':
    '来自 Vue core 上游的测试,在我们的渲染器上直接通过。',

  // ---- API coverage ----
  'II · Vue coverage · 1/12': 'II · Vue 覆盖度 · 1/12',
  'II · Vue coverage · 2/12': 'II · Vue 覆盖度 · 2/12',
  'II · Vue coverage · 3/12': 'II · Vue 覆盖度 · 3/12',
  'II · Vue coverage · 4/12': 'II · Vue 覆盖度 · 4/12',
  'II · Vue coverage · 5/12': 'II · Vue 覆盖度 · 5/12',
  'II · Vue coverage · 6/12': 'II · Vue 覆盖度 · 6/12',
  'II · Vue coverage · 7/12': 'II · Vue 覆盖度 · 7/12',
  'II · Vue coverage · 8/12': 'II · Vue 覆盖度 · 8/12',
  'II · Vue coverage · 9/12': 'II · Vue 覆盖度 · 9/12',
  'II · Vue coverage · 10/12': 'II · Vue 覆盖度 · 10/12',
  'II · Vue coverage · 11/12': 'II · Vue 覆盖度 · 11/12',
  'II · Vue coverage · 12/12': 'II · Vue 覆盖度 · 12/12',
  'v-once / v-memo':
    '<code class="brand-text">v-once</code> / <code class="brand-text">v-memo</code>',
  'reactive() + composables':
    '<code class="brand-text">reactive()</code> + 组合式函数',
  'Event modifiers': '事件<span class="brand-text">修饰符</span>',
  'CSS features': '<span class="brand-text">CSS</span> 特性',

  // ---- Ecosystem ----
  'The ecosystem, as-is.': '生态,<span class="brand-text">原样</span>可用。',
  'Pinia, Vue Router, TanStack Query, Tailwind — the libraries you\'d already reach for on the web, running unchanged.':
    'Pinia、Vue Router、TanStack Query、Tailwind —— 你在 Web 上已经会用的库,原封不动就能跑。',
  'II · Ecosystem · 1/4': 'II · 生态 · 1/4',
  'II · Ecosystem · 2/4': 'II · 生态 · 2/4',
  'II · Ecosystem · 3/4': 'II · 生态 · 3/4',
  'II · Ecosystem · 4/4': 'II · 生态 · 4/4',

  // ---- Whole apps ----
  'II · Whole apps': 'II · 完整应用',
  'Whole apps port, too.': '整个<span class="brand-text">应用</span>,也搬得动。',
  'The classic, verbatim — reactive state, v-model, computed totals. On a native input and native scroll.':
    '经典原样照搬 —— 响应式状态、<code>v-model</code>、computed 合计。跑在原生输入框、原生滚动上。',
  'Live API, infinite feed, comment trees — Vue Query for data, Tailwind for styling, native <list> for scroll.':
    '真实 API、无限流、评论树 —— 数据用 Vue Query,样式用 Tailwind,滚动用原生 <code>&lt;list&gt;</code>。',
  'And the same bundles run on the Web.':
    '而且,同一份产物还能跑回 <span class="brand-text">Web</span>。',
  'Every phone in this deck is Lynx for Web — the same bundle that runs natively, rendering in your browser right now.':
    'deck 里的每台手机都是 Lynx for Web —— 和原生端同一份产物,此刻就渲染在你的浏览器里。',
  'native <input>': '原生 &lt;input&gt;',
  'native <list>': '原生 &lt;list&gt;',

  // ---- Chapter III · The upgrade ----
  'Chapter III': '第三章',
  'Apps, upgrading from Web to native.':
    'App,从 Web <em style="font-family:var(--serif);font-weight:400">升级</em>到原生。',
  "Progressive enhancement: keep the codebase you have — gain the platform you don't.":
    '渐进增强:留住你已有的代码,得到你还没有的平台。',
  'III · Case 1 · AI Chat': 'III · 案例一 · AI Chat',
  'The Nuxt AI Chatbot, forked.':
    'Nuxt 官方 AI Chatbot,<span class="brand-text">fork</span> 过来。',
  'AI SDK streaming': 'AI SDK 流式',
  'reasoning': '思维链',
  'tool cards': '工具卡片',
  'theming': '主题系统',
  'Everything above came across unchanged.': '上面这些,原封不动地搬了过来。',
  'Then it went native.': '然后,它<span class="brand-text">原生</span>了。',
  'The keyboard slides in — the thread glides up with it. Hit send — the bubble flies from the prompt box into the conversation.':
    '键盘升起 —— 对话跟着一起上滑。按下发送 —— 气泡从输入框飞进对话流。',
  'keyboard avoidance': '键盘回避',
  'send motion': '发送动效',
  'MTS pressables': 'MTS 按压反馈',
  'One native event. One setNativeProps. No viewport hacks.':
    '一个原生事件,一次 <code>setNativeProps</code>。没有任何视口 hack。',
  "Send isn't an animation — it's a handoff, choreographed in frames.":
    '发送不是一段动画 —— 是一次按显示帧编排的<em>接力</em>。',
  'earlier turns stay masked until the motion starts':
    '动画启动之前,先前的对话保持遮蔽',
  'III · Case 2 · Elk': 'III · 案例二 · Elk',
  'Elk — a production-scale fork.':
    'Elk —— 一次<span class="brand-text">生产级规模</span>的 fork。',
  'masto.js client': 'masto.js 客户端',
  'content pipeline': '内容管线',
  'theme system': '主题系统',
  'domain logic': '领域逻辑',
  "Elk's framework-agnostic layers, reused. Only the UI was rebuilt.":
    'Elk 与框架无关的那些层,全部复用 —— 只重建了 UI。',
  'Native gestures, for free-ish.':
    '原生<span class="brand-text">手势</span>,几乎白拿。',
  'Infinite timelines on the native <list>. A bottom sheet with rubber-banding and fling — every frame on the UI thread.':
    '无限时间线跑在原生 <code>&lt;list&gt;</code> 上。底部抽屉带橡皮筋回弹与甩动惯性 —— 每一帧都在 UI 线程。',
  'MTS bottom sheet': 'MTS 底部抽屉',
  'next: view pager': '下一步:view pager',
  'native view pager': '原生 view pager',

  // ---- Chapter III · case-study additions (recordings + mocks) ----
  'The layout follows the keyboard.':
    '布局<span class="brand-text">跟随</span>键盘。',
  'The composer rides the keyboard; the current turn stays readable.':
    '输入框贴着键盘走;当前轮次保持可读。',
  'First send. Then the real test.':
    '第一次发送,然后是<span class="brand-text">真正的考验。</span>',
  'First send — the bubble leaves the composer and settles into its anchor.':
    '<b>First send</b> —— 气泡离开输入框,落到锚点。',
  'Second send — the old turn holds steady while the new one travels to the top.':
    '<b>Second send</b> —— 旧轮次保持稳定,新一轮移动到顶部。',
  'Tabs on a native view pager.':
    '标签页跑在<span class="brand-text">原生 view pager</span> 上。',
  'Panes swipe with a native snap; content & scroll position are retained across swipes.':
    '分屏以原生吸附滑动;内容与滚动位置在滑动间保留。',

  // ---- Chapter III · restored original case slides ----
  'A polished send is a handoff.':
    '一次漂亮的发送,是一次<span class="brand-text">交接</span>。',
  'Not one animation — a handoff between the composer, the list, the keyboard, and the stream.':
    '不是一个动画 —— 而是输入框、列表、键盘与流式响应之间的一次交接。',
  'First send — the bubble leaves the composer, settles into its anchor, and makes room for the response.':
    'First send —— 气泡离开输入框,落到锚点,并为响应腾出空间。',
  'streaming + tools': '流式 + 工具',
  '65 features ported': '移植 65 项特性',
  'The keyboard is part of layout.':
    '键盘也是<span class="brand-text">布局</span>的一部分。',
  'The composer tracks the keyboard; the current turn stays readable.':
    '输入框跟随键盘;当前轮次保持可读。',
  'A new turn belongs at the top.':
    '新一轮消息该在<span class="brand-text">顶部</span>。',
  'Second send — the old turn stays stable while the new bubble travels to the top anchor.':
    'Second send —— 旧轮次保持稳定,新气泡移动到顶部锚点。',
  'A real Nuxt app, rebuilt on native.':
    '一个真实的 Nuxt 应用,<span class="brand-text">在原生上重建。</span>',
  'components': '组件',
  'pages': '页面',
  'composables': 'composable',
  'No Nuxt, no DOM — so instead of forking, the port reuses Elk\'s framework-agnostic layers and rebuilds the UI on Lynx elements.':
    '没有 Nuxt,没有 DOM —— 于是不去 fork,而是<strong>复用 Elk 与框架无关的层</strong>,在 Lynx 元素上重建 UI。',
  'masto.js reused': 'masto.js 复用',
  'content-render retargeted': 'content-render 改目标',

  // ---- Chapter III · Elk draggable sheet ----
  'III · Case 2 · Elk · draggable sheet': 'III · 案例二 · Elk · 可拖拽 sheet',
  'One sheet, three owners.': '一个 sheet,<span class="brand-text">三个归属者。</span>',
  'Three owners, in code.': '三个归属者,<span class="brand-text">用代码讲。</span>',
  "The drag runs on the main thread — so even while Vue's background thread fetches, diffs, or rebuilds the list, the sheet still tracks the finger. On the web, gesture JS and render share one thread.":
    '拖拽跑在主线程上 —— 于是即便 Vue 的后台线程正在请求数据、diff 或重建列表,sheet 依然跟手。<span class="dim">在 Web 上,手势 JS 与渲染共享同一条主线程。</span>',

  // ---- Chapter III · Elk collapsing profile ----
  'III · Case 2 · Elk · collapsing profile': 'III · 案例二 · Elk · 折叠 profile',
  'An X-grade profile, composed.': 'X 级折叠 profile,<span class="brand-text">组合而成。</span>',
  'Collapse the header, pin the tabs, page sideways — each pane keeps its own feed & scroll position.':
    '折叠头部、吸顶 tab、横向翻页 —— 每个 pane 各自保留自己的信息流与滚动位置。',
  'native scroll thread': '原生滚动线程',
  'one SFC · native + web preview': '一个 SFC · 原生 + Web 预览',

  'Main-Thread Script': '<b>主线程脚本</b>',

  // ---- Chapter IV · How we did it ----
  'Chapter IV': '第四章',
  'And how was this built?': '那,它是<br/>怎么被做出来的?',
  'Three adaptations — the runtime, the toolchain, the main thread — and an AI harness running through all of them.':
    '三次适配 —— 运行时、工具链、主线程 —— 以及一路贯穿其中的 AI harness。',
  'IV · Runtime': 'IV · 运行时',
  'IV · Runtime · proof': 'IV · 运行时 · 实证',
  'IV · Toolchain': 'IV · 工具链',
  'IV · Main-Thread Script': 'IV · 主线程脚本',
  'IV · The harness': 'IV · Harness',
  'Background thread': '<i></i>后台线程',
  'Main (UI) thread': '<i></i>主(UI)线程',
  'Vue runs whole — on the background thread.':
    'Vue <em>整个</em>跑在后台线程上。',
  'createRenderer() — a renderer, not a fork.':
    '<code>createRenderer()</code> —— 写一个渲染器,而不是 fork 一个 Vue。',
  'Updates leave as a flat ops buffer — once per tick.':
    '更新以<b style="color:#4FB8F0">扁平 ops 缓冲</b>的形式离开 —— 每个 tick 一次。',
  'The main thread replays them — native elements appear.':
    '主线程把它们<b style="color:#F27A9E">重放</b>出来 —— 原生元素出现。',
  'Events ride back up — handlers never leave Vue.':
    '事件坐车<b style="color:#3deae7">回来</b> —— 回调从未离开过 Vue。',
  'The threading leaks into your code in exactly one place.':
    '双线程漏进你代码里的,只有<em>一个</em>地方。',
  'one lap = nextTick()': '绕一圈 = <b>nextTick()</b>',
  "Vue core's own tests, replayed on our renderer. 0 fail.":
    'Vue core 自己的测试,在我们的渲染器上重放。<b>0 失败。</b>',
  "…and the tests are the AI's eyes.":
    '……而这些测试,就是 <span class="brand-text">AI 的眼睛</span>。',

  // ---- IV · Instant First-Frame Rendering + Element Templates ----
  'IV · Instant first frame': 'IV · 首屏直出',
  'IV · Instant first frame · proof': 'IV · 首屏直出 · 佐证',
  // headlines
  'Both threads render. The ops stream is the recording.':
    '两条线程都渲染。那条 ops 流<span class="brand-text">就是</span>录制。',
  'IFR changes when the frame renders. Element Templates change how much work it does.':
    'IFR 改变的是<em class="ifr-em">何时</em>渲染这一帧。<br/><span class="brand-text">Element Templates</span> 改变的是这一帧要做多少活。',
  // leads
  'Without IFR, the first paint waits a whole lap — BG boot, render, the ops send — all before anything appears.':
    '没有 IFR,首帧要等<em>整整一圈</em> —— 后台启动、渲染、送 ops —— 全部跑完才有画面。',
  'IFR puts the whole runtime in the main-thread bundle — it renders during loadTemplate, so paint lands first and the background boots alongside.':
    'IFR 把整个运行时放进<b style="color:#56b8f0">主线程</b>产物 —— 它在 <code>loadTemplate</code> 期间渲染,于是<b>先出画面</b>,后台在一旁并行启动。',
  "The MT render records its ops; the BG's first batches hydrate against them. Correctness never depends on the two matching — deterministic ids & vue:N signs route taps to Vue with no rebinding.":
    '主线程渲染时录下自己的 ops;后台最初的几批拿去和它水合对账。正确性从不依赖两者一致 —— 确定性 id 与 <code>vue:N</code> 签名让点击无需重绑就路由回 Vue。',
  'Normally every static element pays the whole chain — a vnode, a shadow node, ops frames, a thread crossing, an interpreter dispatch.':
    '常规下每个静态元素都要付整条链 —— 一个 vnode、一个影子节点、若干 ops 帧、一次跨线程、一次解释器分发。',
  'The compiler lowers the static subtree to one create() function. Vue sends one op; only the dynamic holes travel after.':
    '编译器把静态子树下沉成一个 <code>create()</code> 函数。Vue 只发<b>一个</b> op;之后只有动态空洞在传输。',
  'Static structure bakes into a create() skeleton; only the holes — dynamic text, class, style, attrs — stay on the vnode path.':
    '静态结构烘焙进 <code>create()</code> 骨架;只有空洞 —— 动态的文本、class、style、属性 —— 留在 vnode 路径上。',
  'FCP over a real Web Worker + IPC (Lynx for Web): −12% to −19% at 1k–5k — but not a constant. Plain IFR reverses past ~10k rows; IFR + ET holds the win across scale.':
    'FCP:跨真实 Web Worker + IPC(Lynx for Web)—— 在 1k–5k 时 −12% 到 −19%,但这不是常数。纯 IFR 过了约 10k 行会反转;<b class="brand-text">IFR + ET</b> 才能在各种规模上守住优势。',
  'Element Templates shrink the recorded ops payload 3–1000× — and that protocol shrink helps every update, not just the first frame.':
    'Element Templates 把录制的 ops 负载缩小 3–1000× —— 这份协议瘦身惠及每一次更新,不只是首帧。',
  'A tool, not a default-on switch — but for content-first screens, IFR + ET is the recommended setup.':
    '它是一件工具,不是默认打开的开关 —— 但对内容优先的屏幕,<b class="brand-text">IFR + ET</b> 是推荐配置。',
  // flow-center labels
  '× every static node': '× 每个静态节点',
  'holes update via ordinary SET_* ops': '空洞照走普通 <b>SET_*</b> ops 更新',
  // chart titles
  'render cost ~1,000 el · jitless · ms': '渲染开销 <span>~1,000 元素 · jitless · ms</span>',
  'recorded ops payload 1,400-el static screen': '录制的 ops 负载 <span>1,400 元素静态屏</span>',
  // chip
  'recommended': '推荐',
  // trade-off columns
  'what it costs': '有什么代价',
  'when to reach for it': '什么时候用它',
  'MT bundle carries the runtime + app — ~2.26× gzip':
    '主线程产物带上运行时 + 应用 —— gzip <b>~2.26×</b>',
  'App evaluates on both threads — serial TTI +35%':
    '应用在<b>两条</b>线程都求值 —— 串行 TTI +35%',
  "Can't accelerate a fetch-first screen":
    '无法加速<b>请求优先</b>的屏幕',
  'Content-first screens with sync initial data':
    '带同步初始数据的<b>内容优先</b>屏幕',
  'Render a real skeleton if data is async':
    '数据异步时,先渲染一个真实<b>骨架</b>',
  'Keep first-screen render deterministic & thread-agnostic':
    '让首屏渲染保持<b>确定性</b>、与线程无关',

  'One file ships both threads.': '一个文件,装下<em>两条</em>线程。',
  'The same code enters twice — webpack layers route it.':
    '同一份代码,进两次 —— webpack layers 负责分流。',
  'We wrote a plugin — not a compiler.':
    '我们写的是一个<span class="brand-text">插件</span> —— 不是编译器。',
  "Your CSS isn't translated. It's just CSS.":
    '你的 CSS 没有被翻译。它就是 <b style="color:#F27A9E">CSS</b>。',
  '2 crossings behind your finger':
    '你的手指背后,是 <b style="color:#F27A9E">2</b> 次跨线程',
  'The dual-thread cost: gestures wait for the round trip.':
    '双线程的<em>代价</em>:手势要等一个来回。',
  '0 crossings — it runs where events fire':
    '<b>0</b> 次跨线程 —— 它就跑在事件发生的地方',
  'One directive. The function changes threads.':
    '一行指令。函数<em>换了线程</em>。',
  'Still a .vue file. Still ref-shaped. Zero-latency.':
    '仍然是 <code>.vue</code> 文件,仍然是 <code>ref</code> 的形状。零延迟。',
  "ReactLynx's tutorials, remade in Vue.":
    'ReactLynx 的官方教程,<span class="brand-text">用 Vue 重做了一遍</span>。',
  "Lynx's two official MTS tutorials — the gallery scrollbar and this swiper — rebuilt line-for-line on Vue Lynx.":
    'Lynx 的两个官方 MTS 教程 —— gallery 滚动条和这个 swiper —— 在 Vue Lynx 上逐行重建。',
  'tutorial: swiper': '教程:swiper',
  'tutorial: gallery': '教程:gallery',
  'Same worklet engine as ReactLynx — today.':
    '与 ReactLynx <em style="font-family:var(--serif);font-weight:400">同一套</em> worklet 引擎 —— 这是今天。',
  'A Vue-flavored MTS API is the open design space.':
    '而 Vue 味的 MTS API,是留给未来的设计空间。',
  '2 weeks.': '<span class="brand-text">2</span> 周。',
  '160 commits': '160 次提交',
  '21 active days': '21 个活跃日',
  '1 human + Claude': '1 个人 + Claude',
  'The full write-up — harness, prompts, receipts. @Huxpro on X.':
    '完整复盘 —— harness、prompt、全部凭证。X 上的 <b>@Huxpro</b>。',
  'Chapter V': '第五章',

  // ---- Combine ----
  'A new path': '一条新路',
  'Vue, on native.': 'Vue,<span class="brand-text">跑在原生上。</span>',

  // ---- Close ----
  'Chapter IV': '第四章',
  "And we'd love your help.": '也很希望你能<br/>搭把手。',
  "Vue Lynx is pre-alpha. The architecture is solid; Vue's API surface is large. What ships next depends on who shows up.":
    'Vue Lynx 还是 pre-alpha。架构很稳;Vue 的 API 面很大。接下来能做出什么,取决于谁愿意来。',
  'The ask': '我们的请求',
  "Native shouldn't be a different team.":
    '原生,不该是另一个<span class="brand-text">团队</span>的事。',
  'Vue developers should ship native apps as naturally as they ship for the web today.':
    'Vue 开发者应该能像今天发 Web 一样,自然地发原生应用。',
  'Where it stands': '现状',
  "What's there": '已经有的',
  "What's open": '还缺的',
  'Composition API & SFCs': '<b>Composition API 与 SFC</b>',
  'Transition, Suspense, KeepAlive, Teleport': '<b>Transition、Suspense、KeepAlive、Teleport</b>',
  'Pinia, Router, Query, Tailwind': '<b>Pinia、Router、Query、Tailwind</b>',
  'Main-Thread Script': '<b>Main-Thread Script</b>',
  'View pager & more gestures': '<b>View pager 与更多手势</b>',
  'Vue DevTools integration': '<b>Vue DevTools 集成</b>',
  "The ecosystem you'd port": '<b>等你来移植的生态</b>',
  'Try it tonight': '今晚就试',
  "One npm create, and you're shipping native.":
    '一行 <span class="brand-text">npm create</span>,你就在发原生了。',
  'for Agent': '给 Agent',
  'Quick Start →': '快速开始 →',
  'Read the intro': '读简介',
  'Fin.': '完。',
  'Thank you.': '<span class="brand-text">谢</span>谢。',
  'Questions, PRs, opinions — all welcome.': '提问、PR、想法 —— 都欢迎。',

  // ---- Epilogue · the elephant / fabrics ----
  'Epilogue': '终章',
  'The elephant in the room.': '聊聊房间里的<br/>大象。',
  '“Vibe coding” is barely eighteen months old — and it already writes native apps. So why frameworks? Why Lynx? Why any of this?':
    '"vibe coding" 这个词诞生至今不过一年半 —— 它已经能直接写出原生应用了。那,还要框架干嘛?还要 Lynx 干嘛?这一切还有什么意义?',
  'Epilogue · the question': '终章 · 问题',
  'Does AI obsolete all of us?':
    'AI 会让<span class="brand-text">我们所有人</span>都过时吗?',
  'no frameworks?': '不要框架?',
  'no libraries?': '不要类库?',
  'no docs?': '不要文档?',
  'no us?': '不要我们?',
  'Epilogue · a claim': '终章 · 一个论断',
  'What survives AI?':
    '什么能在 AI 之后<span class="brand-text">留下来</span>?',
  'infrastructure': '基础设施',
  'enablers': '使能者',
  'platforms': '平台',
  'ecosystems': '生态',
  'people': '人',
  'Two lemmas, then an answer.': '两个引理,一个答案。',
  'Epilogue · Lemma 1': '终章 · 引理一',
  'The stack, rewritten.': '技术栈,被重写了。',
  'Epilogue · Lemma 1 · harness': '终章 · 引理一 · Harness',
  'AI can do anything — harnessed.':
    'AI 什么都能做 —— 只要有好的 <span class="brand-text">harness</span>。',
  'context docs · priors · AGENTS.md': '上下文 <small>文档 · 先验 · AGENTS.md</small>',
  'tools functions · capabilities': '工具 <small>函数 · 能力</small>',
  'environment runtime · sandbox': '环境 <small>运行时 · 沙箱</small>',
  'feedback render · tests · logs': '反馈 <small>渲染 · 测试 · 日志</small>',
  'Epilogue · Lemma 1 · platforms': '终章 · 引理一 · 平台',
  'Nobody says AI will replace the browser.':
    '没人会说,AI 要取代<span style="color:#4FB8F0">浏览器</span>。',
  'open by default': '天生开放',
  'sandboxed': '天然沙箱',
  'endlessly capable': '能力无穷',
  'fully observable': '完全可观测',
  'Epilogue · Lemma 1 · frameworks': '终章 · 引理一 · 框架',
  'Frameworks were always harnesses.':
    '框架,从来都是 <span class="brand-text">harness</span>。',
  'then architecting how humans reason': '过去 <small>规训人类如何推理</small>',
  'now steering what models emit': '现在 <small>引导模型吐出什么</small>',
  'Every technology is a fabric.': '每一种技术,都是一种织物。',
  'Vue — a weave you can feel.': 'Vue —— 一种你能触到的织法。',
  'templates': '模板',
  'reactivity': '响应式',
  'mutable state': '可变状态',
  'Epilogue · intermission': '终章 · 幕间',
  '“Getting metaphysical again — 雪碧 is going to roast me.”':
    '"又开始形而上了 —— 雪碧又要批评我了。"',
  'Lynx — the loom.': 'Lynx —— 织机。',
  'Epilogue · Lemma 2': '终章 · 引理二',
  '“A patchwork monster”? Exactly.':
    '"缝合怪"?—— <span class="brand-text">正是。</span>',
  'web-friendly surface': 'Web 亲和的表面',
  'strong native core': '扎实的原生内核',
  'hybrid rendering': '混合渲染',
  'Frameworks compress the search space.': '框架,压缩了搜索空间。',
  'everything the model could emit': '模型可能吐出的一切',
  'the idiom': '惯用法',
  'Epilogue · Lemma 2 · people': '终章 · 引理二 · 人',
  'Technology is nothing without its people.':
    '技术若没有<span class="brand-text">人</span>,什么都不是。',
  '3D prints · 小音': '帮忙 3D 打印 · 小音',
  'a dinner in Fuzhou · 雪碧': '上一顿饭在福州 · 雪碧',
  'Poland, then here · Nector': '上一面在波兰 · Nector',
  'Evan · Anthony · you': 'Evan · Anthony · 还有你',
  "Vue Lynx isn't a framework. It's a connection.":
    'Vue Lynx 不是一个框架,而是一次<span class="brand-text">连接</span>。',
  'Epilogue · Lemma 2 · compounding': '终章 · 引理二 · 复利',
  'One connection compounds.':
    '一次连接,产生<span class="brand-text">复利</span>。',
  'Rendering': '渲染',
  'Agents': '智能体',
  'native': '原生元件',
  'custom': '自渲染',
  'hybrid': '混合',
  "AI doesn't need mature libraries. It needs a place to vibe.":
    'AI 要的不是成熟的类库,而是一个能 <span class="brand-text">vibe</span> 的地方。',
  'The Web was that place. Lynx carries it to native.':
    'Web 曾经就是那个地方。Lynx 把它带到原生。',
  'Vapor on Lynx — no VDOM. Straight to ops.':
    'Vapor on Lynx —— 没有 VDOM,直达 <b style="color:#4FB8F0">ops</b>。',
  'A cradle for framework design.':
    '框架设计的<span class="brand-text">摇篮</span>。',
  'A team that loves the Web — and dares to break it.':
    '一支深爱 Web、也敢于打破 Web 的团队。',
  'Weave the whole Web…': '把整个 Web 织进来……',
  '…into every platform.': '……再织向每一个平台。',
  'more…': '<i></i> 更多……',
  'Epilogue · coda': '终章 · 尾声',
  '“AI took away the fun.”': '"AI 把乐趣拿走了。"',
  '— a workshop attendee · Germany, last week': '—— 一位 workshop 学员 · 上周,德国',
  'Find a new dopamine.': '去找新的多巴胺。',
  'The frontend is dead. Again.': '前端,确实又死了。',
  '“But prompting is the dopamine.”': '"可 prompt 本身,就是多巴胺。"',
  '— another attendee · he vibed a Pokémon game that night':
    '—— 另一位学员 · 他当晚 vibe 出了一个宝可梦',
  "I know AI makes it easy. I'm glad it's easy — I haven't been this excited in years.":
    '我知道有 AI 这不难。我很高兴这不难 —— 我好久没这么兴奋过了。',
  'I rebuilt everything ten-years-ago me dreamed of.':
    '我把 <span class="brand-text">10 年前的自己</span>想做的东西,全部翻新了一遍。',
  'hux.pro — untouched for 10 years': 'hux.pro —— 十年没动过',
  'my first Vue app — v0.12': '我的第一个 Vue 应用 —— v0.12',
  'this deck — zero libraries, vibed': '这套 deck —— 零依赖,纯 vibe',
  'I just changed languages — to natural language.':
    '我只是又换了一门语言 —— <span class="brand-text">自然语言</span>。',
  "I'm still doing frontend.": '可我做的,还是前端。',
  'Fin. — for real': '终 · 这次是真的',
  'The frontend is dead.': '前端已死。',
  'Long live the frontend.': '前端<span class="brand-text">永生</span>。',
  'Thank you — for real this time.': '谢谢 —— 这次是真的。',

  // ---- One more thing · Vue Vapor (the deep dive) ----
  'One more thing · Vue Vapor': '还有一件事 · Vue Vapor',
  'Vapor mode — no Virtual DOM.':
    '<span class="brand-text">Vapor</span> 模式 —— 没有虚拟 DOM。',
  "Templates compile straight to code that touches elements directly. We taught it to run on Lynx's two threads.":
    '模板直接编译成操作元素的代码。我们让它跑在了 Lynx 的两条线程上。',

  'Virtual DOM · the update path': '虚拟 DOM · 更新路径',
  'Vapor · the update path': 'Vapor · 更新路径',
  'Every change re-runs the component, rebuilds a VNode tree, and diffs it. Work scales with the whole tree.':
    '每次变更都要重跑组件、重建 VNode 树、再做 diff。开销随整棵树增长。',
  'No tree. No diff. A reactive effect writes straight to the one node that changed — work scales with what actually changed.':
    '没有树。没有 diff。一个响应式 effect 直接写入那个变化的节点 —— 开销只随真正变化的部分增长。',

  'The Vapor output · @vue/compiler-vapor': 'Vapor 产物 · @vue/compiler-vapor',
  '① a template registered once · ② cloned per instance · ③ one effect that updates a single node.':
    '<span class="codenote">①</span> 模板注册一次 · <span class="codenote">②</span> 每个实例克隆一份 · <span class="codenote">③</span> 一个 effect 只更新一个节点。',

  'Code reuse · from compile to runtime': '代码复用 · 从编译到运行时',
  "Vapor drives the browser DOM directly. We make the background thread's tree look like the DOM — so upstream Vapor runs untouched.":
    'Vapor 直接驱动浏览器 DOM。我们让后台线程的那棵树“长得像”DOM —— 于是上游 Vapor 原封不动地跑起来。',

  'Across the thread boundary · register': '跨越线程边界 · 注册',
  'Across the thread boundary · clone': '跨越线程边界 · 克隆',
  'Background · Vapor': '<span class="dot"></span>后台 · Vapor',
  'Main · interpreter': '<span class="dot"></span>主线程 · 解释器',
  'inert prototype': '惰性原型',
  'clone × 1,000': '克隆 × 1,000',
  'clone → native': '克隆 → 原生',
  'parse the static shape': '解析静态结构',
  'walk pre-order → uids': '前序遍历 → uid',
  'cache the structure': '缓存结构树',
  'same pre-order → uids': '相同前序 → uid',
  'one op per row': '每行一个 op',
  'base uid only': '只传 base uid',
  're-walk from base uid': '从 base uid 重走一遍',
  'materialize real elements': '生成真实元素',
  'The static structure crosses once — not one op per element.':
    '静态结构只跨越<em>一次</em> —— 不是每个元素一个 op。',
  'create-1k across the boundary: 17,000 ops · 327 KB → 7,000 ops · 160 KB':
    'create-1k 跨越边界:<span style="color:var(--ink-mute);text-decoration:line-through">17,000 ops · 327 KB</span> → <b class="brand-text">7,000 ops · 160 KB</b>',

  'Benchmark · update path, background thread': 'Benchmark · 更新路径,后台线程',
  'Where Vapor pulls away: 5.8–9.8×.':
    'Vapor 拉开差距的地方:<span class="brand-text">5.8–9.8×</span>。',
  'The entire delta is Vue work on the thread you share with your app logic — lower background cost means more headroom before dropped frames.':
    '整个差距都是 Vue 在那条你与应用逻辑共享的线程上的开销 —— 后台开销越低,离掉帧就越远。',

  'Benchmark · the whole ledger': 'Benchmark · 完整账本',
  'Big wins on updates and traffic; creation at parity; you pay in bundle size.':
    '更新与传输大幅领先;创建打平;代价是产物体积。',

  'The workflow · one source, two renderers': '工作流 · 一份源码,两个渲染器',
  "Every example built & driven in both modes through Lynx for Web. The support matrix is generated from the run — it can't drift from what actually passed.":
    '每个示例都通过 Lynx for Web 在两种模式下构建并驱动。支持矩阵由运行结果生成 —— 不会与真正通过的结果发生漂移。',

  // ---- upstream-test slides (VDOM A7 skip breakdown + Vapor proof) ----
  '131 documented skips — every one a test-infra artifact or browser-only semantic, not a Lynx gap.':
    '131 个 skip 都有据可查 —— 每一个要么是测试设施产物,要么是浏览器专属语义,<b class="brand-text">没有一个是 Lynx 的缺口。</b>',
  'One more thing · Vapor · proof': '还有一件事 · Vapor · 佐证',
  "Vapor's own suite — unmodified on ShadowElement. It passes the element-surface tests at 81% vs vdom's 57%: the closer fit to Lynx.":
    'Vapor 自己的上游测试 —— 在 ShadowElement 上<b>原封不动</b>地跑。触及元素表面的那些测试,它以 81% 对 vdom 的 57% 通过:与 Lynx 更亲近的契合。',

  'One more thing · the whole field, at 10k rows': '还有一件事 · 整个战场,在 10k 行',
  'On the 10k select storm Vapor is 8.2× VDOM and 23× ReactLynx — React leads only creation.':
    '在 10k 的 select 风暴上,Vapor 是 VDOM 的 <b class="brand-text">8.2×</b>、ReactLynx 的 <b class="brand-text">23×</b> —— React 只在创建上领先。',
  'One more thing · select storm × scale': '还有一件事 · select 风暴 × 规模',
  "Point updates as rows grow: VDOM and ReactLynx climb linearly; Vapor stays near the floor — 128 ms at 30k vs VDOM's 1.46 s.":
    '行数增长时的点状更新:VDOM 和 ReactLynx 线性攀升;Vapor 几乎贴着地板 —— <b class="brand-text">30k 时 128 ms</b>,而 VDOM 是 1.46 s。',
  'One more number': '还有一个数字',
  'Vapor vs Vue VDOM on the 10,000-row select storm — same app, same bundle, one attribute apart.':
    'Vapor 对 Vue VDOM,在 10,000 行的 select 风暴中 —— 同一个应用、同一个产物,只差一个属性。',

  'Vapor · one flag away': 'Vapor · 只差一个开关',
  'Same source. Flip a switch.':
    '同一份源码。<span class="brand-text">拨一下开关。</span>',
  'Experimental today — but the fast path is already here.':
    '今天还是实验性的 —— 但那条快路已经在这了。',
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
  // 1 Logo · React
  `<p><strong>冷开场 —— 屏幕上没有一个字。</strong>"Hey what's up guys —— 我是 Hux 黄玄,前 React 团队成员。"让 logo 单独停一拍。</p>`,
  // 2 Logo · +Vue
  `<p><strong>Vue 入场。</strong>React 让到一侧,Vue 落在旁边 —— 组件模型时代的两大基石。</p><p>抖包袱:React 一直没有一个自己的中文会议 —— 所以,很高兴来到 VueConf!(真心的)</p>`,
  // 2a Overlay · 第一段视频
  `<p><strong>第一段视频淡入,浮在两个 logo 之上</strong> —— React 岁月的影像。静音循环,人声压在上面讲;logo 在背后一直可见。</p><p>文件放到 <code>slides/public/media/embeds/02-video-1.mp4</code> —— 放进去之前这里显示带路径的占位框。</p>`,
  // 2b Overlay · 第二段视频
  `<p><strong>第二段视频加入</strong> —— 第一段缩进角落(定格),新的一段播放。Keynote 式的层层堆叠。</p><p>文件:<code>02-video-2.mp4</code>。</p>`,
  // 2c Overlay · 照片
  `<p><strong>照片落下</strong> —— 两段视频定格缩小,快照落在正中。那个时代的拼贴,完成。</p><p>文件:<code>02-image.png</code>。</p>`,
  // 2d 回归 · 两个 logo
  `<p><strong>图层散去</strong> —— 回到两个 logo 本身。停一拍,进入 Web 三角。</p>`,
  // 3 Logo · +Chrome(三角)
  `<p><strong>Chrome 从下方升起</strong> —— React 和 Vue 抬到上方两角,三个 logo 落成三角,Web 在底下托着它们。</p><p>"先聊 Web。"React 和 Vue 只是载体 —— 我们真正共同站立的地面,是 Web:它的开发体验、它的开放性、它的可达性。</p>`,
  // 3a Overlay · PWA 演讲 iframe
  `<p><strong>"先聊 Web"的实证:</strong>2016 年的 PWA 演讲,以 <em>live iframe</em> 浮在三角之上。点进框内可以翻那套 deck;在框外滚轮/按键才翻这套。角上的把手可拖拽缩放;切换器有桌面/平板/手机三档;↗ 按钮在新标签页打开。</p><p>iframe 在到达前一页时才加载、离开两页后卸载 —— 不拖累整场演讲。(需要会场网络;↗ 是 plan B。)</p>`,
  // 3b 回归 · Web 三角
  `<p><strong>关掉 PWA 窗口</strong> —— 三角回来,故事继续踩在这块地面上:是 Web 载着我们。</p>`,
  // 4 Logo · Lynx 取代 Chrome
  `<p><strong>Lynx 顶掉 Chrome</strong>,落在三角的同一个位置 —— 同一个位置,换了引擎。我在解的问题没变;脚下的地面变了。</p><p>快速给事实:Lynx 是字节跳动的跨平台引擎 —— TikTok 的界面就在跑 —— 而且已经开源。</p>`,
  // 5 一排候选人
  `<p><strong>一排看过去。</strong>行业里其实并不缺跨端解决方案:Flutter、React Native、NativeScript、还有 Web 本身 —— 它周围还绕着一圈自己的壳家族(Electron、Tauri、Ionic)。队尾那个新面孔,是 Lynx。</p>`,
  // 6 Vue 入场找爹
  `<p><strong>Vue 入场 —— 站上顶端,俯视一排候选人。</strong>下面每一个,都有自己的"亲儿子"框架故事。而 Vue —— 全球最大的前端社区之一 —— 一直没有一个统治级的跨端方案。Weex 试过,NativeScript-Vue 试过,都没立住。</p><p>那就相亲吧,一个一个来。</p>`,
  // 7 Flutter
  `<p><strong>候选一:Flutter。</strong>全靠自渲染 —— Skia/Impeller —— 平台覆盖确实漂亮:iOS、Android、桌面、甚至 Web。但上层唯一的门是 Dart。语言不对、生态不对:Vue 根本插不进去。这根线,压根连不上。(注意 Web 那条边是虚线 —— Flutter Web 的质量出了名的粗糙。)</p>`,
  // 8 React Native
  `<p><strong>候选二:React Native。</strong>原生 UI primitive,理念上离得最近。但整条链路绑死在 React 上:Metro、渲染器、编程模型。不是 Vue 不受欢迎 —— 是门的形状就不对。(Web 和桌面确实到得了 —— 图上是虚线 —— react-native-web 和各桌面端口都是树外维护,支持是"flaky"级别的。)</p>`,
  // 9 NativeScript
  `<p><strong>候选三:NativeScript。</strong>这个 Vue <em>确实</em>接得上 —— 但只有一半:编程模型和生态过不去,渲染模型也不像 Web(没有真正的 CSS 布局引擎)。更糟的是,目标平台里甚至没有 Web(桌面端有,但也是虚线级别)—— 你要维护第二套代码,换来的覆盖面反而更小。投入产出比太低。</p>`,
  // 10 Web · 今天的选择
  `<p><strong>于是社区留在了 Web</strong> —— 这就是今天的现实选择。它连接得毫无障碍:浏览器无处不在,壳家族(Electron、Tauri、Ionic —— 此刻在 Chrome 周围点亮)把缝隙都糊上了。但有一个问题任何壳都修不了:它还是<em>不够 Native</em> —— 这就是我们 demo 章节里见过的那个天花板。</p>`,
  // 11 Lynx 主动连上
  `<p><strong>然后,Lynx 走出队列 —— 站到正中央,Vue 的正下方;其余候选人整体让到左侧。</strong>前端这条缝是天生打开的:Web 标准的编程模型、真 CSS、框架无关的合同。这根线,短、垂直、实心。</p><p>再看下面的覆盖:iOS、Android、Web、HarmonyOS 走<em>原生 UI primitive</em>;桌面与更多平台走<em>自定义渲染引擎</em>。Web 的开发体验进,Native 的用户体验出 —— 这个组合,配得上一个正式的标题……</p>`,
  // 12 Title reveal · Vue Lynx 正式亮相
  `<p><strong>亮相。</strong>这是 Vue Lynx 第一次正式出场 —— 标题在论证之后才落下:空缺是真的,门是开的,而这个项目正走进那扇门。</p><p>念出名字,让背景光呼吸一拍,然后直接进入"完成度"。</p>`,
  // 13 Divider II
  `<p><strong>秀肌肉章节。</strong>"为了让大家感受到诚意" —— 我带了一桌丰盛的 demo。三道菜:Vue API 覆盖度、生态原样可用、然后是完整应用。</p><p>接下来看到的每台手机都是活的 —— 边看边扫码,在自己设备上跑。</p>`,
  // 14 852/949
  `<p><strong>先上硬指标。</strong>我们把 Vue core 自己的测试套件拿来直接跑在 Vue Lynx 渲染器上:949 个通过 852 个;每个 skip 都有记录、有交代。"兼容 Vue"在这里是可测量的命题,不是一句口号。</p>`,
  // 15 ref
  `<p><strong>从最简单的开始:</strong><code>ref()</code>、一个事件回调、一个样式绑定。整页和 Web Vue 的差别只有两处:import 写 <code>vue-lynx</code>,标签是 <code>&lt;view&gt;/&lt;text&gt;/&lt;image&gt;</code>。</p><p><strong>现场:</strong>点一下 —— logo 沿着 ref 驱动的 transform 弹起来。</p>`,
  // 16 reactive
  `<p>整个响应式内核原样复用自 Vue —— <code>reactive</code>、<code>toRefs</code>、<code>computed</code>、watch 全部一致。这意味着<strong>组合式函数 —— 你组织 Vue 应用的方式 —— 原封不动可用</strong>。这个秒表就是一个普通的 composable。</p>`,
  // 17 v-model
  `<p>双向绑定,两种形态都有:组件层 <code>defineModel</code>(含具名 model),以及直接绑在 Lynx <strong>原生</strong> <code>&lt;input&gt;/&lt;textarea&gt;</code> 上的 <code>v-model</code> —— 连 <code>.lazy/.trim/.number</code> 修饰符都在。原生 <code>vModelText</code> 由 @jynxbt 贡献(#121),落在 <code>0.2.0</code>。时序敏感的场景(预置值、程序化赋值、与 <code>@input</code> 共存)也都覆盖了。</p>`,
  // 18 slots
  `<p>组合模式整体平移:默认插槽、具名插槽、作用域插槽 —— 你搭设计系统用的整套组件写法都在。</p>`,
  // 19 provide/inject
  `<p>跨层级依赖注入 —— 响应式值也支持。根部切主题,深层子组件通过注入的 ref 一起重渲染。Pinia 和 Router 正是骑在这套机制上工作的 —— 这也是它们能直接跑通的原因。</p>`,
  // 20 Suspense
  `<p>异步编排:<code>defineAsyncComponent</code>、异步 <code>setup()</code>、嵌套 Suspense 边界、重挂载时的 fallback —— 全部跑在原生元素树上。</p>`,
  // 21 Transition
  `<p><code>&lt;Transition&gt;</code> 和 <code>&lt;TransitionGroup&gt;</code>,由<strong>原生合成器</strong>上的 CSS 动画驱动 —— 进入/离开、列表移动,类名全是你熟的那套。</p>`,
  // 22 CSS features
  `<p>真 CSS 是 Lynx 的超能力 —— 所以 Vue 的 SFC CSS 特性全都落地:普通 <code>&lt;style&gt;</code>、<code>&lt;style scoped&gt;</code>(cssId 桥在 <code>0.4.0</code>)、CSS Modules、外链样式,以及 CSS 里的 <code>v-bind()</code>(<code>0.3.0</code>),让响应式状态直接驱动原生样式。<code>v-bind()</code> / Lynx-native <code>useCssVars</code> 路径归功于 @KealanAU(#127) —— 不是整套 CSS 栈。</p>`,
  // 23 event modifiers
  `<p>Vue 的事件修饰符映射到 Lynx 事件系统:<code>.once</code>、<code>.stop</code>、<code>.self</code>、链式组合 —— @KealanAU 落地(#155), <code>0.4.0</code>。demo 里每个都和"不加修饰符"的孪生版本并排对照。(<code>.prevent</code> 是兼容性 no-op —— 原生没有默认行为可阻止。)</p>`,
  // 24 KeepAlive
  `<p>原生树上的组件实例缓存 —— 切 tab 再回来,状态还在。<code>include</code> / <code>exclude</code> / <code>max</code>,加上 <code>onActivated</code> / <code>onDeactivated</code>。@jynxbt 贡献(#153),落在 <code>0.4.0</code>。</p>`,
  // 25 Teleport
  `<p>按 id 渲染到目标节点 —— modal / overlay,不用和滚动层叠硬刚。BG 侧 <code>idRegistry</code> 解析 <code>to="#id"</code>;内容保持响应式,<code>:disabled</code> 则就地渲染。@sentomk 贡献(#161),落在 <code>0.4.0</code>。</p>`,
  // 26 v-once / v-memo
  `<p><strong>两个跳过指令,同一套跨线程收益。</strong><code>v-once</code> 首次渲染后冻结;<code>v-memo</code> 在依赖未变时跳过 —— 同一思路,按依赖列表判定。在 Lynx 上缓存命中会跳过该子树的<strong>整批跨线程 ops</strong>。@KealanAU:<code>v-once</code>(#176), <code>isMemoSame</code> + <code>v-memo</code>(#156 / #181), <code>0.4.0</code>。</p><p><strong>现场:</strong>点 Increment —— live 会变,frozen 不动;行在依赖未变前会跳过,直到你 toggle/rename。十二个特性。API 讲完了 —— 接下来,骑在它上面的生态。</p>`,
  // 28 Ecosystem intro
  `<p><strong>把兼容性主张说死。</strong>Vue 不只是一套 API —— 它是一个生态。如果 Pinia、Router、Query、Tailwind 都要 fork 才能跑,我们就失败了。它们不用。接下来四台现场手机;同一批包、同一套 API。</p>`,
  // 29 Pinia
  `<p><strong>Pinia,原封不动。</strong>同样的 <code>createPinia</code>,同样的 setup-store <code>defineStore</code>。它骑在 provide/inject 上 —— 所以前面那页才重要。这台手机里有两个 store:一个计数器,一个待办列表。</p><p><strong>现场:</strong>点 +,看 double getter 更新;再切到 todos 区。</p>`,
  // 30 Vue Router
  `<p><strong>Vue Router,按发布原样。</strong>唯一带 Lynx 形状的选择是 history 模式:没有 <code>window.location</code>,所以用 <code>createMemoryHistory()</code> —— 和 React Router 的 MemoryRouter 同一套 API。嵌套路由、params、<code>router.push</code> / <code>back</code> 全都有。导航用 <code>RouterLink</code> 的 custom slot 渲染原生 <code>&lt;text&gt;</code>。</p><p><strong>现场:</strong>点 Home → About → Users → 打开一个用户。</p>`,
  // 31 Vue Query
  `<p><strong>TanStack Vue Query,原样可用。</strong><code>useQuery</code>、依赖 key、mutation、插件安装 —— 没有任何一处是 Lynx 特供。这台手机打真实 JSON API:列用户、点一个、帖子通过依赖查询加载。</p><p><strong>现场:</strong>等列表出来,点一个用户,看 posts 到达。</p>`,
  // 32 Tailwind
  `<p><strong>Tailwind 能跑,是因为 CSS 能跑。</strong>没有 StyleSheet 方言 —— PostCSS 吐真实 CSS,Lynx 的原生引擎直接吃。主题 token 走 CSS 变量;点 Dark / Light / Ocean,整棵树跟着换 token。</p><p><strong>现场:</strong>切主题,拨一个开关。</p>`,
  // 33 Whole apps
  `<p>库单独跑通只是热身。真正的考验是把它们组合起来 —— 状态、路由、样式、数据请求 —— 整份 Vue 代码库落到原生上。来两个经典。</p>`,
  // 34 TodoMVC
  `<p><strong>TodoMVC</strong> —— 每个框架的成人礼。和写 Web 一模一样的 Composition API;输入框是<em>原生</em>的,滚动是<em>原生</em>的,点击延迟不到一帧。</p><p><strong>现场:</strong>加一条、勾几条、清除已完成。</p>`,
  // 35 HackerNews
  `<p><strong>HackerNews</strong> —— 社区公认的"真应用"基准:网络、分页、嵌套评论。数据 TanStack Vue Query,样式 Tailwind,滚动跑在带复用的原生 <code>&lt;list&gt;</code> 上。<strong>跟着过来的不只是框架,是生态。</strong></p>`,
  // 36 Runs on web
  `<p><strong>Web 兼容的点睛:</strong>刚才没有任何模拟器。每个手机壳里都是 <em>Lynx for Web</em>,跑的就是发到 iOS/Android 的那份产物。任何一页扫 Web 码 —— 浏览器直接打开;扫 App 码 —— 同一份产物,原生运行。</p><p>Web DX 进,Web 渲染目标出。基线讲完 —— 上超集。</p>`,
  // 28 Divider III
  `<p><strong>超集章节。</strong>覆盖度和移植证明的是下限;真正的卖点是向上:拿一个活着的 Web 应用,fork 它,然后<em>升级</em>它 —— 该是 Vue 的地方还是 Vue,该用原生的地方全上原生。两个真实 fork。</p>`,
  // 29 AI Chat unchanged
  `<p><strong>不变的部分。</strong>这是 Nuxt 官方 AI Chatbot 模板,逐特性移植:流式 + 思维链、markdown + 代码高亮、天气/图表工具卡片、历史、投票、编辑、主题。里面的 Vue —— 组件、composable、store —— 才是重点:<strong>它们毫无波澜地搬了过来。</strong></p>`,
  // 30 AI Chat native
  `<p><strong>变的部分 —— 升级项。</strong>① <em>键盘回避</em>:原生 <code>keyboardstatuschanged</code> 事件驱动 <code>setNativeProps</code> 变换,输入框和对话流跟着键盘一起、按原生曲线上滑 —— 不需要任何 Web 视口 hack。② <em>发送动效</em>:消息从输入框里"physically"飞出,变成气泡落进对话流。③ 按压反馈全部是主线程脚本。</p><p>致谢:这套原生聊天体验的标准,是 Vercel 的《How we built the v0 iOS app》立下的 —— 接下来两页看同样的手感在 Lynx 上要付出多少。</p><p><strong>现场:</strong>先聚焦输入框(键盘升、布局跟),再发一条消息 —— 看气泡。</p>`,
  // 31 AI Chat · handoff（first send 视频）
  `<p><strong>AI Chat。</strong>从 Nuxt AI Chatbot 模板逐特性移植的生产级聊天：流式、推理、Markdown、工具卡片、历史 —— 迄今对 Vue Lynx 最苛刻的真实世界考验。</p><p><strong>写作视角</strong>（借鉴 Vercel 的 v0 iOS 复盘）：一次漂亮的发送不是一个动画,而是一次交接 —— 输入框、消息列表、键盘、流式响应之间的交接。接下来三页,把每个瞬间都追溯到背后的 API。</p><p><strong>现场演示:</strong>循环片段 —— first send 从输入框出发,落到锚点。</p>`,
  // 32 AI Chat · 键盘也是布局
  `<p><strong>键盘。</strong>Lynx 的 <code>&lt;input&gt;</code> 不会自动避让键盘。输入框绝对定位吸在底部,监听全局 <code>keyboardstatuschanged</code> 事件,用 <code>setNativeProps</code> 施加上报的键盘高度 —— 不绕后台线程。列表只在原本就跟随新内容时才继续跟随。</p><p>这个 mock 就是 v0 草图的思路:一块空白的 <em>contentInset</em> 被键盘吃掉,输入框正好抬升一个键盘高度。</p>`,
  // 33 AI Chat · 新一轮消息在顶部
  `<p><strong>第二次发送才是真正的考验。</strong>重复发送会暴露空状态藏起来的问题。原生把新的用户轮次锚定在顶部,但在移动的气泡到位前,让上一轮保持稳定。Vue Lynx 的 <code>nextTick()</code> 等待挂起的 ops 抵达主线程,再由 <code>scrollIntoView</code> 完成最终对齐 —— 然后助手才开始流式输出。</p><p><strong>Web 走另一套策略</strong> —— 没有原生定位保证,于是把列表钉在底部。手感一致,机制不同。</p>`,
  // 33 Elk unchanged
  `<p><strong>这一页讲规模。</strong>Elk 是真实的 Mastodon 客户端,不是 demo:时间线、会话、个人页、投票、内容警告、自定义表情、搜索、发帖。我们 fork 它,保住它的"大脑" —— masto.js API 客户端、Mastodon-HTML 内容管线、主题、领域逻辑 —— 只把视图层重建到原生元素上。这就是移植经济学:<strong>应用越大,能复用的越多。</strong></p>`,
  // 34b Elk · 真实 Nuxt 应用,在原生上重建
  `<p><strong>Elk。</strong>Anthony Fu 团队广受喜爱的 Mastodon Web 客户端,被移植成原生 Mastodon 客户端 —— 时间线、串、资料页、搜索、趋势。一个 Nuxt 3 应用:约 196 个组件、55 个页面、50 个 composable。</p><p><strong>移植手法:</strong>保留与框架无关的层(masto.js 客户端原样复用、HTML 内容解析约 95% 逐字保留),把 vnode 渲染器改写目标到 <code>&lt;text&gt;</code>/<code>&lt;image&gt;</code>,再用原生复用 <code>&lt;list&gt;</code> 替换 Elk 的 DOM 虚拟化 —— 代码更<em>少</em>。</p>`,
  // 34 Elk gestures
  `<p><strong>手势升级。</strong>底部抽屉从头到尾是主线程脚本:8px 手势锁判定谁接管拖拽,超限后的橡皮筋阻尼,带真实速度 + 减速度的甩动开合 —— 零后台线程往返,流式加载中也不掉帧。</p><p><strong>现已合入</strong>(PR #223):原生 view pager,横滑切时间线 tab —— 抽屉展示了范式,pager 复用它(见本章后续)。</p><p><strong>现场:</strong>滚时间线,慢拖抽屉(橡皮筋),再甩一下。</p>`,
  // 34c Elk · 可拖拽 sheet · 三个归属者（真实 UI + 代码）
  `<p><strong>可拖拽 sheet —— 难的不是"从底部滑上来",而是三套状态机协同。</strong>① Vue <code>&lt;Transition&gt;</code> 管"sheet 是否存在于视觉状态"(开/关);<code>v-show</code> 让节点保持挂载,关闭后滚动位置与状态得以保留,同时跑完整的 persisted transition 生命周期 —— 正是这项修复让该能力从 experimental 毕业。② 一个 <code>'main thread'</code> worklet 管"手指每一帧在哪":通过 <code>:main-thread-bindtouch*</code> 绑定,用 <code>setStyleProperty</code> 直接写 <code>transform</code>,绕开 Vue diff,并在拉过顶部时施加橡皮筋阻力。③ 原生 <code>&lt;scroll-view&gt;</code> 管"这串触摸属于谁":8px 手势锁先一次性判定方向与来源;若向下拖且列表已到顶,sheet 关掉原生滚动(<code>enable-scroll=false</code>)接管拖动,否则让给它。<code>runOnBackground</code> 只在状态边界(关闭时)跨线程,绝不每帧跨。</p><p><strong>结构即属性归属:</strong>外层 surface 归 Transition(CSS class),内层归拖动(inline <code>transform</code>)。两者写同一元素,inline 覆盖 class —— 经典的"第一次能动,之后动画消失"。</p><p><strong>双线程红利:</strong>拖拽跑在 UI 线程上,贴着原生输入与布局,即便 Vue 后台线程正在请求数据、diff 或重建列表也照样跟手;Web 上手势 JS 与渲染共享一条主线程,一有长任务就掉帧。</p>`,
  // 34b Elk · 原生 view pager
  `<p><strong>原生 view pager(已合入 PR #223)。</strong><code>elk-viewpager</code> 分支用原生 <strong>viewpager</strong> 元素(通过 <code>TabPager.vue</code>)承载 Explore / Notifications 标签。分屏以原生吸附滑动,并在滑动间保留内容与滚动位置。</p><p><strong>难点在于元素名按平台不同:</strong>Lynx for Web 提供旧名 <code>x-viewpager-ng</code>(今天可用);原生 OSS 引擎注册抽取出的 <code>viewpager</code>(需要基于 lynx develop 构建的宿主)。<code>TabPager.vue</code> 在运行时按 <code>SystemInfo.platform</code> 选标签名。</p><p><strong>双向同步:</strong>点标签 → <code>selectTab()</code> 动画切页;滑动分页 → 其 <code>change</code> 事件移动激活标签。</p>`,
  // 34e Elk · 折叠 profile · 组合
  `<p><strong>移动端最难的布局,靠组合做出来。</strong>折叠头部 + 吸顶 tab + 横向翻页 + 每个 pane 各自纵向滚动 —— Twitter/X 的 profile。Web 上这是重型库(react-native-collapsible-tab-view、Android 的 CoordinatorLayout)在和主线程搏斗;这里是一次原生元件的组合,跑在平台自己的滚动线程上。</p><p><strong>Native UX ← Web DX。</strong>Lynx 把原生构件暴露成元件:<code>&lt;scroll-coordinator&gt;</code>(声明式的嵌套滚动交接:先折叠头部,再把滚动交给当前 pane 的列表,零 JS 滚动监听)、抽取出的 <code>&lt;viewpager&gt;</code>(原生吸附翻页 + 每个 pane 状态保留)、以及每个 pane 一个复用型 <code>&lt;list&gt;</code>。我们在一个 Vue SFC 里把它们组合起来。唯一的平台接缝就是标签名(Lynx for Web 的 <code>x-foldview-ng</code>/<code>x-viewpager-ng</code> ↔ 原生的 <code>scroll-coordinator</code>/<code>viewpager</code>)。</p><p><strong>一套代码,两个目标:</strong>同一个 SFC 既渲染真正的原生 profile,又渲染文档站里的 Lynx-for-Web 预览。tab 栏与翻页器通过原生 <code>selectTab</code>/<code>change</code> 方法双向同步,而非合成 DOM 事件。</p>`,
  // 35 Divider IV · How we did it
  `<p><strong>工程章。</strong>刚才看到的一切,是一个人两周做出来的 —— 这一章诚实回答"怎么做到的"。三次适配,每一次都揭开 Lynx 架构的一角:把 Vue 拆上双线程而不破坏语义;让一条工具链吐出两个世界;再让主线程本身可编程。AI harness 贯穿全程。</p>`,
  // 36 A1 · Vue 落在后台线程
  `<p><strong>第一个决定:Vue 住哪条线程?</strong>早期社区实验把 Vue 放在主线程 —— 于是每个事件都要跨线程转发。而 Lynx 原生就把事件送到后台线程,所以我们把整个运行时放在这里:响应式、diff、生命周期、你的回调。不是 fork —— 是原封不动的 <code>@vue/runtime-core</code>。</p>`,
  // 37 A2 · ShadowElement
  `<p><strong>Vue 官方的自定义渲染器 API 就是全部诀窍。</strong><code>createRenderer()</code> 要求同步的节点 —— <code>parentNode()</code>、<code>nextSibling()</code> 必须立刻有答案,但真实元素在另一条线程上。所以 nodeOps 双写:在后台线程维护一棵轻量 <em>ShadowElement</em> 链表(满足 Vue 的所有同步读取),同时把真正的工作排进队列。和 ReactLynx 的 snapshot instance 是同一个 pattern。</p>`,
  // 38 A3 · ops 缓冲
  `<p><strong>唯一跨过线程边界的,是数据。</strong><code>[CREATE, id, tag, INSERT, parent, child, SET_PROP, id, key, value…]</code> —— 只有数字和字符串,没有对象要序列化,没有函数。按 Vue 自己的 flush 周期批处理:一个响应式 tick = 一次发送。Vue 编译器还白送一层:静态内容零 ops,只有动态绑定在路上跑。</p>`,
  // 39 A4 · 解释器 + PAPI
  `<p><strong>这里就是 Lynx 框架无关的那条缝,凑近看。</strong>主线程跑一个小解释器 —— 字面意义上的 switch 循环 —— 把 ops 重放到 <em>Element PAPI</em> 上:<code>__CreateView</code>、<code>__AppendElement</code>、<code>__SetAttribute</code>……这套 C 风格 API 是 Lynx 给每个框架的合同;ReactLynx 在喂它,我们在喂它,下一个框架也会。VDOM → ShadowElement → ops → PAPI:四站,一条直线。</p>`,
  // 40 A5 · 事件回程
  `<p><strong>回程闭环。</strong>函数不能跨线程,所以它们从来不跨:每个回调注册一个数字 <em>sign</em>;主线程派发 sign,后台线程查表,就地调用你的 Vue 函数 —— 闭包、响应式,全都还在原地。这就是 Vue 语义得以保全的原因:真正要紧的东西从来没离开过。</p>`,
  // 41 A6 · nextTick
  `<p><strong>用户能感觉到多少?几乎为零。</strong>唯一可见的接缝:原生元素在 mount 之后一拍才落地,所以"等 DOM"写成 <code>onMounted(() =&gt; nextTick(() =&gt; lynx.createSelectorQuery()…))</code> —— 和 Web Vue 同一个 <code>nextTick</code> 心智模型,只是跨了一条线程。这张图绕一圈,<em>就是</em>一个 tick。其余一切 —— 响应式、生命周期、组合式函数 —— 行为和 Web 完全一致。(文档:Understanding the Dual-Thread Model。)</p>`,
  // 42 A7 · 上游测试
  `<p><strong>"语义保全"是可测量的命题。</strong>我们把 <code>vuejs/core</code> 的测试套件搬进仓库,在两层上对着 Vue Lynx 跑:一层用我们真实的 ShadowElement 链表垫在 <code>@vue/runtime-test</code> 下面(验证完整渲染器合同 —— keyed diff、LIS、fragment、生命周期);另一层 runtime-dom 把 <code>patchProp → ops → applyOps → PAPI</code> 推进 jsdom。1013 个通过 882,131 个 skip 全部有记录,零失败。</p>`,
  // 43 A8 · 测试是 AI 的眼睛
  `<p><strong>测试的 AI-harness 一面。</strong>我们还做了 <code>vue-lynx-testing-library</code> —— <code>render</code>、<code>fireEvent</code>、<code>getByText</code>,双线程被 <code>@lynx-js/testing-environment</code> 抽象掉 —— 组件行为在普通 vitest 里就能断言。对人来说这是卫生习惯;对 AI harness 来说这是<em>感知</em>:红绿就是 agent 知道自己刚才做了什么的方式。上游套件,就是让两周生成代码保持诚实的 reward signal。</p>`,
  // IFR1 · 空白首帧
  `<p><strong>往返的代价。</strong>前六页讲的 VDOM → ShadowElement → ops → PAPI,在第一帧之前必须先整整跑一圈。设备上,这一圈再加后台线程启动与 bundle 求值,就是几十毫秒的白屏。</p>`,
  // IFR2 · IFR:先出画面
  `<p><strong>首屏直出 —— 从 ReactLynx 移植。</strong>开了 <code>enableIFR</code>,主线程产物就带上完整 Vue 运行时 + 应用(不只是 worklet)。<code>renderPage</code> 在 <code>loadTemplate</code> 里同步挂载 —— 看 <strong>paint</strong> 旗标跳到左边。后台线程照样跑同一份代码,只是并行、离开关键路径。</p>`,
  // IFR3 · 录制 + 对账
  `<p><strong>用 ops 对账做水合。</strong>那条扁平 ops 流本身就是"录下来的 PAPI 调用"。后台最初的 <code>vuePatchUpdate</code> 批次逐帧走这份录制:相同 → 跳过(已在屏上),值不同 → 打补丁,结构分歧 → 拆掉首屏树重建。不一致只损失性能收益,绝不损失正确性(开发期打印 <code>IFR hydration mismatch</code>)。</p>`,
  // IFR4 · Element Templates 转折
  `<p><strong>第二个杠杆。</strong>IFR 把绘制提前;打开它会默认打开 Element Templates。它们让渲染本身便宜一个数量级 —— 而且瘦身的是<em>每一次</em>更新的跨线程协议,不只首帧。</p>`,
  // IFR5 · 逐节点的管线
  `<p>还是 Runtime 那章的同一条管线 —— 但注意它是<em>逐节点</em>跑的,哪怕这些结构永远不变。</p>`,
  // IFR6 · ET 折叠管线
  `<p>看 <code>VDOM</code> 和 <code>PAPI</code> 留在原地,而管线中段整个塌陷。这是<em>框架级</em>模板 —— 普通的带类型 Element PAPI 调用,不是 Lynx 的二进制引擎模板。</p>`,
  // IFR7 · 骨架 + 空洞
  `<p>可下沉 = 每个节点都是纯 Lynx 元素、只有值或文本动态。组件、插槽、<code>v-if</code>/<code>v-for</code> 宿主、<code>&lt;list&gt;</code>、带 ref/id 的节点留在普通 vnode 路径;它们的纯元素子体仍可下沉。scoped-CSS 的 scope id 会被烘焙进去。</p>`,
  // IFR8 · 基准测试表
  `<p>几组独立的实验,不是一条 trace。FCP 收益来自去掉后台启动 + IPC —— 需要真实的线程边界。但统一重跑(PR #266)推翻了把 −19% 当作<em>普适</em>常数的说法:那只是中等规模 ×1 的结果。纯 <code>vdom-ifr</code> 在 1k 是 −10%,到 10k 变成 <strong>+22%(反而更慢)</strong>,30k 是 +20%;<strong>IFR + ET 在整条阶梯上都领先</strong>,而 ReactLynx 的 FCP@10k 最低(228ms)。Element Templates 自己的收益在渲染开销 9.4ms → <strong>1.3ms</strong> 和 ops 负载 —— 而且它不只管首帧(挂载后的风暴也快 0.72× @10k)。代价:约 2.26× gzip。</p>`,
  // IFR9 · 基准测试图
  `<p>左:渲染开销随 ET 塌陷。右:静态偏重屏幕的跨线程协议从约 78KB 降到 69 字节。PAPI 调用次数只降 5–20% —— 原生元素工作是共享地板;被下沉掉的是框架 JS 和它周围的协议。</p>`,
  // IFR10 · 诚实的取舍
  `<p>诚实说代价:包体大约翻倍、应用双线程各求值一遍(设备上主线程渲染与后台启动重叠,所以串行 TTI 是上界)。内容优先的屏幕收益是真的;请求优先的屏幕只付包体、拿不到 FCP 收益。</p>`,
  // 44 B1 · 一个 bundle 两个世界
  `<p><strong>Lynx 的交付物是一个装着两个程序的 bundle</strong> —— 后台代码跑在 JS VM,主线程代码跑在 Lepus(PrimJS)。两个 VM、两个入口、一个产物;同一个文件既能原生渲染,也能经 Lynx for Web 跑在浏览器里。于是工具链的问题变成:一次构建,怎么从一份 Vue 代码吐出两个世界?</p>`,
  // 45 B2 · 同一份代码进两次
  `<p><strong>两个入口都 import 你的真实应用。</strong>每个入口在一个 webpack <em>layer</em> 下编译 —— <code>vue:background</code> 和 <code>vue:main-thread</code> —— <code>issuerLayer</code> 规则给每层各自的 loader 链:BG 侧编译完整 SFC;MT 侧只抽取主线程需要的部分。逐 entry 的隔离,是 webpack 依赖图白送的。(这套 layer 方案我们是从 ReactLynx 学来的 —— 第一版扁平 bundle 架构隔离不了多入口应用。)</p>`,
  // 46 B3 · 插件而非编译器
  `<p><strong>复用故事的工具链篇。</strong>Lynx 的工具链(Rspeedy)就是 Rspack/Rsbuild —— 而 Vue 生态本来就跑在 Rspack 上,所以整条 SFC 流水线是现成的:<code>rspack-vue-loader</code>、PostCSS、HMR。<code>pluginVueLynx()</code> 是一层薄适配:把入口拆成两个 layer、接上 worklet loader、配好 CSS —— 表面积就这么大。框架无关不是口号,是用"我们只需要写多少"来度量的。</p>`,
  // 47 B4 · CSS 就是 CSS
  `<p><strong>整章样式能力背后安静的超能力:</strong>Lynx 在原生侧带了真正的 CSS 引擎 —— 选择器、级联、动画。所以 <code>&lt;style scoped&gt;</code> 映射到 Lynx 的 cssId 作用域,CSS Modules 和外链样式直接透传,CSS 里的 <code>v-bind()</code> 骑在 CSS 变量上,Tailwind 能跑是因为 PostCSS 就是 PostCSS。没有 StyleSheet 对象方言,没有会漏的翻译层。</p>`,
  // 48 C1 · 手势为什么会迟
  `<p><strong>先诚实讲代价,再卖回报。</strong>普通写法的滚动跟随动画:事件在主线程触发,跳去后台跑你的回调,产生的 ops 再跳回来 —— 手势的每一帧背后是两次跨线程。页面一忙,肉眼可见地迟。这是双线程架构唯一收费的地方。</p>`,
  // 49 C2 · 函数换线程
  `<p><strong>看方块移动。</strong>把 <code>'main thread'</code> 写成函数第一行,编译器就把这个函数搬进主线程 bundle —— 它从此同步运行在事件发生的地方,直接访问元素。组件的其余部分还是普通 Vue。又是渐进增强的形状:双线程的回报留着,代价变成按函数粒度的可选项。</p>`,
  // 50 C3 · 代码样例
  `<p>MTS 的全部表面积,一个文件讲完:<code>'main thread'</code> 标记函数,<code>main-thread-bind*</code> 挂到事件上,<code>useMainThreadRef()</code> 给出同步元素访问 —— <code>setStyleProperty</code> 在手指移动的同一帧落地。</p>`,
  // 51 C4 · 教程复刻
  `<p><strong>复刻即证明。</strong>lynxjs.org 用两个教程教 MTS,都是为 ReactLynx 写的。两个都在 Vue Lynx 上重做了,live 在我们的文档站上 —— 同样的拖拽物理、同样的吸附、同样的主线程滚动条。平台教程能干净地移植过来,能力就是真的在。</p><p><strong>现场:</strong>慢慢拖 —— 指示器逐像素同步;一甩,吸附。</p>`,
  // 52 C5 · 复用与开放的 API 空间
  `<p><strong>先复用,再演化。</strong>引擎层我们直接跑 ReactLynx 的 worklet runtime 和它的 API 形状(<code>main-thread-bind*</code>、<code>useMainThreadRef</code>)—— 久经考验,而且在 Lynx 生态里通用。但 Vue 值得 Vue 形状的人体工学:想象 <code>&lt;script main-thread setup&gt;</code>、主线程的 computed/watch。这个设计空间是开放的 —— 也是社区留下印记的好地方。</p>`,
  // 53 IV · 格局 · 引入
  `<p><strong>兑现承诺的 deep-dive。</strong>开场时我们是"凭感觉"相亲;现在运行时、工具链、MTS 都摆上桌了,可以来架构级的版本了。把任何跨端栈拆成五层,层间四条缝 —— 每条要么是扩展点,要么是焊死的墙。诚实地给所有人打分,包括 Lynx 自己。</p>`,
  // 54 Map scaffold
  `<p><strong>地图。</strong>把任何跨端栈拆成五层;层间四条缝,每条是个是非题:EP1 能接任意前端?EP2 能换渲染模型?EP3 能加原生能力?EP4 能上新平台?开着的缝是扩展点,焊死的缝是墙。</p>`,
  // 55 Web column
  `<p>Web:EP1 全开 —— 任意框架。但渲染和能力被沙箱焊死;"新平台"只等于"那里有浏览器"。开发体验封顶,用户体验也封顶。</p>`,
  // 56 Ionic
  `<p>Ionic(以及所有 WebView 套壳):上层保住了 Web 的开放,Capacitor 把能力那条缝撬到半开 —— 但渲染仍然是 WebView 里的 DOM。它继承了 Web 的天花板:<strong>不够 Native</strong>。</p>`,
  // 57 NativeScript
  `<p>NativeScript:反向的取舍。谁都比不过的直接原生访问 —— 但它不是真正的 Web:没有真 CSS 引擎、没有 DOM 语义,渲染和新平台两处焊死。<strong>不够 Web</strong>。</p>`,
  // 58 Flutter
  `<p>Flutter:下半场全开 —— 自渲染、embedder 上新平台。代价是上层只留 Dart 一扇门。它不是在延伸 Web,是在替代 Web —— <strong>一个平行宇宙</strong>。</p>`,
  // 59 React Native
  `<p>React Native:能力开放、生态庞大 —— 离梦想最近。但前端那条缝焊死在 React 上:Metro、渲染器、心智模型全都是。如果你是 Vue,<strong>这扇门从来不属于你</strong>。</p>`,
  // 60 Lynx column
  `<p><strong>答案。</strong>EP1:基于 Rspack 的工具链,框架无关 —— 真 CSS、任意前端。EP2:引擎既能适配原生 primitive,也能自渲染。EP3:Native Module。EP4:移动 + 桌面已落地,TV/VR 用自渲染跑通。四条缝,一条不焊 —— 包括 Vue 需要的那条。</p>`,
  // 61 Framework-agnostic
  `<p>Lynx 从 ReactLynx 起步,但平台被刻意演进为框架无关 —— 前端层是真正的扩展点,不是 React 的附属功能。这不是宣传话术;马上给你看实证。</p>`,
  // 62 Web DX Native UX
  `<p><strong>一句话论点。</strong>Lynx 给你 Web 的开发体验、Native 的用户体验。而因为前端那条缝是开的 —— 这就是 Vue 的机会。于是……</p>`,
  // 63 H1 · 2 weeks
  `<p><strong>现在这个数字说得通了。</strong>这一章的一切 —— 渲染器、工具链、MTS —— 是两周的夜晚和周末做出来的:plan 写成 spec,agent harness 执行,上游测试当 reward signal,AGENTS.md 固化调试手册。给在座各位一个安静的结论:Lynx 出乎意料地 <em>AI 可读</em> —— Web 标准的 API 和真 CSS,意味着模型的 Web 直觉基本直接迁移。</p>`,
  // 64 H2 · X 复盘
  `<p><strong>让观众把手机对准这页。</strong>完整方法论写在 X 上 —— harness 怎么搭、plan 长什么样、AI 在哪儿失手、测试怎么接住的。vue.lynxjs.org 首页的 badge 也链着它。然后收束:"这就是它怎么被做出来的 —— 接下来看看它加起来意味着什么。"</p>`,
  // 65 Combine
  `<p><strong>标题句。</strong>Vue × Lynx = Vue 跑在原生上。停顿,让等式落地。然后:"也很希望大家来一起把它做成。"</p>`,
  // 66 Divider V · close
  `<p><strong>转向请求。</strong>项目是真的,但需要社区。架构很稳;Vue 的表面积很大。</p>`,
  // 67 Ask
  `<p>落在这句上 —— <em>"原生,不该是另一个团队的事。"</em>这是你想让他们记住的一句。</p>`,
  // 68 What's there / open
  `<p>左边 = 今天就能用、可以做生产探索的。右边 = 贡献者能发力的地方 —— 第三章里 Elk 的 view pager,就在这个清单上。</p>`,
  // 69 Try
  `<p><strong>行动号召。</strong>一行命令 —— <code>npm create vue-lynx@latest</code>。"给 Agent"按钮会复制一段引导 prompt。承诺:"今晚回家的公交上,你就能让一个 Vue 应用跑在 iPhone 上。"</p>`,
  // 70 Thank you (the FAKE close)
  `<p><strong>假收尾。</strong>演得越真越好:道谢、微微鞠躬、伸手去拿水 —— 停住,等掌声起来。</p><p>然后面无表情:"啊——没有哈。这才过去十分钟。"翻页,进入真正的后半场。</p>`,
  // 71 Epilogue divider · 大象
  `<p><strong>重置全场。</strong>"那,用省下来的十分钟,聊聊房间里的大象。"如果 AI 什么都能做,为什么不直接 prompt 出 N 个原生应用,跳过框架、跳过跨端、跳过这一切?</p><p>语气转变:少一点产品推介,多一点自言自语。这半场讲的是 <em>why</em>,不是 <em>what</em>。</p>`,
  // 71a Overlay · 推文上半
  `<p><strong>推文本尊,浮在 divider 之上。</strong>2025 年 2 月 2 日 —— Karpathy 造出 "vibe coding" 这个词。先露上半截:<em>"fully give in to the vibes, embrace exponentials, and forget that the code even exists."</em></p><p>文件:<code>slides/public/media/embeds/79-vibe-coding.png</code> —— 一整张全高截图,由这个窗口裁切。</p>`,
  // 71b Overlay · 推文下半
  `<p><strong>下移 + 轻微放大</strong> —— 下半截:<em>"It's not too bad for throwaway weekend projects…"</em> 十八个月后,它已经在写原生应用了。让这句落地,翻页 —— 推文淡出,进入提问。</p>`,
  // 72 E2 · 诚实的问题
  `<p><strong>先诚实:我不知道。</strong>AI 对 Lynx、对 Vue 意味着什么,我为什么还要费这个劲?如果没有人类会读,文档还重要吗?如果模型能从裸金属重建,类库还重要吗?</p><p>可以丢的数据点:AI 时代 React 的使用量反而<em>暴涨</em> —— 模型默认写 React —— 但 React 本身却没有过去那么重要了;Anthropic 刚写过 Claude 用纯 HTML 搓一次性内部工具、什么框架都不用。地面真的在动。</p>`,
  // 73 E3 · 论断
  `<p><strong>先把论点立起来,这一章才有脊柱。</strong>从 AI 手里"幸存"下来的,是所有<em>使能</em>而非仅仅产出的东西:基础设施、使能者、平台、生态 —— 以及链条尽头的,人。注意这是递进:每一环都因为喂养下一环而幸存。</p><p>我用两个引理来论证:(1) 技术的角色从 interface 翻转为 harness;(2) 技术真正的工作,是连接生态 —— 和人。</p>`,
  // 74 E4 · 新的栈
  `<p><strong>引理一,从新的技术栈开始。</strong>自然语言是新的源代码;agent 是新的 interface,坐在 IDE 和 GUI 曾经的位置上。但看 agent 下面:code、frameworks、system —— 它们没有消失,它们变成了 agent <em>驾驭的对象</em>。</p><p>技术的工作翻转了:从直接服务人,变成 harness 那个服务人的东西。</p>`,
  // 75 E5 · harness 是什么
  `<p><strong>把这个词定义清楚,整章都压在它上面。</strong>Harness 是把原始能力变成可靠工作的东西:上下文(它带着什么进来)、工具(它能用什么行动)、环境(行动在哪里既安全又便宜)、反馈(它如何看见自己刚做了什么)。</p><p>第四章其实偷偷讲的就是这页:AGENTS.md 是上下文,工具链是工具,LynxExplorer 是环境,上游测试是反馈。</p>`,
  // 76 E6 · 浏览器是个好 harness
  `<p><strong>平台之所以幸存,是因为平台是极好的 harness。</strong>浏览器:开放的数据与文档(上下文)、巨大的能力表面(工具)、天然的沙箱(环境)、彻底的透明 —— DOM、DevTools(反馈)。</p><p>没有人argue Web 会被 AI 淘汰。我甚至更进一步:GUI 本身都不会 —— 人类总要<em>看</em>。</p>`,
  // 77 E7 · 框架一直是 harness
  `<p><strong>让框架与 AI 相关的那次重构。</strong>在 Web 上你本来爱怎么改 DOM 都行 —— React 和 Vue 赢,是因为它们<em>约束</em>了我们:一种架构,把人类的推理 harness 成吐出下一个正确 token 的过程。</p><p>我们才是第一批被 harness 的 token 预测器。模型只是下一批。高层抽象仍然有用 —— 它帮过我们,也会帮它。</p>`,
  // 78 E8 · FABRIC I
  `<p><strong>本章的意象登场。</strong>先让线呼吸一会儿再开口。在我"前端已死"的演讲里,我试着从第一性原理论证:UI/App 抽象永远都需要 —— 意图与像素之间,总要有一层织物。现代软件是缝出来的,不是凿出来的。</p><p>于是,贯穿后半场的比喻:每一种技术都是一种织物 —— 有自己的纤维、自己的织法、自己的手感。</p>`,
  // 79 E9 · Vue 的质地
  `<p><strong>织得更密了。</strong>不同的织物有不同的特性 —— 而 Vue 的质地也许正是你想要的:模板、细粒度响应式、"直接改就行"的可变状态、单文件组件。</p><p>重点不是 Vue 对谁。重点是<em>材质</em>依然重要 —— 对选择它的人重要,对在它的海洋里训练出来的模型也重要。</p>`,
  // 80 E10 · meme 幕间
  `<p><strong>喘口气。</strong>进入引理二之前的自嘲一拍 —— 把 meme 放进来,收下笑声,继续。(占位框:把真图放进 <code>public/media/</code> 后替换。)</p>`,
  // 81 E11 · FABRIC II · 织机
  `<p><strong>引理二用画面开场,不用论断。</strong>绿色的织物穿过一个点 —— 织机 —— 在另一侧被织进 iOS、Android、Web。盯住一根线:进腰身之前它保持自己的颜色,出来时带上了平台的颜色。</p><p>Lynx 凭什么能当这台织机?一侧是 Web 亲和的表面,另一侧是扎实的原生架构,中间是每一层的开放。</p>`,
  // 82 E12 · 认领"缝合怪"
  `<p><strong>把这个"骂名"认下来。</strong>有人叫 Lynx 缝合怪 —— 对!我们刚说了,代码本来就是一块块织物 —— 把它们接起来的东西,当然是缝起来的。织机<em>本来</em>就该是台缝合机器。</p><p>缝合换来的:它吸收了 N 个平台的原始熵,让每个应用不必重新支付 —— 而这恰恰是 AI 自己最难摊销的部分。框架持有翻译合同,agent 只对压缩后的语义写作。</p>`,
  // 83 E13 · 压缩
  `<p><strong>同一台织机,抽象上移一层。</strong>左边:模型的整个选择空间 —— 灰、宽、混沌。穿过框架,出来时又窄又亮又齐:惯用法。所谓 steering,画出来就是这样。</p><p>这就是为什么跨端框架是 AI 的<em>语义压缩层</em>:更少的 token、训练分布里更密的区域、更小的幻觉空间。正确性是个概率问题 —— 压缩,挪动的就是概率。</p>`,
  // 84 E14 · 人
  `<p><strong>引理落在人身上。</strong>如果 AI 最终 boil down 到人的品味,那人只会更重要 —— 连接一个社区,就是连接一群人。</p><p>点名现场:帮忙 3D 打印的小音,非常感谢;雪碧 —— 上一顿饭还在福州,没想到今天在这里遇见;Nector —— 上一面还在波兰!你可以说"这个平台才有我想追的偶像" —— 那,Evan 和 Anthony 就在这个平台上。</p>`,
  // 85 E15 · 不是框架,是连接
  `<p><strong>那我到底做了个什么?</strong>AI 时代你理论上并不<em>需要</em>框架 —— 十年前我做过一个在线 HTML slides 编辑器;今天这套 deck 完全是生成的,底下什么库都没有。Vue Lynx 真正是一个开端:说服 Vue 社区,来给原生做点东西。</p><p>更深一层的道理:只要连接<em>存在</em>,AI 就会放大发生的连接。编程语言之间移植容易,因为大家都图灵完备、都有 runtime —— 桥本来就在。Web ↔ Native 之间没有天然的桥。Lynx 这个开源项目的命题,就是那座桥的<em>设计</em>。(顺带:我选择投身的技术,商业价值是一,理想也总要有一点。)</p>`,
  // 86 E16 · 连接复利
  `<p><strong>连上 Lynx,就连上了 Lynx 连接的一切。</strong>你已经在用的 Web 织物 —— Motion、Pretext —— 直接带过来;经 Node-API 连 Electron;JSI 世界连 Expo Modules;每一种渲染策略;正在成形的 agent-UI 协议。还有 Lynx 自己的生态 —— Sparkling、Lynxtron。</p><p>被带过来的,是生态和社区本身。这就是复利。</p>`,
  // 87 E17 · 能 vibe 的地方
  `<p><strong>把生态论点按 AI 时代磨尖。</strong>键盘前坐着 agent 的时候,你需要的甚至不是成熟的类库 —— 而是一个试错便宜、可观测、够安全的平台。Web 之所以是 Web,靠的就是这个。Lynx 的赌注,是把这个性质带到原生。</p>`,
  // 88 E18 · One more thing
  `<p><strong>停住。</strong>数两拍,再翻页。</p>`,
  // ---- One more thing · Vue Vapor deep dive (12 slides) ----
  // 36 Vapor 标题
  `<p><strong>Vapor 是什么。</strong>Vue 3.6 基于编译的渲染器:没有 vnode 树,没有逐组件 diff。预发布状态 —— 锁定在 <code>vue@3.6.0-beta.17</code>。</p><p>我们要用数据支撑的主张:同样的 Vue,更新路径的开销小得多。</p>`,
  // 37 虚拟 DOM 更新路径
  `<p><strong>先立对比。</strong>从左到右过一遍五个方块。中间三个虚线的就是税:重跑、分配、diff —— 每次更新都要交,无论变了多少。</p><p>下一页用一次 magic move 把中间这段收掉。</p>`,
  // 38 Vapor 更新路径
  `<p><strong>morph 的回报。</strong>中间三个方块刚刚消失了。状态和目标节点原地不动,一个响应式 effect 把它们连起来。</p><p>这就是全部要点:细粒度更新,而不是整树 diff。</p>`,
  // 39 Vapor 产物
  `<p><strong>看右边这一版。</strong>三步:<code>template()</code> 一次性声明静态结构;<code>t0()</code> 克隆它;<code>renderEffect()</code> 是唯一会重跑的东西 —— 而它只碰一个文本节点。</p><p>注意 <code>from 'vue'</code> —— 组件并不知道自己在 Lynx 上。这正是下一页。</p>`,
  // 40 代码复用 · 管线
  `<p><strong>复用的故事。</strong>两条绿色的层就是全部诀窍:<code>@vue/runtime-vapor</code> <em>原封不动</em>发布,因为它底下的 ShadowElement 树会响应标准 DOM 调用 —— <code>insertBefore</code>、<code>cloneNode</code>、<code>setAttribute</code>。这些调用变成 vdom 模式已经在用的同一串 ops。</p>`,
  // 41 跨线程 · 注册
  `<p><strong>先讲问题。</strong>Vapor 的原语是“克隆模板,再绑定”。天真做法下,每个克隆出的元素都是一条 create/append op —— Vapor 的跨线程流量会比 vdom <em>更差</em>。</p><p>修复第一步:用 <code>REGISTER_TREE</code> 把结构只发一次。两条线程各自以相同的前序遍历分配 uid —— 于是根本不用传任何 id 映射。</p>`,
  // 42 跨线程 · 克隆
  `<p><strong>修复第二步。</strong>每个实例就是一条 <code>CLONE_TREE(base)</code> —— 主线程从这个 base uid 重走缓存好的结构,生成原生元素。</p><p>这些是 Vue Lynx 自己的 opcode;解释器和后台代码在同一个产物里,所以无需改 Lynx 引擎。结果:create-1k 上 −59% ops、−51% 字节。</p>`,
  // 43 Benchmark · 更新柱状图
  `<p><strong>核心结果。</strong>Vue 官方基准移植到 Lynx,同一个应用跑两种模式。后台线程开销 = 响应式 + 渲染 + ops 序列化 —— Vapor 的结构性优势在这里毫无遮掩地显现。</p><p>端到端的倍数要小些(2.1–6.3×),因为两种模式发出的 ops 几乎一样;主线程开销是共享的。</p>`,
  // 44 Benchmark · 账本
  `<p><strong>诚实的成绩单。</strong>别夸大 —— 创建是打平的(一开始慢 1.9×;是 ops 遥测把它推到持平)。代价是产物 +26%:Vapor 运行时加上 DOM 兼容垫片。首屏差异在噪声范围内。</p><p>绿 = 赢,粉 = 代价。数据:headless Chromium、Lynx for Web、中位数带 95% 置信区间。</p>`,
  // 45 工作流 · 一份源码两个渲染器
  `<p><strong>凭什么信它。</strong>Vapor 应用是<em>从 vdom 源码生成的</em> —— 唯一差别是 <code>vapor</code> 属性,所以负载逐字节相同。36/36 个受支持示例与其 vdom 孪生体做到 0.000% 像素差。</p><p>矩阵(<code>examples/vapor-support.json</code>,带每条目源码哈希)生成文档表格 —— 不会与验证输出发生漂移。</p>`,
  // 45b Vapor 上游测试 + 亲近性（对应 VDOM 那页 A7）
  `<p><strong>Vapor 也有了自己的上游测试(PR #232)。</strong>30 个 <code>runtime-vapor</code> spec 文件跑在真实的 <code>vue-lynx/vapor</code> 表面和 ShadowElement 树上:<strong>545 通过、120 skip、0 失败</strong>。skiplist 是一个<em>封闭清单</em> —— 每个被排除的测试都有理由,任何未归类项都会让配置加载直接失败。</p><p><strong>这些 skip 不是一堆坏掉的东西。</strong>SSR/hydration 加 vdom↔vapor 互操作占了不跑项的 57% —— 两者都不是 Lynx 兼容性信号(没有 SSR 表面;互操作是刻意不支持的)。浏览器专属平台再占 24%。测试设施只占不到 1%(对比 vdom 那边高达 59%),因为“原始 bundle 再导出”这招几乎消灭了私有 import 问题。这个移植还顺手抓到一个真 bug(ShadowElement 会被响应式代理;<code>__v_skip</code> 修掉了)。</p><p><strong>亲近性这一点。</strong>在真正触及元素表面的测试上,Vapor 以 81% 对 vdom 的 57% 通过 —— 而且<em>零行为级垫片</em>:生产版 <code>@vue/runtime-vapor</code> 原封不动跑在 ShadowElement 上,而 vdom 模式需要 1,074 行在执行路径里的模拟。Vapor 的宿主契约 —— 克隆模板 + 对节点的命令式 setter —— 天生就与 Lynx 更契合。(是契合度,不是速度。)</p>`,
  // 45c 统一跨框架矩阵（#266）
  `<p><strong>统一矩阵(PR #266)。</strong>IFR × VDOM/Vapor × ReactLynx,同一台机、同一把尺 —— 黑盒点击到 composed-DOM 收敛。风暴才是用户故事:<em>select</em> 是点状更新,<em>update</em> 是批量。随着行数增长,Vapor 的结构性优势(没有 vnode 树、effect 直接写节点)毫无遮掩地显现。</p><p>诚实地读:<strong>React 创建领先</strong>(create@10k 689 对 798 ms),<strong>Vue/Vapor 持续更新领先</strong>。“慢速几何平均”那一行是平衡:Vapor 1.10 对 React 4.27。绝对 ms 与机器绑定 —— <em>比值</em>才是可移植的结论。</p>`,
  // 45d select 风暴 × 规模
  `<p><strong>规模画面。</strong>selectStorm 跨 1k → 10k → 30k,每个 tick 只重选一行(点状更新)。VDOM 每轮重跑 render 并 diff 整张列表,曲线随 N 上扬;ReactLynx 在此之上再加自己的开销。Vapor 的响应式 effect 只碰变化的那个节点,曲线几乎压平 —— 差距随规模拉大(对 VDOM:1k 1.7× → 10k 8.2× → 30k 11.4×)。</p>`,
  // 46 那一个数字（mic-drop）
  `<p><strong>压轴数字。</strong>统一跨框架矩阵(PR #266),真实点击到 composed-DOM 终态。Vue 对 Vue 的头条:10k select 风暴上 Vapor <strong>8.2×</strong> VDOM(367 → 45 ms),update 风暴 2.1×;对 ReactLynx 约 23×。插桩 BG 约 9.8×,一次性操作被帧底掩盖,风暴才显出来。</p><p>让它悬一会儿。然后最后一页。</p>`,
  // 47 收束 · 拨一下开关
  `<p><strong>收尾返场。</strong>Vapor 是按应用、构建期的开关:插件选项、入口 import、<code>vapor</code> 属性。两个纯入口 —— <code>vue-lynx</code> 与 <code>vue-lynx/vapor</code> —— 于是 vdom 专属 API 在 Vapor 应用里会在构建期报错,而不是在运行时出乱子。</p><p>落地:“还是你早就在写的那套 Vue —— 只是多了一条编译期的快路。这就是那‘还有一件事’。”</p>`,
  // 90 E20 · 摇篮
  `<p><strong>框架作者为什么该关心 Lynx。</strong>Lynx 做过很多有趣甚至有争议的设计决定,而且还在继续:双线程、MTS、一台不在 DOM 上的真 CSS 引擎。这是一支深爱 Web、也有胆量和空间在必要处打破 Web 的团队。</p><p>对 Vue 而言:一个真正有奔跑空间的原生平台 —— 在这种空间里,一个 Vapor 原生渲染器,就是一个周末的 vibe 量。</p>`,
  // 91 E21 · 全景 · 左半
  `<p><strong>全景开始。</strong>线落下时逐一点名:Vue 的绿、React 的蓝、Svelte 和 Solid 隐约的黄、Octane 的红 —— 一种还在纺的新织物 —— CSS、Tailwind、Motion 和 Pretext、Rspack 的橘。整个 Web 生态,化作丝线。</p><p>它们全都收向同一个又细又有力的腰身。</p>`,
  // 92 E22 · 全景
  `<p><strong>压轴画面 —— 头一秒别说话。</strong>腰身绽开:左侧的每一种织物,重新织进 iOS、Android、Web、HarmonyOS、macOS、Windows、Linux,以及接下来的任何平台。</p><p>中间是那台又细又强的织机。整个论证浓缩成一张图:左半是 harness,右半是连接。停住,然后轻轻说:"Lynx 给你的,是织任何一种织物所需要的技艺 —— 和 harness。"</p>`,
  // 93 E23 · 德国 · 上
  `<p><strong>讲故事的时间 —— 降低翻页速度,放慢声音。</strong>上周我在德国带 workshop。一位学员说,AI 把开发的"乐趣"从他手里拿走了。我的回答很直接:你需要找到新的多巴胺。</p>`,
  // 94 E24 · 又死了
  `<p><strong>callback。</strong>有些朋友知道,我讲过一场"前端已死"。嗯 —— 按旧的定义,它确实又死了一次。让这句话悬着;反转在两页之后。</p>`,
  // 95 E25 · 德国 · 下
  `<p><strong>反例来了。</strong>另一位学员不同意:prompt 本身就是多巴胺 —— 那天晚上他 vibe 出了一整个宝可梦游戏。我知道有 AI 这不难。而我<em>很高兴</em>这不难 —— 我好久没这么兴奋过了。</p><p>坦白 AI 精神病环节:不睡前跑几个 <code>/goal</code> <code>/loop</code> 就睡不着;Fable 或 Codex 一挂就像戒断。在座的应该也有同感。</p>`,
  // 95a Overlay · 德国现场三连
  `<p><strong>证据甩上桌</strong> —— 两张照片夹着中间的竖屏视频,压在 quote 之上。中间的视频静音自动播放;照片带一点快照式的倾斜。</p><p>文件:<code>103-photo-1.png</code>、<code>103-video-portrait.mp4</code>、<code>103-photo-2.png</code>,放在 <code>slides/public/media/embeds/</code>。</p>`,
  // 95b Overlay · 宝可梦横屏
  `<p><strong>再点一下 —— 宝可梦,全宽登场。</strong>三连散去,横屏视频占满舞台。文件:<code>103-video-wide.mp4</code>。</p>`,
  // 96 E26 · 十年翻新
  `<p><strong>个人的证据。</strong>这一年我回头把 10 年前的自己想做的项目全都翻新了一遍:十年没动过的个人网站;我的第一个 Vue 项目,Vue 0.12;还有这套 deck —— 手 vibe 的 HTML,底下没有任何 slide 库,正是当年那个 slides 编辑器的直系后代。</p>`,
  // 97 E27 · 还是前端
  `<p><strong>转折。</strong>那我整天在做什么呢,从敲代码变成 prompt?我只是又换了一门语言 —— 汇编到 C 到 JS 到……自然语言。源变了,工作没变:我仍然在把人的意图,翻译成人能看见、能触摸的东西。</p><p>这从来就是这份工作。这<em>就是</em>前端。</p>`,
  // 98 E28 · 前端永生
  `<p><strong>真正的收尾。</strong>小字划掉:前端已死。大字:前端永生。谢谢 —— 这次是真的 —— 然后留在这页做 Q&amp;A。</p><p>Q&amp;A 弹药:"能上生产吗?" —— pre-alpha,架构稳,已覆盖的部分测试充分。"Android?" —— 同一份产物,两端都跑。"AI 会取代 Vue 吗?" —— 你刚看完整个答案。</p>`,
];
