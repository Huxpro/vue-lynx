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

// key = normalized English textContent · value = Chinese innerHTML
export const ZH = {
  // ---- Cover ----
  // Big title stays English ("Unlock Native for Vue"); only the tagline flips.
  'Develop Lynx with the familiar Vue 3.': '用熟悉的 Vue 3 开发 Lynx。',

  // ---- Chapter I · The gap ----
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

  // ---- Chapter II · demos ----
  // ---- API coverage ----
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
  // ---- Whole apps ----
  'Whole apps port, too.': '整个<span class="brand-text">应用</span>,也搬得动。',
  'The classic, verbatim — reactive state, v-model, computed totals. On a native input and native scroll.':
    '经典原样照搬 —— 响应式状态、<code>v-model</code>、computed 合计。跑在原生输入框、原生滚动上。',
  'Live API, infinite feed, comment trees — Vue Query for data, Tailwind for styling, native <list> for scroll.':
    '真实 API、无限流、评论树 —— 数据用 Vue Query,样式用 Tailwind,滚动用原生 <code>&lt;list&gt;</code>。',
  'native <input>': '原生 &lt;input&gt;',
  'native <list>': '原生 &lt;list&gt;',

  // ---- Chapter III · The upgrade ----
  'Upgrading to native.': '升级到<span class="brand-text">原生体验</span>。',
  'Native experience?': '原生体验？',
  'The Nuxt AI Chatbot, forked — streaming, reasoning, markdown, tool cards. Then the native interactions: the keyboard lifts the thread; send flies the bubble into the conversation.':
    'Nuxt 官方 AI Chatbot,fork 过来 —— 流式、思维链、markdown、工具卡片。再看原生交互:键盘托起对话流;发送让气泡飞进会话。',
  'Native gestures?': '原生手势？',
  'Elk — a production Mastodon client. Framework-agnostic layers reused; only the UI rebuilt on Lynx elements.':
    'Elk —— 生产级 Mastodon 客户端。与框架无关的层全部复用;只在 Lynx 元素上重建 UI。',
  'Sheet with Rubberband effect': '带<span class="brand-text">橡皮筋</span>效果的 Sheet',
  'Native Viewpager': '原生 <span class="brand-text">Viewpager</span>',

  'AI SDK streaming': 'AI SDK 流式',
  'reasoning': '思维链',
  'tool cards': '工具卡片',
  'theming': '主题系统',
  'keyboard avoidance': '键盘回避',
  'send motion': '发送动效',
  'MTS pressables': 'MTS 按压反馈',
  'One native event. One setNativeProps. No viewport hacks.':
    '一个原生事件,一次 <code>setNativeProps</code>。没有任何视口 hack。',
  "Send isn't an animation — it's a handoff, choreographed in frames.":
    '发送不是一段动画 —— 是一次按显示帧编排的<em>接力</em>。',
  'earlier turns stay masked until the motion starts':
    '动画启动之前,先前的对话保持遮蔽',
  'masto.js client': 'masto.js 客户端',
  'content pipeline': '内容管线',
  'theme system': '主题系统',
  'domain logic': '领域逻辑',
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
  'components': '组件',
  'pages': '页面',
  'composables': 'composable',
  'masto.js reused': 'masto.js 复用',
  'content-render retargeted': 'content-render 改目标',

  // ---- Chapter III · Elk draggable sheet ----
  'Three owners, in code.': '三个归属者,<span class="brand-text">用代码讲。</span>',
  "The drag runs on the main thread — so even while Vue's background thread fetches, diffs, or rebuilds the list, the sheet still tracks the finger. On the web, gesture JS and render share one thread.":
    '拖拽跑在主线程上 —— 于是即便 Vue 的后台线程正在请求数据、diff 或重建列表,sheet 依然跟手。<span class="dim">在 Web 上,手势 JS 与渲染共享同一条主线程。</span>',

  // ---- Chapter III · Elk collapsing profile ----
  'An X-grade profile, composed.': 'X 级折叠 profile,<span class="brand-text">组合而成。</span>',
  'Collapse the header, pin the tabs, page sideways — each pane keeps its own feed & scroll position.':
    '折叠头部、吸顶 tab、横向翻页 —— 每个 pane 各自保留自己的信息流与滚动位置。',
  'native scroll thread': '原生滚动线程',
  'one SFC · native + web preview': '一个 SFC · 原生 + Web 预览',

  'Main-Thread Script': '<b>主线程脚本</b>',

  // ---- Chapter IV · How we did it ----
  'And how was this built?': '那,它是<br/>怎么被做出来的?',
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
  // ---- Chapter IV · Runtime (dual-thread narrative) ----
  'The web runs on one thread — event, your JS, paint — and it all has to land inside a frame.':
    'Web 只跑在<em>一条</em>线程上 —— 事件、你的 JS、绘制,全都得挤进一<b style="color:#F27A9E">帧</b>里。',
  'Cross-platform pins native UI here too; pile an app on top and the budget blows.':
    '跨端还把 <b style="color:#9E86F0">Native UI</b> 也钉在这儿;再把整个 app 压上来,预算就爆了。',
  'Lynx drives native elements through the main-thread Element PAPI. If Vue runs here, reactivity, diff, your callbacks all fight Native UI — too much for one thread.':
    'Lynx 通过主线程的 <b style="color:#F27A9E">Element PAPI</b> 驱动原生元素。如果 Vue 跑在这儿,响应式、diff、你的回调全和 <b style="color:#9E86F0">Native UI</b> 抢线程 —— <em>一条线程扛不住。</em>',
  'Lift Vue onto a background thread. The runtime is off the UI now — but how does it drive elements it can no longer touch?':
    '把 Vue 抬上<b style="color:#5dd5a8">后台线程</b>。运行时离开了 UI —— 可它还怎么驱动那些够不着的元素?',
  'A ShadowElement tree fakes the DOM for Vue; edits leave as a flat ops buffer the main thread replays into Element PAPI.':
    '一棵 <b style="color:#E8B44A">ShadowElement</b> 树替 Vue 假扮 DOM;改动以扁平的 <b style="color:#4FB8F0">ops</b> 缓冲离开,主线程把它重放进 <b style="color:#F27A9E">Element PAPI</b>。',
  'Events ride back by numeric sign — handlers never leave Vue. One full lap across both threads is exactly one nextTick().':
    '事件靠数字 <em>sign</em> 回程 —— 回调从不离开 Vue。绕两条线程整整一圈,恰好就是一次 <code>nextTick()</code>。',
  '2 weeks · 160 commits': '2 周 · 160 次提交',
  "Vue core's own tests, replayed on our renderer. 0 fail.":
    'Vue core 自己的测试,在我们的渲染器上重放。<b>0 失败。</b>',
  "…and the tests are the AI's eyes.":
    '……而这些测试,就是 <span class="brand-text">AI 的眼睛</span>。',

  // ---- IV · Instant First-Frame Rendering + Element Templates ----
  // headlines
  'Straightforward IFR':
    '<span class="brand-text">Straightforward</span> IFR',
  'Both threads render. The ops stream is the recording.':
    '两条线程都渲染。那条 ops 流<span class="brand-text">就是</span>录制。',
  'IFR changes when the frame renders. Element Templates change how much work it does.':
    'IFR 改变的是<em class="ifr-em">何时</em>渲染这一帧。<br/><span class="brand-text">Element Templates</span> 改变的是这一帧要做多少活。',
  // leads
  'Without IFR, the first paint waits a whole lap — BG boot, render, the ops send — all before anything appears.':
    '没有 IFR,首帧要等<em>整整一圈</em> —— 后台启动、渲染、送 ops —— 全部跑完才有画面。',
  'IFR puts the whole runtime in the main-thread bundle — it renders during loadTemplate, so paint lands first and the background boots alongside.':
    'IFR 把整个运行时放进<b style="color:#56b8f0">主线程</b>产物 —— 它在 <code>loadTemplate</code> 期间渲染,于是<b>先出画面</b>,后台在一旁并行启动。',
  'IFR paints on the main thread during loadTemplate — then hydrate joins the two ops streams.':
    'IFR 在 <code>loadTemplate</code> 期间于<b style="color:#56b8f0">主线程</b>绘制 —— 然后 <b>hydrate</b> 把两条 ops 流 join 起来。',
  "The MT render records its ops; the BG's first batches hydrate against them. Correctness never depends on the two matching — deterministic ids & vue:N signs route taps to Vue with no rebinding.":
    '主线程渲染时录下自己的 ops;后台最初的几批拿去和它水合对账。正确性从不依赖两者一致 —— 确定性 id 与 <code>vue:N</code> 签名让点击无需重绑就路由回 Vue。',
  'Both threads render. The ops stream is the recording — the MT records its ops; the BG\'s first batches hydrate against them. Correctness never depends on the two matching.':
    '两条线程都渲染。那条 ops 流<span class="brand-text">就是</span>录制 —— 主线程录下 ops,后台最初几批拿去水合对账。正确性从不依赖两者一致。',
  'Both threads render. The ops stream is the recording — hydrate joins them. Correctness never depends on the two matching.':
    '两条线程都渲染。那条 ops 流<span class="brand-text">就是</span>录制 —— hydrate 把它们 join 起来。正确性从不依赖两者一致。',
  // dual-thread join labels (thread names reuse existing Main/Background keys)
  'records': '录制',
  'first batches': '最初几批',
  'hydrate · thread join': 'hydrate · thread join',
  // recon / join outcome pills
  'identical → skip': '相同 → 跳过',
  'value differs → patch in place': '值不同 → 原地打补丁',
  'value differs → patch': '值不同 → 打补丁',
  'structural → tear down & rebuild': '结构分歧 → 拆掉重建',
  'structural → rebuild': '结构分歧 → 重建',
  'Normally every static element pays the whole chain — a vnode, a shadow node, ops frames, a thread crossing, an interpreter dispatch.':
    '常规下每个静态元素都要付整条链 —— 一个 vnode、一个影子节点、若干 ops 帧、一次跨线程、一次解释器分发。',
  'Without ET, BTS and MTS IFR both pay the fat VDOM → opcode chain — just on different threads.':
    '没有 ET 时,BTS 和 MTS IFR 都要付那条肥胖的 <b>VDOM → opcode</b> 链 —— 只是跑在不同线程上。',
  'Without ET, BTS and MTS IFR both pay the fat 5-step data-flow — linked across the thread boundary.':
    '没有 ET 时,BTS 和 MTS IFR 都要付那条肥胖的 <b>5 步</b> data-flow —— 跨线程边界连在一起。',
  'Without ET, BTS and MTS IFR both pay the fat VDOM → opcode chain — five linked steps across the boundary.':
    '没有 ET 时,BTS 和 MTS IFR 都要付那条肥胖的 <b>VDOM → opcode</b> 链 —— 跨边界的五步连接。',
  'The compiler lowers the static subtree to one create() function. Vue sends one op; only the dynamic holes travel after.':
    '编译器把静态子树下沉成一个 <code>create()</code> 函数。Vue 只发<b>一个</b> op;之后只有动态空洞在传输。',
  'ET converts the static subtree into a compiled create() — BTS sends one op; MTS IFR runs that function as straight-line PAPI.':
    'ET 把静态子树编译成 <code>create()</code> —— BTS 只发<b>一个</b> op;MTS IFR 把它当直线 PAPI 跑。',
  'ET collapses the bridge to 3 steps — BTS sends one op; MTS IFR runs the compiled create() as straight-line PAPI.':
    'ET 把桥塌成 <b>3 步</b> —— BTS 只发一个 op;MTS IFR 把编译好的 <code>create()</code> 当直线 PAPI 跑。',
  'ET collapses the same dual-thread picture to 3 linked steps — BTS sends one op; MTS IFR runs create() as straight-line PAPI.':
    'ET 把同一张双线程图塌成 <b>3 步连接</b> —— BTS 只发一个 op;MTS IFR 把 <code>create()</code> 当直线 PAPI 跑。',
  '5 steps': '5 步',
  '3 steps': '3 步',
  '1 VDOM': '<b>1</b> VDOM',
  '2 Shadow': '<b>2</b> Shadow',
  '3 ops': '<b>3</b> ops',
  '4 interp': '<b>4</b> interp',
  '5 PAPI': '<b>5</b> PAPI',
  '1 vnode': '<b>1</b> vnode',
  '2 INSTANTIATE': '<b>2</b> INSTANTIATE',
  '3 create()': '<b>3</b> create()',
  'many ops / node': '每节点很多 ops',
  'stream →': 'stream →',
  'awaits hydrate': '等 hydrate',
  'applyOps': 'applyOps',
  'PAPI → paint': 'PAPI → paint',
  'create() → PAPI': 'create() → PAPI',
  'Static structure bakes into a create() skeleton; only the holes — dynamic text, class, style, attrs — stay on the vnode path.':
    '静态结构烘焙进 <code>create()</code> 骨架;只有空洞 —— 动态的文本、class、style、属性 —— 留在 vnode 路径上。',
  'Vue already ships compiler-hinted VDOM — a Block marks static structure vs dynamic holes. That hint is what we lower into create().':
    'Vue 本来就有 <b>compiler-hinted VDOM</b> —— Block 标出静态结构 vs 动态空洞。我们正是把这份 hint 下沉成 <code>create()</code>。',
  // dual-thread ET pipe / bridge blurbs
  'Background · BTS': '<i></i>后台 · BTS',
  'Main IFR · MTS': '<i></i>主线程 IFR · MTS',
  'VDOM tree → opcodes': 'VDOM 树 → opcodes',
  'same chain, local apply': '同一条链,本地 apply',
  'VDOM → one template op': 'VDOM → 一个模板 op',
  'opcode → create() PAPI': 'opcode → create() PAPI',
  'Walks ShadowElement, emits a long flat stream.':
    '走进 ShadowElement,吐出一长串扁平流。',
  'Records ops, applyOps → paint on-thread.':
    '录下 ops,本地 applyOps → paint。',
  'Emits INSTANTIATE_TEMPLATE + hole SET_*.':
    '发出 INSTANTIATE_TEMPLATE + hole 的 SET_*。',
  'Interpreter runs create() → paint.':
    '解释器跑 create() → paint。',
  'Block · static': 'Block · 静态',
  'Block · hole': 'Block · 空洞',
  'baked skeleton': '烘焙骨架',
  'dynamic hole': '动态空洞',
  // IFR8 · trees + sync wire
  'VDOM · sparse': 'VDOM · 稀疏',
  'native · create()': 'native · create()',
  'static ghosted · only holes named': '静态变灰 · 只有 <b>holes</b> 有名',
  'create() builds · same hole ids': 'create() 建树 · <b>同一套 hole id</b>',
  'tpl id · not the tree': 'tpl id · 不是整棵树',
  'values only · e.g. h0': '只有值 · 如 h0',
  'ops vs recording': 'ops 对账录制',
  'Structure never crosses — both bundles already share create(). The wire carries the tpl id and hole values; hydrate joins those ops.':
    '结构从不跨线 —— 两边产物里已经共享 <code>create()</code>。线上走的是 <b>tpl id</b> 和 <b>hole 值</b>;hydrate 把这些 ops join 起来。',
  'FCP across a real Web Worker + IPC (Lynx for Web) — suite median −12% to −19%, ReactLynx control −23%. ET stays flat on FCP; its win is render cost (~1,000 el, jitless) and ops payload.':
    'FCP:跨真实 Web Worker + IPC(Lynx for Web)—— 全套中位数 −12% 到 −19%,ReactLynx 对照 −23%。ET 对 FCP 基本持平;它的收益在渲染开销(约 1,000 元素,jitless)和 ops 负载。',
  'FCP with IFR · Lynx for Web':
    'FCP with IFR · Lynx for Web',
  'Suite median −12% to −19%. ReactLynx control −23%. ET stays flat on FCP — its win is the render cost and ops payload you just saw.':
    '全套中位数 −12% 到 −19%。ReactLynx 对照 −23%。ET 对 FCP 基本持平 —— 它的收益就是你刚看过的渲染开销与 ops 负载。',
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
  '2 weeks.': '<span class="brand-text">2</span> 周。',
  '160 commits': '160 次提交',
  '21 active days': '21 个活跃日',
  '1 human + Claude': '1 个人 + Claude',
  'The full write-up — harness, prompts, receipts. @Huxpro on X.':
    '完整复盘 —— harness、prompt、全部凭证。X 上的 <b>@Huxpro</b>。',
  // ---- Close · one npm command (fake thank-you) ----
  'Stars, questions, PRs': 'Star、提问、PR',
  'One npm command.':
    '一行 <span class="brand-text">npm</span> 命令。',
  'for Agent': '给 Agent',
  'Thank you.': '谢谢。',

  // ---- Epilogue · the elephant / fabrics ----
  'The elephant in the room.': '聊聊房间里的<br/>大象。',
  '“Vibe coding” is barely eighteen months old — and it already writes native apps. So why frameworks? Why Lynx? Why any of this?':
    '"vibe coding" 这个词诞生至今不过一年半 —— 它已经能直接写出原生应用了。那,还要框架干嘛?还要 Lynx 干嘛?这一切还有什么意义?',
  'Does AI obsolete all of us?':
    'AI 会让<span class="brand-text">我们所有人</span>都过时吗?',
  'no frameworks?': '不要框架?',
  'no libraries?': '不要类库?',
  'no docs?': '不要文档?',
  'no us?': '不要我们?',
  'Technology: from interface to Harness.':
    '技术：从接口到 <span class="brand-text">Harness</span>。',
  'Nobody says AI will replace the browser.':
    '没人会说,AI 要取代<span style="color:#4FB8F0">浏览器</span>。',
  'open by default': '天生开放',
  'sandboxed': '天然沙箱',
  'endlessly capable': '能力无穷',
  'fully observable': '完全可观测',
  'Frameworks were always harnesses.':
    '框架,从来都是 <span class="brand-text">harness</span>。',
  'then architecting how humans reason': '过去 <small>规训人类如何推理</small>',
  'now steering what models emit': '现在 <small>引导模型吐出什么</small>',
  'Every technology is a fabric.': '每一种技术,都是一种织物。',
  'Vue — a weave you can feel.': 'Vue —— 一种你能触到的织法。',
  'templates': '模板',
  'reactivity': '响应式',
  'mutable state': '可变状态',
  '“Getting metaphysical again — 雪碧 is going to roast me.”':
    '"又开始形而上了 —— 雪碧又要批评我了。"',
  'Lynx — the loom.': 'Lynx —— 织机。',
  '“A patchwork monster”? Exactly.':
    '"缝合怪"?—— <span class="brand-text">正是。</span>',
  'web-friendly surface': 'Web 亲和的表面',
  'strong native core': '扎实的原生内核',
  'hybrid rendering': '混合渲染',
  'Frameworks compress the search space.': '框架,压缩了搜索空间。',
  'everything the model could emit': '模型可能吐出的一切',
  'the idiom': '惯用法',
  // Stays English in both languages (like the cover title).
  '3D prints · 小音': '帮忙 3D 打印 · 小音',
  'a dinner in Fuzhou · 雪碧': '上一顿饭在福州 · 雪碧',
  'Poland, then here · Nector': '上一面在波兰 · Nector',
  'Evan · Anthony · you': 'Evan · Anthony · 还有你',
  "Vue Lynx isn't a framework. It's a connection.":
    'Vue Lynx 不是一个框架,而是一次<span class="brand-text">连接</span>。',
  'One connection compounds.':
    '一次连接,产生<span class="brand-text">复利</span>。',
  'Rendering': '渲染',
  'Agents': '智能体',
  'native': '原生元件',
  'custom': '自渲染',
  'hybrid': '混合',
  'Vapor on Lynx — no VDOM. Straight to ops.':
    'Vapor on Lynx —— 没有 VDOM,直达 <b style="color:#4FB8F0">ops</b>。',
  'A cradle for framework design.':
    '框架设计的<span class="brand-text">摇篮</span>。',
  'A team that loves the Web — and dares to break it.':
    '一支深爱 Web、也敢于打破 Web 的团队。',
  'One template — a whole spectrum of renderers.':
    '一份模板 —— 一整条渲染器的<span class="brand-text">光谱</span>。',
  'Even Vapor stays retained — it keeps pointers. But cross a thread up front and pointers can’t follow — so Lynx lives at the write-only end.':
    '连 <b>Vapor</b> 也仍是 retained —— 它保留着指针。可一旦上来就跨线程,指针跟不过去 —— 于是 Lynx 落在只写的那一端。',

  // ---- Λ closing arc · λ holes. tree ----
  'Two levers, orthogonal — they stack.':
    '两根杠杆,彼此正交 —— 还能叠加。',
  'Every template today was this one function — holes in, subtree out.':
    '今天的每一个模板,都是这同一个函数 —— 洞进,子树出。',
  'A compiler can run the static half early — partial evaluation. What remains is a residual skeleton, plus the holes that stay live.':
    '编译器可以把静态的那一半提前算掉 —— partial evaluation。剩下的,是一副残差骨架,和仍然活着的洞。',
  'Three compilers, one split. Vue calls it a Block, Vapor bakes it into template(), ReactLynx calls it a Snapshot — the λ is the same.':
    '三个编译器,同一次切分。Vue 管它叫 <b>Block</b>,Vapor 把它烘进 <code>template()</code>,ReactLynx 叫它 <b>Snapshot</b> —— 那个 λ,是同一个。',
  'Web · one thread — the residual is already native':
    '<b style="color:var(--ink)">Web · 单线程</b> —— 残差本来就已是原生',
  'no interpreter anywhere': '整条路径上,没有解释器',
  'Lynx · split — the residual must cross as data':
    '<b style="color:var(--ink)">Lynx · 双线程</b> —— 残差必须作为数据过线',
  'the wire re-opens the interpret side': '这条线,把解释侧重新打开',
  'On the Web, t0()’s clone was already engine-native. Cross a thread and the residual travels as data — and data brings the interpreter back.':
    '在 Web 上,<code>t0()</code> 的那次 clone 本来就是引擎原生的。跨过一条线程,残差就得作为<em>数据</em>旅行 —— 而数据,把解释器又带了回来。',
  'Compile the interpreter away.':
    '把<span class="brand-text">解释器</span>编译掉。',
  'Each rung compiles more of the interpreter away — partial evaluation, applied to the interpreter itself.':
    '每往下一档,就把解释器多编译掉一层 —— partial evaluation,施加在解释器自己身上。',
  'Where does the block come from?':
    '这份 <span class="brand-text">block</span> 信息,从哪儿来?',
  'vdom’s split is intrinsic; vapor’s is recovered — and recovery must be provable, so a fingerprint mismatch silently falls back to per-node. Upstream could make it declared.':
    'vdom 的切分是<b>内生</b>的;vapor 的是<b>恢复</b>出来的 —— 恢复必须可证明,指纹不合就静默回退 per-node。上游可以让它变成<b>声明</b>的。',
  'The render axis.':
    '<span class="brand-text">render</span> 轴。',
  'Flip only the render model and updates transform: the storm halves, selection collapses 8× — while create pays ~12% for the clone protocol.':
    '只翻转 render 模型,更新就换了世界:storm 腰斩,select 塌缩 8 倍 —— 而 create 为克隆协议付出约 12%。',
  'The +b axis follows the static fraction.':
    '<span class="brand-text">+b</span> 轴,跟随静态占比。',
  'Same flag, two screens: on a dynamic-heavy table +b barely moves FCP — quadruple the static fraction and the same flag returns −17%. The win tracks what the compiler can prove static.':
    '同一个 flag,两块屏:动态偏重的表格上 +b 几乎不动 FCP —— 把静态占比放大四倍,同一个 flag 就还你 −17%。收益,跟随编译器能证明为静态的部分。',
  '+ifr meets +b.':
    '<span class="brand-text">+ifr</span> 遇上 +b。',
  'IFR’s hydrate join must replay the recording — at 10k rows that tax outweighs the boot win (+22%). Add +b and the recording is one op per block: the same IFR turns −14%. Flags compose.':
    'IFR 的 hydrate join 要重放整份录制 —— 10k 行时这笔税压过启动收益(+22%)。叠上 +b,录制变成每个 block 一条 op:同一个 IFR 变成 −14%。flag,是可组合的。',
  'The open cell — vapor +b:c.':
    '空着的那一格 —— <span class="brand-text">vapor +b:c</span>。',
  'today · +b:d — data': '<i></i>今天 · +b:d —— data',
  'open · +b:c — code': '<i></i>空格 · +b:c —— code',
  'runtime string → wire': '运行时字符串 → 过线',
  'build-time parse → both bundles': '构建期解析 → 两份产物',
  'residual crosses every app boot': '残差在每次应用启动时过线',
  'residual never crosses at runtime': '残差在运行时从不过线',
  'The one unbuilt cell that stacks all three measured levers — vapor’s update wins, code-staged create, an IFR-sized recording. Probably the highest ceiling on the board.':
    '唯一能把三根实测杠杆全叠上的未建格 —— vapor 的更新优势、code 档的 create、IFR 尺寸的录制。大概率是整张棋盘上上限最高的一格。',
  'The catch: upstream hands us the residual only as a runtime string — we must parse it at build time and prove both parses equal, until declared codegen (#332) dissolves the gap.':
    '困境:上游只把残差装在运行时字符串里给我们 —— 我们得在构建期自己解析,并证明两次解析相等,直到声明式 codegen(#332)把这道鸿沟整个溶解。',
  'Full tables & charts — 1k/10k/30k, storms, FCP ladders: vue.lynxjs.org/guide/benchmark-unified.':
    '完整表格与图表 —— 1k/10k/30k、storms、FCP 阶梯:<a href="https://vue.lynxjs.org/guide/benchmark-unified" style="color:var(--vue-green)">vue.lynxjs.org/guide/benchmark-unified</a>。',
  'One axis at a time.':
    '一次只动<span class="brand-text">一根轴</span>。',
  'The render axis is the update lever. The template axes barely touch update — they are a create-and-protocol lever, and the win grows with the static fraction. +ifr only moves when the first frame paints.':
    'render 轴是更新杠杆。模板各轴几乎不碰更新 —— 它们是创建与协议的杠杆,收益随静态占比增长。+ifr 只挪动首帧<em>何时</em>画。',
  'Every boundary revives the interpreter. Every optimization compiles it back away.':
    '每一条边界,都会复活<em class="ifr-em">解释器</em>。<br/>每一次优化,都是<span class="brand-text">把它重新编译掉</span>。',
  'λ holes. tree — evaluated in four stagings. That was the whole talk.':
    'λ holes. tree —— 分四档求值。这,就是今天的全部。',
  'Cut a thread — what can cross the wire?':
    '切一刀线程 —— 什么能过桥?',
  'Only closed, first-order terms survive the cut — a flat ops stream, i.e. a display list.':
    '只有封闭的一阶项能扛过这一刀 —— 一串扁平的 ops,也就是一份 display list。',
  'Weave the whole Web…': '把整个 Web 织进来……',
  '…into every platform.': '……再织向每一个平台。',
  'more…': '<i></i> 更多……',
  '“AI took away the fun.”': '"AI 把乐趣拿走了。"',
  '— a workshop attendee · Germany, last week': '—— 一位 workshop 学员 · 上周,德国',
  'Find a new dopamine.': '去找新的多巴胺。',
  'The frontend is dead. Again.': '前端,确实又死了。',
  '“But prompting is the dopamine.”': '"可 prompt 本身,就是多巴胺。"',
  '— another attendee · he vibed a Pokémon game that night':
    '—— 另一位学员 · 他当晚 vibe 出了一个宝可梦',
  "I know AI makes it easy. I'm glad it's easy — I haven't been this excited in years.":
    '我知道有 AI 这不难。我很高兴这不难 —— 我好久没这么兴奋过了。',
  'Natural language.':
    '<span class="brand-text">自然语言</span>。',
  'The frontend is dead.': '前端已死。',
  'Long live the frontend': '前端<span class="brand-text">永生</span>',
  'Thank you — for real this time.': '谢谢 —— 这次是真的。',

  // ---- One more thing · Vue Vapor (the deep dive) ----
  // "Vue Vapor." stays English in both languages.
  "Templates compile straight to code that touches elements directly. We taught it to run on Lynx's two threads.":
    '模板直接编译成操作元素的代码。我们让它跑在了 Lynx 的两条线程上。',

  'Every change re-runs the component, rebuilds a VNode tree, and diffs it. Work scales with the whole tree.':
    '每次变更都要重跑组件、重建 VNode 树、再做 diff。开销随整棵树增长。',
  'No tree. No diff. A reactive effect writes straight to the one node that changed — work scales with what actually changed.':
    '没有树。没有 diff。一个响应式 effect 直接写入那个变化的节点 —— 开销只随真正变化的部分增长。',

  '① a template registered once · ② cloned per instance · ③ one effect that updates a single node.':
    '<span class="codenote">①</span> 模板注册一次 · <span class="codenote">②</span> 每个实例克隆一份 · <span class="codenote">③</span> 一个 effect 只更新一个节点。',
  'First question on Lynx: where does the template shape live on Main? Not baked into MTS — the first t0() ships this structure once.':
    'Lynx 上的第一个疑问:模板形状在 Main 上住哪儿?<em>不是</em>打进 MTS 产物 —— 第一次 <code>t0()</code> 把这份 <code>structure</code> 传过去,只传一次。',
  'Why not deliver the tree at build time? History, not essence: upstream Vapor codegen only emits an HTML string — BG parse + serialize was the cheapest path.':
    '为什么不在构建期交付这棵树?历史原因,而非本质:上游 Vapor 的 codegen 只给出 HTML 字符串 —— BG runtime 顺手 parse + 序列化,是最省事的路。',
  'That structure from the first t0() is cached on Main as an inert prototype. Both sides walk the same pre-order — same uids, no id map.':
    '第一次 <code>t0()</code> 传来的那份 <code>structure</code>,在 Main 上缓存成惰性原型。两侧走同一趟前序 —— 相同 uid,从不传 id 映射。',
  'structure AST · first clone only': 'structure AST · 仅第一次 clone',
  'REGISTER_TREE · first t0() only': '<code>REGISTER_TREE</code> · 仅第一次 <code>t0()</code>',
  '[16, id, structure, 0]': '<code>[16, id, structure, 0]</code>',

  "Vapor drives the browser DOM directly. We make the background thread's tree look like the DOM — so upstream Vapor runs untouched.":
    'Vapor 直接驱动浏览器 DOM。我们让后台线程的那棵树“长得像”DOM —— 于是上游 Vapor 原封不动地跑起来。',
  'Vapor drives the browser DOM directly — compiled through surface, one stack ending at HTMLElement. Upstream runs untouched.':
    'Vapor 直接驱动浏览器 DOM —— 从 compiled 到 surface,一整条栈,尽头是 <code>HTMLElement</code>。上游原封不动。',
  'On Lynx, relocate the pipe: BG holds the DOM-shaped stack; MT only ever sees the ops stream.':
    '在 Lynx 上,把管线挪个家:BG 握着 DOM 形的栈;MT 永远只看见 ops 流。',
  'browser DOM — HTMLElement': '浏览器 DOM —— <code>HTMLElement</code>',

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
  'Pointers can’t cross the boundary — so both sides walk the same pre-order and name every node alike. No id map is ever sent.':
    '指针过不了边界 —— 两侧于是各走<em>同一趟前序遍历</em>,给每个节点起一样的名字。从不传一张 id 映射表。',
  'create-1k across the boundary: 17,000 ops · 327 KB → 7,000 ops · 160 KB':
    'create-1k 跨越边界:<span style="color:var(--ink-mute);text-decoration:line-through">17,000 ops · 327 KB</span> → <b class="brand-text">7,000 ops · 160 KB</b>',

  'Where Vapor pulls away: 5.8–9.8×.':
    'Vapor 拉开差距的地方:<span class="brand-text">5.8–9.8×</span>。',
  'The entire delta is Vue work on the thread you share with your app logic — lower background cost means more headroom before dropped frames.':
    '整个差距都是 Vue 在那条你与应用逻辑共享的线程上的开销 —— 后台开销越低,离掉帧就越远。',

  'Big wins on updates and traffic; creation at parity; you pay in bundle size.':
    '更新与传输大幅领先;创建打平;代价是产物体积。',

  "Every example built & driven in both modes through Lynx for Web. The support matrix is generated from the run — it can't drift from what actually passed.":
    '每个示例都通过 Lynx for Web 在两种模式下构建并驱动。支持矩阵由运行结果生成 —— 不会与真正通过的结果发生漂移。',

  // ---- upstream-test slides (VDOM A7 skip breakdown + Vapor proof) ----
  '131 documented skips — every one a test-infra artifact or browser-only semantic, not a Lynx gap.':
    '131 个 skip 都有据可查 —— 每一个要么是测试设施产物,要么是浏览器专属语义,<b class="brand-text">没有一个是 Lynx 的缺口。</b>',
  "Vapor's own suite — unmodified on ShadowElement. It passes the element-surface tests at 81% vs vdom's 57%: the closer fit to Lynx.":
    'Vapor 自己的上游测试 —— 在 ShadowElement 上<b>原封不动</b>地跑。触及元素表面的那些测试,它以 81% 对 vdom 的 57% 通过:与 Lynx 更亲近的契合。',

  
  '① Vapor’s output needs addressable DOM pointers. ② Those addresses can’t cross threads.':
    '<span class="codenote">①</span> Vapor 的产物需要<em>可寻址</em>的 DOM 指针。<span class="codenote">②</span> 这些地址<em>过不了</em>线程。',
  'BG · shadow tree — walk & hold pointers':
    '<b style="color:var(--ink)">BG · shadow tree</b> —— walk &amp; 握指针',
  'MT · addressable tree — named / dense':
    '<b style="color:var(--ink)">MT · addressable tree</b> —— <span style="color:var(--ds-name)">named</span> / <span style="color:var(--ds-name)">dense</span>',
  'retained · Vue holds n1': 'retained · Vue 握着 <code>n1</code>',
  'structural · ops address by name': '结构型 · ops 按名寻址',
  '③ Same topology — different nodes. BG walks to hold pointers; MT holds names so writes can land.':
    '<span class="codenote">③</span> 同一套拓扑 —— <em>不同的节点</em>。BG walk 是为了握指针;MT 握着 <b style="color:var(--ds-name)">名字</b>,写操作才能落地。',
  'BG · ShadowNode — data (walkable)':
    '<b>BG · ShadowNode</b> —— 数据(可 walk)',
  'MT · AddressableNode — named / dense':
    '<b>MT · AddressableNode</b> —— <span class="hot">named</span> / dense',
  'VaporHost ⊆ VdomHost — ops on ShadowNode':
    '<b>VaporHost</b> ⊆ <b>VdomHost</b> —— 作用在 ShadowNode 上的 ops',
  'EngineFromBg — write / ops only':
    '<b>EngineFromBg</b> —— 只写 / 只有 ops',
  "Expressiveness, left to right: walk+mutate → names → write-only. Vapor’s host ops are a subset of VDOM’s on the same ShadowNode.":
    '表达力从左到右:walk+mutate → <span style="color:var(--ds-name)">名字</span> → 只写。Vapor 的 host ops 是同一棵 ShadowNode 上 VDOM 的<em>子集</em>。',
  'ShadowElement — shadow-element.ts':
    '<b>ShadowElement</b> —— <code>shadow-element.ts</code>',
  'AddressableNode — conceptual · dense':
    '<b>AddressableNode</b> —— <span style="color:var(--ds-name)">概念</span> · dense',
  'vapor imports ⊆ nodeOps — same ShadowElement':
    '<b>vapor imports</b> ⊆ <b>nodeOps</b> —— 同一棵 ShadowElement',
  'OP — internal/ops.ts · write by id':
    '<b>OP</b> —— <code>internal/ops.ts</code> · 按 id 写',
  "Three panels quote real code; only AddressableNode is a talk sketch. Vapor’s imports are a subset of nodeOps on the same ShadowElement.":
    '三格摘自真实代码;只有 <b style="color:var(--ds-name)">AddressableNode</b> 是讲稿素描。Vapor 的 import 是同一棵 <code>ShadowElement</code> 上 <code>nodeOps</code> 的<em>子集</em>。',
  'VDOM & Vapor · ShadowElement':
    '<b>VDOM &amp; Vapor</b> · <code>ShadowElement</code>',
  'Vapor · AddressableNode':
    '<b>Vapor</b> · <span style="color:var(--ds-name)">AddressableNode</span>',
  'Vapor uses a subset of what VDOM needs on this tree':
    'Vapor 用的是 VDOM 在这棵树上需求的<em>子集</em>',
  'same tree · Vapor skips the create / diff surface':
    '同一棵树 · Vapor 跳过 create / diff 那一层',
  'Vapor ⊂ VDOM on the same tree — top unused, bottom added':
    '同一棵树上 Vapor ⊂ VDOM —— 上面不用,下面另加',
  'same tree · each column is what that renderer drives it with':
    '同一棵树 · 每列是该渲染器用什么驱动它',
  'shared data': '共用数据',
  'VDOM only': '仅 VDOM',
  'both · ∩': '共用 · ∩',
  'Vapor only': '仅 Vapor',
  'create / walk / diff surface': 'create / walk / diff 那一层',
  'same BG tree · shared write': '同一棵 BG 树 · 共用写入',
  'compiled host — no create / insert / remove / patchProp':
    '编译产物宿主 —— 没有 create / insert / remove / patchProp',
  'simple on purpose — just enough to address across threads':
    '刻意简单 —— 只够跨线程寻址',
  'Same BG tree for both renderers; Vapor only needs a slice of it. Across the wire, Vapor adds one more thing: a name per slot.':
    '两个渲染器共用同一棵 BG 树;Vapor 只要其中一块。过线时 Vapor 多一样东西:每个槽位一个 <b style="color:var(--ds-name)">名字</b>。',

    'DOM-shaped stack': 'DOM 形的栈',
  'write / ops only': '只写 / 只有 ops',
  'looks like the DOM': '长得像 DOM',
  'no sync DOM walk from BG': 'BG 侧没有同步 DOM walk',
  'upstream runs untouched': '上游原封不动跑',
  'same ops stream as vdom': '与 vdom 同一条 ops 流',
  'shared with vdom mode': '与 vdom 模式共用',
  'Vapor expects a browser DOM. Split across threads: BG gets a DOM-shaped tree; MT only ever sees the ops stream.':
    'Vapor 期望的是浏览器 DOM。拆到双线程:BG 拿到一棵 DOM<em>形</em>的树;MT 永远只看见 ops 流。',
  'Make BG look like the DOM — @vue/runtime-vapor ships unmodified; those calls become the same ops vdom already uses.':
    '让 BG <em>长得像</em> DOM —— <code>@vue/runtime-vapor</code> 原封不动发布;那些调用变成 vdom 已经在用的同一串 ops。',
  "Vapor’s host contract is clone-a-template — each instance needs its own tree. Naively that’s create×N across the wire (worse than vdom). CLONE_TREE(base) makes it one named op per instance: 17k · 327 KB → 7k · 160 KB.":
    'Vapor 的宿主契约<em>就是</em>克隆模板 —— 每个实例要有自己的树。天真做法是跨线 create×N(比 vdom 更差)。<code>CLONE_TREE(base)</code> 把它收成每个实例 <b class="brand-text">一条命名 op</b>:<span style="color:var(--ink-mute);text-decoration:line-through">17k · 327 KB</span> → <b class="brand-text">7k · 160 KB</b>。',

  'Same layers as before — BG holds the DOM-shaped stack; MT only sees the ops stream.':
    '还是原来那些层 —— BG 握着 DOM 形的栈;MT 只看见 ops 流。',

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

export const ZH_NOTES = [
  // 0 纯黑开场 · 只有 beam
  `<p><strong>纯黑开场 —— 只有背景的光。</strong>先在黑暗里停一拍,再让第一个 logo 落下。</p>`,
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
  // 3a′ Overlay · PWA 跳到 #/36,放大
  `<p><strong>框放大,落到第 36 页</strong> —— 还是同一套 live deck,停在一个具体的 beat。放大一点让后排看得清;交互还是框内点、框外滚。</p>`,
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
  `<p><strong>亮相。</strong>这是 Vue Lynx 第一次正式出场 —— 标题在论证之后才落下:空缺是真的,门是开的,而这个项目正走进那扇门。</p><p>念出名字,让背景光呼吸一拍,然后直接进入 demo。</p>`,
  // serve-sim · ref() + 真机并排
  `<p><strong>从起点开始 —— 旁边就是真机模拟器。</strong><code>ref()</code>、事件处理、样式绑定。左边是 Lynx for Web(<code>&lt;lynx-view&gt;</code>);右边是经 <a href="https://github.com/EvanBacon/serve-sim">serve-sim</a> 推流的本地 iOS Simulator,挂在 <code>/.sim</code>。</p><p><strong>开讲前:</strong>先起模拟器 + 载入 hello-world 的 Lynx Explorer,再 <code>npx serve-sim --detach</code>。Vite deck 会自动挂上预览中间件。</p>`,
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
  // 28 Divider III
  `<p><strong>升级章节。</strong>移植证明的是下限;真正的卖点是向上:拿一个活着的 Web 应用,然后<em>升级</em>到原生体验 —— 该是 Vue 的地方还是 Vue,该用原生的地方全上原生。</p>`,
  // 29 AI Chat unchanged
  `<p><strong>这个 app 的交互。</strong>Nuxt 官方 AI Chatbot 模板逐特性移植后,再升级原生手感:① 键盘回避 —— 原生 <code>keyboardstatuschanged</code> + <code>setNativeProps</code>;② 发送动效 —— 气泡从输入框飞进对话流;③ MTS 按压反馈。</p><p><strong>现场:</strong>聚焦输入框(键盘升、布局跟),再发一条 —— 看气泡。</p>`,
  // 31 AI Chat · handoff（first send 视频）
  `<p><strong>AI Chat。</strong>从 Nuxt AI Chatbot 模板逐特性移植的生产级聊天：流式、推理、Markdown、工具卡片、历史 —— 迄今对 Vue Lynx 最苛刻的真实世界考验。</p><p><strong>写作视角</strong>（借鉴 Vercel 的 v0 iOS 复盘）：一次漂亮的发送不是一个动画,而是一次交接 —— 输入框、消息列表、键盘、流式响应之间的交接。接下来三页,把每个瞬间都追溯到背后的 API。</p><p><strong>现场演示:</strong>循环片段 —— first send 从输入框出发,落到锚点。</p>`,
  // 32 AI Chat · 键盘也是布局
  `<p><strong>键盘。</strong>Lynx 的 <code>&lt;input&gt;</code> 不会自动避让键盘。输入框绝对定位吸在底部,监听全局 <code>keyboardstatuschanged</code> 事件,用 <code>setNativeProps</code> 施加上报的键盘高度 —— 不绕后台线程。列表只在原本就跟随新内容时才继续跟随。</p><p>这个 mock 就是 v0 草图的思路:一块空白的 <em>contentInset</em> 被键盘吃掉,输入框正好抬升一个键盘高度。</p>`,
  // 33 AI Chat · 新一轮消息在顶部
  `<p><strong>第二次发送才是真正的考验。</strong>重复发送会暴露空状态藏起来的问题。原生把新的用户轮次锚定在顶部,但在移动的气泡到位前,让上一轮保持稳定。Vue Lynx 的 <code>nextTick()</code> 等待挂起的 ops 抵达主线程,再由 <code>scrollIntoView</code> 完成最终对齐 —— 然后助手才开始流式输出。</p><p><strong>Web 走另一套策略</strong> —— 没有原生定位保证,于是把列表钉在底部。手感一致,机制不同。</p>`,
  // 34 Elk gestures
  `<p><strong>这个 app 的形态。</strong>Elk 是生产级 Mastodon 客户端 —— 约 196 个组件、55 个页面、50 个 composable。保住大脑(masto.js、内容管线、主题),只把视图层重建到原生元素上。规模本身就是论证。</p><p><strong>现场:</strong>滚时间线、打开发帖 —— 感受一个复杂应用落在原生上的分量。</p>`,
  // 34c Elk · 可拖拽 sheet · 三个归属者（真实 UI + 代码）
  `<p><strong>可拖拽 sheet —— 难的不是"从底部滑上来",而是三套状态机协同。</strong>① Vue <code>&lt;Transition&gt;</code> 管"sheet 是否存在于视觉状态"(开/关);<code>v-show</code> 让节点保持挂载,关闭后滚动位置与状态得以保留,同时跑完整的 persisted transition 生命周期 —— 正是这项修复让该能力从 experimental 毕业。② 一个 <code>'main thread'</code> worklet 管"手指每一帧在哪":通过 <code>:main-thread-bindtouch*</code> 绑定,用 <code>setStyleProperty</code> 直接写 <code>transform</code>,绕开 Vue diff,并在拉过顶部时施加橡皮筋阻力。③ 原生 <code>&lt;scroll-view&gt;</code> 管"这串触摸属于谁":8px 手势锁先一次性判定方向与来源;若向下拖且列表已到顶,sheet 关掉原生滚动(<code>enable-scroll=false</code>)接管拖动,否则让给它。<code>runOnBackground</code> 只在状态边界(关闭时)跨线程,绝不每帧跨。</p><p><strong>结构即属性归属:</strong>外层 surface 归 Transition(CSS class),内层归拖动(inline <code>transform</code>)。两者写同一元素,inline 覆盖 class —— 经典的"第一次能动,之后动画消失"。</p><p><strong>双线程红利:</strong>拖拽跑在 UI 线程上,贴着原生输入与布局,即便 Vue 后台线程正在请求数据、diff 或重建列表也照样跟手;Web 上手势 JS 与渲染共享一条主线程,一有长任务就掉帧。</p>`,
  // 34b Elk · 原生 view pager
  `<p><strong>原生 view pager(已合入 PR #223)。</strong><code>elk-viewpager</code> 分支用原生 <strong>viewpager</strong> 元素(通过 <code>TabPager.vue</code>)承载 Explore / Notifications 标签。分屏以原生吸附滑动,并在滑动间保留内容与滚动位置。</p><p><strong>难点在于元素名按平台不同:</strong>Lynx for Web 提供旧名 <code>x-viewpager-ng</code>(今天可用);原生 OSS 引擎注册抽取出的 <code>viewpager</code>(需要基于 lynx develop 构建的宿主)。<code>TabPager.vue</code> 在运行时按 <code>SystemInfo.platform</code> 选标签名。</p><p><strong>双向同步:</strong>点标签 → <code>selectTab()</code> 动画切页;滑动分页 → 其 <code>change</code> 事件移动激活标签。</p>`,
  // 34e Elk · 折叠 profile · 组合
  `<p><strong>移动端最难的布局,靠组合做出来。</strong>折叠头部 + 吸顶 tab + 横向翻页 + 每个 pane 各自纵向滚动 —— Twitter/X 的 profile。Web 上这是重型库(react-native-collapsible-tab-view、Android 的 CoordinatorLayout)在和主线程搏斗;这里是一次原生元件的组合,跑在平台自己的滚动线程上。</p><p><strong>Native UX ← Web DX。</strong>Lynx 把原生构件暴露成元件:<code>&lt;scroll-coordinator&gt;</code>(声明式的嵌套滚动交接:先折叠头部,再把滚动交给当前 pane 的列表,零 JS 滚动监听)、抽取出的 <code>&lt;viewpager&gt;</code>(原生吸附翻页 + 每个 pane 状态保留)、以及每个 pane 一个复用型 <code>&lt;list&gt;</code>。我们在一个 Vue SFC 里把它们组合起来。唯一的平台接缝就是标签名(Lynx for Web 的 <code>x-foldview-ng</code>/<code>x-viewpager-ng</code> ↔ 原生的 <code>scroll-coordinator</code>/<code>viewpager</code>)。</p><p><strong>一套代码,两个目标:</strong>同一个 SFC 既渲染真正的原生 profile,又渲染文档站里的 Lynx-for-Web 预览。tab 栏与翻页器通过原生 <code>selectTab</code>/<code>change</code> 方法双向同步,而非合成 DOM 事件。</p>`,
  // 35 Divider IV · How we did it
  `<p><strong>工程章。</strong>刚才看到的一切,是一个人两周做出来的 —— 这一章诚实回答"怎么做到的"。三次适配,每一次都揭开 Lynx 架构的一角:把 Vue 拆上双线程而不破坏语义;让一条工具链吐出两个世界;再让主线程本身可编程。AI harness 贯穿全程。</p>`,
  // N0 · 单线程帧预算困境(Web)
  `<p><strong>从大家都熟的地方讲起。</strong>Web 是单线程的:布局、绘制、手势、你所有的 JS 共用一条线程。全得挤进一帧 —— 这是房间里已经能感觉到的挤压。</p>`,
  // N0b · 跨端把 Native UI 也钉上来
  `<p><strong>跨端让事情更糟。</strong>Native UI <em>必须</em>待在主(UI)线程上 —— 同一条 lane,同一份帧预算。钉在这儿,再把整个 app 压上来,预算就爆了。这是每个跨端运行时都要回答的困境。</p>`,
  // N1 · Element PAPI 在主线程 —— Vue 待不住
  `<p><strong>Lynx 在这条线程上的合同。</strong>主线程通过 <em>Element PAPI</em> —— <code>__CreateView</code>、<code>__SetAttribute</code>…… —— 驱动原生元素。如果 Vue 跑在这儿,响应式、diff、你的回调全和 Native UI 抢同一条线程 —— 一条线程扛不住。真正的问题是:怎么把 Vue <em>挪出</em>主线程,又不丢掉它对元素的掌控?</p>`,
  // N2 · Vue 上后台线程 → 缺口
  `<p><strong>第二个决定:Vue 住哪条线程?</strong>Lynx 原生就把事件送到后台线程,所以我们把整个运行时放在那里:响应式、diff、生命周期、你的回调。不是 fork —— 是原封不动的 <code>@vue/runtime-core</code>。但 Vue 的渲染器要同步的 DOM 节点,而真实元素在一条线程之外。这就是下一页要补上的缺口。</p>`,
  // N3 · ShadowElement + ops(时序)
  `<p><strong>从左到右当时序读。</strong>Vue 官方的 <code>createRenderer()</code> 要同步节点,于是 nodeOps 在后台线程维护一棵轻量 <em>ShadowElement</em> 链表(满足 Vue 的所有同步读取),同时把真正的工作排队。更新以扁平的 <code>ops</code> 数组跨过边界(只有数字和字符串,一个 tick 一次发送),主线程把它们直接重放进 Element PAPI —— 重放本身<em>就是</em>一个 switch 循环,不值得单画一个"解释器"块。VDOM → ShadowElement → ops → PAPI → Native UI,一条直线。</p>`,
  // N4 · 收成环 —— 一圈 = nextTick
  `<p><strong>直线收成一个环。</strong>函数不能跨线程,所以从来不跨:每个回调注册一个数字 <em>sign</em>;主线程派发 sign,后台线程查表,就地调用你的 Vue 函数。回程一接,环就闭合 —— 这张图绕一整圈,<em>就是</em>一个 <code>nextTick()</code>,和 Web Vue 同一个心智模型,只是跨了一条线程。这也是线程唯一一次渗进你的代码:<code>onMounted(() =&gt; nextTick(() =&gt; lynx.createSelectorQuery()…))</code>。</p>`,
  // 42 A7 · 上游测试
  `<p><strong>"语义保全"是可测量的命题。</strong>我们把 <code>vuejs/core</code> 的测试套件搬进仓库,在两层上对着 Vue Lynx 跑:一层用我们真实的 ShadowElement 链表垫在 <code>@vue/runtime-test</code> 下面(验证完整渲染器合同 —— keyed diff、LIS、fragment、生命周期);另一层 runtime-dom 把 <code>patchProp → ops → applyOps → PAPI</code> 推进 jsdom。1013 个通过 882,131 个 skip 全部有记录,零失败。</p>`,
  // 43 A8 · 测试是 AI 的眼睛
  `<p><strong>测试的 AI-harness 一面。</strong>我们还做了 <code>vue-lynx-testing-library</code> —— <code>render</code>、<code>fireEvent</code>、<code>getByText</code>,双线程被 <code>@lynx-js/testing-environment</code> 抽象掉 —— 组件行为在普通 vitest 里就能断言。对人来说这是卫生习惯;对 AI harness 来说这是<em>感知</em>:红绿就是 agent 知道自己刚才做了什么的方式。上游套件,就是让两周生成代码保持诚实的 reward signal。</p>`,
  // 44 B1 · 一个 bundle 两个世界
  `<p><strong>Lynx 的交付物是一个装着两个程序的 bundle</strong> —— 后台代码跑在 JS VM,主线程代码跑在 Lepus(PrimJS)。两个 VM、两个入口、一个产物;同一个文件既能原生渲染,也能经 Lynx for Web 跑在浏览器里。于是工具链的问题变成:一次构建,怎么从一份 Vue 代码吐出两个世界?</p>`,
  // 45 B2 · 同一份代码进两次
  `<p><strong>两个入口都 import 你的真实应用。</strong>每个入口在一个 webpack <em>layer</em> 下编译 —— <code>vue:background</code> 和 <code>vue:main-thread</code> —— <code>issuerLayer</code> 规则给每层各自的 loader 链:BG 侧编译完整 SFC;MT 侧只抽取主线程需要的部分。逐 entry 的隔离,是 webpack 依赖图白送的。(这套 layer 方案我们是从 ReactLynx 学来的 —— 第一版扁平 bundle 架构隔离不了多入口应用。)</p>`,
  // 47 B4 · CSS 就是 CSS
  `<p><strong>整章样式能力背后安静的超能力:</strong>Lynx 在原生侧带了真正的 CSS 引擎 —— 选择器、级联、动画。所以 <code>&lt;style scoped&gt;</code> 映射到 Lynx 的 cssId 作用域,CSS Modules 和外链样式直接透传,CSS 里的 <code>v-bind()</code> 骑在 CSS 变量上,Tailwind 能跑是因为 PostCSS 就是 PostCSS。没有 StyleSheet 对象方言,没有会漏的翻译层。</p>`,
  // 48 C1 · 手势为什么会迟
  `<p><strong>先认账再卖点。</strong>和文档里的 <code>&lt;Go&gt;</code>（<a href="https://vue.lynxjs.org/guide/main-thread-script">vue.lynxjs.org/guide/main-thread-script</a>）同一个 demo：滚黄色列表 —— 蓝方块走后台线程，每一帧两次跨线程，跟手会有可见延迟。</p><p><strong>现场：</strong>快滚列表，看方块掉队。</p>`,
  // 49 C2 · 函数换线程
  `<p><strong>看方块移动。</strong>文档 <code>&lt;Go&gt;</code> 的对比：左边方块跑在主线程（<code>'main thread'</code>），右边仍走后台 —— 一滚就能摸到差别。还是同一个 Vue 文件；一条指令把处理函数换了线程。</p><p><strong>现场：</strong>滚动 —— 左边（MT）跟手，右边掉帧。</p>`,
  // 50 C3 · 代码样例
  `<p>MTS 的全部表面积,一个文件讲完:<code>'main thread'</code> 标记函数,<code>main-thread-bind*</code> 挂到事件上,<code>useMainThreadRef()</code> 给出同步元素访问 —— <code>setStyleProperty</code> 在手指移动的同一帧落地。</p><p><strong>先复用,再演化。</strong>引擎层我们直接跑 ReactLynx 的 worklet runtime 和它的 API 形状(<code>main-thread-bind*</code>、<code>useMainThreadRef</code>)—— 久经考验,而且在 Lynx 生态里通用。但 Vue 值得 Vue 形状的人体工学:想象 <code>&lt;script main-thread setup&gt;</code>、主线程的 computed/watch。这个设计空间是开放的 —— 也是社区留下印记的好地方。</p>`,
  // 51 C4 · 教程复刻
  `<p><strong>复刻即证明。</strong>lynxjs.org 用两个教程教 MTS,都是为 ReactLynx 写的。两个都在 Vue Lynx 上重做了,live 在我们的文档站上 —— 同样的拖拽物理、同样的吸附、同样的主线程滚动条。平台教程能干净地移植过来,能力就是真的在。</p><p><strong>现场:</strong>慢慢拖 —— 指示器逐像素同步;一甩,吸附。</p>`,
  // IFR0 · 小节标题
  `<p><strong>Instant First-Frame Rendering。</strong>工程章最后一块:在后台还没准备好之前画出首帧 —— 再用 Element Templates 让这一笔本身变便宜。</p>`,
  // IFR1 · 空白首帧
  `<p><strong>往返的代价。</strong>前六页讲的 VDOM → ShadowElement → ops → PAPI,在第一帧之前必须先整整跑一圈。设备上,这一圈再加后台线程启动与 bundle 求值,就是几十毫秒的白屏。</p>`,
  // IFR2 · IFR:先出画面 + join
  `<p><strong>首屏直出 —— 从 ReactLynx 移植。</strong>开了 <code>enableIFR</code>,主线程产物就带上完整 Vue 运行时 + 应用(不只是 worklet)。<code>renderPage</code> 在 <code>loadTemplate</code> 里同步挂载 —— 看 <strong>paint</strong> 旗标跳到左边。主线程<em>录下</em>自己的 ops;后台并行启动并送出最初几批。发光的 pill 就是 join —— 下一页打开它里面是什么。</p>`,
  // IFR3 · Straightforward IFR
  `<p><strong>Straightforward IFR —— hydration 当作 thread join。</strong>没有特殊的首帧格式:同一份 Vue 运行时 + 应用(同一套 <code>nodeOps</code>)在 <code>loadTemplate</code> 期间跑在主线程上并<em>录下</em>扁平 ops 流。后台并行启动,随后最初的 <code>vuePatchUpdate</code> 批次逐帧走这份录制 —— 是一次 join,不是重写:相同 → 跳过,值不同 → 打补丁,结构分歧 → 拆掉重建。不一致只损失性能收益,绝不损失正确性(开发期打印 <code>IFR hydration mismatch</code>)。确定性 id 与 <code>vue:N</code> 签名让点击无需重绑就路由回 Vue。</p>`,
  // IFR7 · Compiler-hinted Block → ET（紧接 Straightforward）
  `<p><strong>进入 Element Templates —— 从 Vue 的 Block 说起。</strong>hydrate 仍然在 join 两条肥胖路径。Vue 的编译器早就把模板切成 Block:静态节点 vs 动态空洞(<code>patchFlag</code> / dynamicChildren)。Element Templates 复用这份结构 —— 把静态壳烘焙进 <code>registerElementTemplate(id, holes, create)</code>,只把空洞留在 vnode 路径。可下沉 = 纯 Lynx 元素且只有值/文本动态;组件、插槽、<code>v-if</code>/<code>v-for</code> 宿主、<code>&lt;list&gt;</code>、ref/id 留在普通路径(它们的纯元素子体仍可下沉)。下一页:两边的稀疏树,以及线上到底同步了什么。</p><p><strong>给结尾埋的种子:</strong>编译器在这里做的其实是 <em>partial evaluation</em> —— 模板是一个以洞为参数的函数,Block 就是它的静态残差。这个名字,演讲结尾正式请出来。</p>`,
  // IFR8 · 双线程树 + 同步内容
  `<p><strong>两边的树分别是什么。</strong>BTS 侧是稀疏的 VDOM / ShadowElement:静态节点仍在(满足 Vue 的同步读取),但对协议隐形(变灰);只有 hole 有名字(<code>h0</code>…)。MTS IFR 用编译好的 <code>create()</code> 物化同一形状 —— 一棵原生元素树,hole id 对齐。这份稀疏,正是上一页编译出来的 Block。</p><p><strong>同步了什么。</strong>和 Vapor 的 <code>REGISTER_TREE</code> 不同,ET 不传结构:<code>registerElementTemplate</code> 已经把 <code>create()</code> 打进两边产物。跨线只有 <code>INSTANTIATE_TEMPLATE(tplId)</code>(每个实例一次)+ hole 的 <code>SET_*</code> 值。IFR 下 MTS 首屏已录下这些 ops;BTS 最初几批拿去和录制对账 —— 仍是 Straightforward IFR 那次 skip / patch / rebuild join。下一页:没有 ET 时,两条线程仍走肥胖的五步路径。</p>`,
  // IFR5 · 原双线程图 + 中间 5 步连接
  `<p><strong>同一份代码,两条线程,仍然很贵。</strong>还是原来那两列 —— 中间编号芯片点亮共享的 5 步协议:VDOM → Shadow → ops → interp → PAPI。BTS 发出流;MTS IFR 录下并本地 apply。IFR 改的是<em>何时</em> paint —— 下一页把这五条连接塌成三条。</p>`,
  // IFR6 · 同一张图,连接 5→3
  `<p><strong>同一张图,更少连接。</strong>看 2–4 步折进一个 <code>INSTANTIATE_TEMPLATE</code> 芯片;VDOM 和 PAPI/<code>create()</code> 留在原地(magic-move)。BTS 仍从 VDOM 起步,但静态块是一个 vnode,只发 INSTANTIATE + hole SET_*。MTS IFR 的解释器调用烘焙好的 <code>create()</code>。下一页:一句话收束 —— IFR 改<em>何时</em>;Element Templates 改做多少活。</p>`,
  // IFR4 · Element Templates 转折（收束）
  `<p><strong>两个杠杆,一句话。</strong>你刚看完 BTS↔MTS 共享 data-flow 从五步塌成三步。IFR 把绘制提前;Element Templates 让渲染本身便宜一个数量级 —— 而且瘦身的是<em>每一次</em>更新的跨线程协议,不只首帧。下一页:数字。</p><p><strong>种子:</strong>"两根正交的杠杆"正是全部要点 —— 演讲结尾我们把它们写成 flag(+ifr、+b),摊开整棵决策树。</p>`,
  // IFR10 · 基准测试图（ops / 渲染开销）
  `<p>左:渲染开销随 ET 塌陷。右:静态偏重屏幕的跨线程协议从约 78KB 降到 69 字节。PAPI 调用次数只降 5–20% —— 原生元素工作是共享地板;被下沉掉的是框架 JS 和它周围的协议。</p>`,
  // IFR9 · FCP 大字 −22%
  `<p><strong>标题数字。</strong>FCP:跨真实 Web Worker + IPC(Lynx for Web)—— 这一行 −22%,全套中位数 −12…−19%,ReactLynx 对照 −23%。收益来自去掉后台启动 + IPC —— 两种 IFR 配置都能拿到。ET 对 web FCP 基本持平;它自己的收益你上一页已经看过(渲染开销与 ops 负载)。代价:约 2.26× gzip,TTI proxy ~1.36×。</p>`,
  // H1 · 2 weeks + X 复盘(合并)
  `<p><strong>现在这个数字说得通了 —— 顺便告诉大家去哪儿读。</strong>这一章的一切 —— 渲染器、工具链、MTS —— 是两周的夜晚和周末做出来的:plan 写成 spec,agent harness 执行,上游测试当 reward signal,AGENTS.md 固化调试手册。完整方法论写在 X 上(这里内嵌了,vue.lynxjs.org 首页的 badge 也链着它)—— 扫码就能在手机上读。给在座各位一个安静的结论:Lynx 出乎意料地 <em>AI 可读</em> —— Web 标准的 API 和真 CSS,意味着模型的 Web 直觉基本直接迁移。然后收束:"这就是它怎么被做出来的 —— 接下来看看它加起来意味着什么。"</p>`,
  // 65 Close · 一行 npm 命令（含原 combine / 搭把手 / 另一个团队 / what's there / 假收尾）
  `<p><strong>标题句,然后请求。</strong>Vue × Lynx = Vue 跑在原生上。也很希望你能搭把手 —— 架构很稳;Vue 的表面积很大。记住这句:<em>原生,不该是另一个团队的事</em>。已经有的:Composition API 与 SFC、Transition/Suspense/KeepAlive/Teleport、Pinia/Router/Query/Tailwind、Main-Thread Script。还缺的:view pager 与更多手势、Vue DevTools、等你来移植的生态。</p><p><strong>行动号召。</strong>一行命令 —— <code>npm create vue-lynx@latest</code>。"给 Agent"按钮会复制一段引导 prompt。承诺:"今晚回家的公交上,你就能让一个 Vue 应用跑在 iPhone 上。"</p><p><strong>假收尾。</strong>演得越真越好:道谢、微微鞠躬、伸手去拿水 —— 停住,等掌声起来。然后面无表情:"啊——没有哈。这才过去十分钟。"翻页,进入真正的后半场。</p>`,
  // 71 Epilogue divider · 大象
  `<p><strong>重置全场。</strong>"那,用省下来的十分钟,聊聊房间里的大象。"如果 AI 什么都能做,为什么不直接 prompt 出 N 个原生应用,跳过框架、跳过跨端、跳过这一切?</p><p>语气转变:少一点产品推介,多一点自言自语。这半场讲的是 <em>why</em>,不是 <em>what</em>。</p>`,
  // 71a Overlay · 推文上半
  `<p><strong>推文本尊,浮在 divider 之上。</strong>2025 年 2 月 2 日 —— Karpathy 造出 "vibe coding" 这个词。先露上半截:<em>"fully give in to the vibes, embrace exponentials, and forget that the code even exists."</em></p><p>文件:<code>slides/public/media/embeds/79-vibe-coding.png</code> —— 一整张全高截图,由这个窗口裁切。</p>`,
  // 71b Overlay · 推文下半
  `<p><strong>下移 + 轻微放大</strong> —— 下半截:<em>"It's not too bad for throwaway weekend projects…"</em> 十八个月后,它已经在写原生应用了。让这句落地,翻页 —— 推文淡出,进入提问。</p>`,
  // 72 E2 · 诚实的问题
  `<p><strong>先诚实:我不知道。</strong>AI 对 Lynx、对 Vue 意味着什么,我为什么还要费这个劲?如果没有人类会读,文档还重要吗?如果模型能从裸金属重建,类库还重要吗?</p><p>可以丢的数据点:AI 时代 React 的使用量反而<em>暴涨</em> —— 模型默认写 React —— 但 React 本身却没有过去那么重要了;Anthropic 刚写过 Claude 用纯 HTML 搓一次性内部工具、什么框架都不用。地面真的在动。</p>`,
  // 73 E3 · 技术：从接口到 Harness（含原「留下来」「harness 定义」）
  `<p><strong>什么能在 AI 之后留下来?</strong>从 AI 手里"幸存"下来的,是所有<em>使能</em>而非仅仅产出的东西:基础设施 → 使能者 → 平台 → 生态 → 人。每一环都因为喂养下一环而幸存。两个引理:(1) 技术从 interface 翻转为 harness;(2) 技术真正的工作,是连接生态 —— 和人。</p><p><strong>引理一 —— 技术栈被重写了。</strong>自然语言是新的源代码;agent 是新的 interface,坐在 IDE 和 GUI 曾经的位置上。agent 下面:code、frameworks、system —— 没有消失,变成了 agent <em>驾驭的对象</em>。技术的工作翻转了:从直接服务人,变成 harness 那个服务人的东西。</p><p><strong>AI 什么都能做 —— 只要有好的 harness。</strong>Harness 把原始能力变成可靠工作:上下文(文档 · 先验 · AGENTS.md)、工具(函数 · 能力)、环境(运行时 · 沙箱)、反馈(渲染 · 测试 · 日志)。第四章其实偷偷讲的就是这拍:AGENTS.md 是上下文,工具链是工具,LynxExplorer 是环境,上游测试是反馈。</p>`,
  // 74 E4 · 浏览器是个好 harness
  `<p><strong>平台之所以幸存,是因为平台是极好的 harness。</strong>浏览器:开放的数据与文档(上下文)、巨大的能力表面(工具)、天然的沙箱(环境)、彻底的透明 —— DOM、DevTools(反馈)。</p><p>没有人argue Web 会被 AI 淘汰。我甚至更进一步:GUI 本身都不会 —— 人类总要<em>看</em>。</p>`,
  // 75 E5 · 框架一直是 harness
  `<p><strong>让框架与 AI 相关的那次重构。</strong>在 Web 上你本来爱怎么改 DOM 都行 —— React 和 Vue 赢,是因为它们<em>约束</em>了我们:一种架构,把人类的推理 harness 成吐出下一个正确 token 的过程。</p><p>我们才是第一批被 harness 的 token 预测器。模型只是下一批。高层抽象仍然有用 —— 它帮过我们,也会帮它。</p>`,
  // 78 E8 · FABRIC I
  `<p><strong>本章的意象登场。</strong>先让线呼吸一会儿再开口。在我"前端已死"的演讲里,我试着从第一性原理论证:UI/App 抽象永远都需要 —— 意图与像素之间,总要有一层织物。现代软件是缝出来的,不是凿出来的。</p><p>于是,贯穿后半场的比喻:每一种技术都是一种织物 —— 有自己的纤维、自己的织法、自己的手感。</p>`,
  // 79 E9 · Vue 的质地
  `<p><strong>织得更密了。</strong>不同的织物有不同的特性 —— 而 Vue 的质地也许正是你想要的:模板、细粒度响应式、"直接改就行"的可变状态、单文件组件。</p><p>重点不是 Vue 对谁。重点是<em>材质</em>依然重要 —— 对选择它的人重要,对在它的海洋里训练出来的模型也重要。</p>`,
  // 80 E10 · meme 幕间
  `<p><strong>喘口气。</strong>进入引理二之前的自嘲一拍 —— 知乎上雪碧吐槽的"黄玄式回答"。把 meme 放进来,收下笑声,继续。</p>`,
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
  // 86 E16 · 连接复利（含原「能 vibe 的地方」）
  `<p><strong>连上 Lynx,就连上了 Lynx 连接的一切。</strong>你已经在用的 Web 织物 —— Motion、Pretext —— 直接带过来;经 Node-API 连 Electron;JSI 世界连 Expo Modules;每一种渲染策略;正在成形的 agent-UI 协议。还有 Lynx 自己的生态 —— Sparkling、Lynxtron。</p><p>被带过来的,是生态和社区本身。这就是复利。</p><p><strong>AI 要的不是成熟的类库,而是一个能 vibe 的地方。</strong>键盘前坐着 agent 的时候,你需要的甚至不是成熟的类库 —— 而是一个试错便宜、可观测、够安全的平台。Web 之所以是 Web,靠的就是这个。Lynx 的赌注,是把这个性质带到原生。</p>`,
  // 87 E17 · One more thing
  `<p><strong>停住。</strong>数两拍,再翻页。</p>`,
  // ---- One more thing · Vue Vapor deep dive (12 slides) ----
  // 36 Vapor 标题 + 开关代码（原“拨一下开关”并入）
  `<p><strong>Vapor 是什么 —— 没有虚拟 DOM。</strong>Vue 3.6 基于编译的渲染器:没有 vnode 树,没有逐组件 diff。预发布状态 —— 锁定在 <code>vue@3.6.0-beta.17</code>。</p><p><strong>同一份源码 —— 拨一下开关。</strong>按应用、构建期的开关:插件选项、入口 import、<code>vapor</code> 属性。两个纯入口 —— <code>vue-lynx</code> 与 <code>vue-lynx/vapor</code> —— 于是 vdom 专属 API 在 Vapor 应用里会在构建期报错,而不是在运行时出乱子。</p><p>我们要用数据支撑的主张:同样的 Vue,更新路径的开销小得多。</p>`,
  // 43+44 Benchmark · 更新柱状图 + 账本（合并）
  `<p><strong>核心结果 —— 再看诚实的成绩单。</strong>Vue 官方基准移植到 Lynx,同一个应用跑两种模式。后台线程开销 = 响应式 + 渲染 + ops 序列化 —— Vapor 的结构性优势在这里毫无遮掩地显现(5.8–9.8×)。端到端的倍数要小些(2.1–6.3×),因为两种模式发出的 ops 几乎一样。</p><p>别夸大:创建是打平的;代价是产物 +26%(Vapor 运行时 + DOM 兼容垫片)。首屏差异在噪声范围内。绿 = 赢,粉 = 代价。数据:headless Chromium、Lynx for Web、中位数带 95% 置信区间。</p>`,
  // 45b Vapor 上游测试 + 亲近性 + 7× mic-drop
  `<p><strong>Vapor 也有了自己的上游测试(PR #232)。</strong>30 个 <code>runtime-vapor</code> spec 文件跑在真实的 <code>vue-lynx/vapor</code> 表面和 ShadowElement 树上:<strong>545 通过、120 skip、0 失败</strong>。skiplist 是一个<em>封闭清单</em> —— 每个被排除的测试都有理由,任何未归类项都会让配置加载直接失败。</p><p><strong>这些 skip 不是一堆坏掉的东西。</strong>SSR/hydration 加 vdom↔vapor 互操作占了不跑项的 57% —— 两者都不是 Lynx 兼容性信号(没有 SSR 表面;互操作是刻意不支持的)。浏览器专属平台再占 24%。测试设施只占不到 1%(对比 vdom 那边高达 59%),因为“原始 bundle 再导出”这招几乎消灭了私有 import 问题。这个移植还顺手抓到一个真 bug(ShadowElement 会被响应式代理;<code>__v_skip</code> 修掉了)。</p><p><strong>亲近性这一点。</strong>在真正触及元素表面的测试上,Vapor 以 81% 对 vdom 的 57% 通过 —— 而且<em>零行为级垫片</em>:生产版 <code>@vue/runtime-vapor</code> 原封不动跑在 ShadowElement 上,而 vdom 模式需要 1,074 行在执行路径里的模拟。Vapor 的宿主契约 —— 克隆模板 + 对节点的命令式 setter —— 天生就与 Lynx 更契合。(是契合度,不是速度。)</p><p><strong>压轴数字 —— 7× VDOM。</strong>跨框架套件(ReactLynx vs Vue VDOM vs Vue Vapor),真实点击到 composed-DOM 终态。Vue 对 Vue 的头条:10k select 风暴上 Vapor 7.0× VDOM,update 风暴 1.9× —— 同一个应用、同一个产物,只差一个属性。</p>`,
  // 45 工作流 · 一份源码两个渲染器
  `<p><strong>凭什么信它。</strong>Vapor 应用是<em>从 vdom 源码生成的</em> —— 唯一差别是 <code>vapor</code> 属性,所以负载逐字节相同。36/36 个受支持示例与其 vdom 孪生体做到 0.000% 像素差。</p><p>矩阵(<code>examples/vapor-support.json</code>,带每条目源码哈希)生成文档表格 —— 不会与验证输出发生漂移。</p>`,
  // 37 虚拟 DOM 更新路径
  `<p><strong>先立对比。</strong>从左到右过一遍五个方块。中间三个虚线的就是税:重跑、分配、diff —— 每次更新都要交,无论变了多少。</p><p>下一页用一次 magic move 把中间这段收掉。</p>`,
  // 38 Vapor 更新路径
  `<p><strong>morph 的回报。</strong>中间三个方块刚刚消失了。状态和目标节点原地不动,一个响应式 effect 把它们连起来。</p><p>这就是全部要点:细粒度更新,而不是整树 diff。下一拍:这条更新路径,在 Web 与 Lynx 上分别怎么落地。</p>`,
  // 40a 代码复用 · Web 单管 → browser DOM
  `<p><strong>Web 上的复用故事。</strong>两枚绿标就是全部要点:<code>@vue/runtime-vapor</code> <em>原封不动</em>,因为底下那层 DOM 兼容表面会应答 <code>insertBefore</code> / <code>cloneNode</code> / <code>setAttribute</code>。在 Web 上,那层表面<em>就是</em>浏览器 DOM。</p>`,
  // 40b 代码复用 · Lynx 拆到 BG | MT
  `<p><strong>同一组层,双线程安家。</strong>compiled / alias / runtime / shims / ShadowElement 留在后台线程;<code>ops stream → native</code> 落在主线程。两枚绿标:<code>@vue/runtime-vapor</code> <em>原封不动</em>,因为 ShadowElement 会应答那些 DOM 调用 —— 它们变成 vdom 已经在用的同一条 ops 流。</p>`,
  // 39 Vapor 产物 · 第一个疑问:structure 第一次传过去
  `<p><strong>第一个疑问 —— Main 到底收到什么?</strong>Vapor 编译成 <code>template()</code> + <code>t0()</code> 克隆。在 Web 上那次克隆就是浏览器 DOM。在 Lynx 上,形状<em>不会</em>预先打进 MTS/Lepus 产物(那是 Element Templates 的 baked <code>create()</code>)。</p><p>第一次 <code>t0()</code> 时,BG 把惰性 ShadowElement 原型走成 <code>TemplateNode</code> AST —— <code>[tag, props|0, children[]]</code> —— 并只推一次 <code>REGISTER_TREE</code>:<code>[16, treeId, structure, 0]</code>。Main 只缓存 <code>{ structure }</code>;原生节点要等后面的 <code>CLONE_TREE</code>。</p><p><strong>为什么不在构建期 bake?</strong>历史原因,而非本质。上游 Vapor 的 codegen 只给你一段 HTML 字符串(<code>template('&lt;view&gt;…&lt;/view&gt;')</code>)。Lynx 上最省事的路就是:BG runtime 把字符串 parse 成 ShadowElement,再把同一棵树序列化进 <code>REGISTER_TREE</code>。构建期残差(ET 那种)仍然在桌面上 —— 只是还没为那套 codegen 买单。下一页:为什么 <code>child(n0)</code> 的活指针仍然过不了边界。</p><p><strong>种子:</strong>运行时交付 vs 构建期交付,本身就是一根轴(<em>delivery</em>)—— 与残差取什么形态无关。收尾的弧线会回到它。</p>`,
  // 90pre-a E20pre-a · 问题:需要指针,指针过不了
  `<p><strong>用两拍把问题说清。</strong>Vapor 编译出来的代码,像操作 HTML DOM 一样走树、改树:<code>child(n0)</code> 返回活指针;<code>setText(n1, …)</code> 通过它写入。细粒度更新的故事全靠这个 —— 产物<em>依赖</em>一棵可寻址的树。</p><p><strong>为什么不直接走 engine tree?</strong>从 BG 看,engine element tree 是 write/ops 形的 —— 没有同步的 <code>firstChild</code> walk。所以 Vapor 改走 <em>BG shadow tree</em>(<code>ShadowElement</code>)。这些活指针照样过不了 MT —— 下一页:握着名字的那棵 MT addressable tree。</p>`,
  // 90pre-b E20pre-b · BG shadow vs MT addressable
  `<p><strong>两棵树,一分为二。</strong><em>BG shadow tree</em>(<code>ShadowElement</code>)才是 Vapor 真正在走的 —— 活指针、DOM 形、retained —— 于是 <code>child(n0)</code> / <code>setText(n1)</code> 能像在 HTML DOM 上一样工作。从 BG 看,MT 上的 engine element tree 是 write/ops 形,没法靠 walk 去寻址。</p><p><em>MT addressable tree</em> 是另一半:一次性注册的惰性原型,每个槽位按同一趟前序稠密命名(<code>uid = base + slot</code>)。Vue 从不握住这些节点 —— 解释器握着,于是 <code>CLONE_TREE</code> / <code>SET_TEXT(6, …)</code> 才能落地。和 shadow tree 同构,节点种类不同。下一页:把这些名字送过线的协议 —— <code>REGISTER_TREE</code>,然后 <code>CLONE_TREE</code>。</p>`,
  // 41 跨线程 · 注册
  `<p><strong>名字上线 —— 第一步。</strong>载荷我们已经见过:第一次 clone 时传过去的 <code>TemplateNode</code> AST —— <em>不是</em>打进 MTS。Main 把它缓存成惰性原型(还没有原生节点)。</p><p>两条线程按同一趟前序给这份 structure 分配 uid —— 于是根本不用传任何 id 映射。下一拍:每个实例一条 <code>CLONE_TREE(base)</code>。</p>`,
  // 42 跨线程 · 克隆（为什么要 clone）
  `<p><strong>为什么要 clone?</strong>Vapor 的蓝图是静态的(<code>template()</code> 一次);每个组件实例仍要<em>自己的</em>节点给 effect、文本和事件 —— 和 DOM <code>cloneNode(true)</code> 同一套心智。宿主契约就是:克隆模板 + 命令式 setter。</p><p><strong>为什么 Lynx 上是 <code>CLONE_TREE</code>?</strong>指针过不了线程。若 BG 的 clone 变成逐节点 create/append,create-1k 流量会比 vdom 更差。<code>REGISTER_TREE</code> 之后,每个实例一条 <code>CLONE_TREE(base)</code> —— Main 从该 base uid 重走缓存原型并物化原生元素。自有 opcode;解释器在同一产物里。结果:−59% ops、−51% 字节。</p>`,
  // 90pre-c E20pre-c · ShadowElement (VDOM & Vapor) vs AddressableNode
  `<p><strong>左边是一张对照表,按列读。</strong>先看共用数据:两边握同一份 <code>ShadowElement</code>。再看矩阵 —— 每行一个 API,每列一个渲染器。VDOM 列是完整 <code>nodeOps</code> 的 create/walk/diff,外加 <code>setText</code>。Vapor 列把那些标成 — ,改用编译出来的 <code>template</code> / <code>child</code> / <code>on</code> 驱动同一棵树,重叠点只有 <code>setText</code>。</p><p>右边:Vapor 的 MT <code>AddressableNode</code> 故意很瘦 —— <code>uid</code> + <code>tag</code>。不是第二棵 ShadowElement;只是一个名字,好让写入落地。</p>`,
  // 90a E20a · 稠密 vs 稀疏 (Vapor tree vs ET)
  `<p><strong>指针过不去,名字就得接管 —— 而发名字有两种发法。</strong>Vapor <em>稠密</em>地发:一趟前序遍历给每个节点一个 uid(2–7)。两条线程跑的是同一趟遍历,于是无需传一个字节就能对齐每个名字 —— 可寻址集合是开放的(任何节点都可能被 effect、事件或 ref 摸到)。</p><p>Element Templates <em>稀疏</em>地发:VDOM 编译器早已证明了一个封闭的动态点集合(holes),diff 又保证静态节点永远不会被寻址 —— 于是只有 hole 拿到名字,灰色节点对协议完全隐形。稀疏不是省出来的,是<em>证出来的</em>。同一份模板,设计空间上的两个坐标。</p><p><strong>种子:</strong>dense vs sparse 其实就是<em>命名</em>轴 —— per-node vs per-block。这是树的性质,不是某个框架的把戏;收尾的弧线把所有轴摆在一起。</p>`,
  // 90b E20b · 动静光谱 · retained → write-only
  `<p><strong>设计空间是一条很宽的光谱</strong> —— 从完全 retained 到完全 immediate。<strong>React VDOM</strong> 完全动态:解释一棵树,每次更新再 diff。<strong>Vue</strong> 的 compiler-hinted、block-based VDOM 好一些 —— block 让它跳过静态子树。<strong>Vapor</strong> 看似把一切都编译掉了,其实仍给浏览器内的运行时留了一块:指针,用来<em>读</em> / 寻址活节点。所以 Vapor 依然是 <em>retained mode</em>。</p><p><strong>为什么这在线程边界上要命。</strong>retained 的指针只有在整棵树本身共享时才能扛过一次线程跳转:RN 的 Fabric 把指针留在一棵两侧都能碰到的 C++ 影子树里。Lynx 做不到 —— 我们从第一帧就跨线程。<strong>Element Templates</strong> 走了反方向:只写、单向,更接近 immediate mode 的 <em>display list</em>。它跨线程极其漂亮 —— 代价是放弃 MT 侧的动态性。就像画一幅画:画一次,然后把画布撒手。</p><p><strong>种子:</strong>眯起眼看,这条光谱就是 <em>staging</em> 阶梯的伪装 —— interpret → compile。接下来的几页给它起名:ops → data → code → native。</p>`,
  // Λ1 λ holes. tree · 命题
  `<p><strong>退后一步 —— 给我们忙了一下午的事情起个名字。</strong>这场演讲里的每一棵动态子树,都是同一个函数:<code>λ holes. tree</code> —— 喂给它洞的值,它还你一棵子树。Vue 模板、Vapor 组件、ReactLynx 的 JSX —— 全都是这个 λ。</p><p><strong>Partial evaluation(部分求值):</strong>这个函数静态的那一半,编译器在构建期就已经知道,于是可以<em>提前</em>把它算掉。掉出来的是<em>残差(residual)</em> —— 静态骨架 —— 加上洞,唯一还活在运行时的部分。今天你见过的每一种"模板机制",都只是<em>给残差选一种表示</em>。这个念头,请按住两页。</p>`,
  // Λ2 三个编译器 · 同一次切分(带 Snapshot 落位)
  `<p><strong>三联画作证 —— 这个 λ 你今天已经见过三次。</strong>Vue 的编译器把模板切成 Block:静态子节点 vs <code>dynamicChildren</code>(Card.vue 那页)。Vapor 在 codegen 做同一次切分:静态一半变成 <code>template()</code>,洞变成 <code>renderEffect</code> + setter。ReactLynx 同样如此 —— <em>Snapshot</em> 就是一个编译出的 create 函数,外加一张动态 parts 清单;JSX 用 <code>values</code> 实例化它。(代码是示意,不是逐字。)</p><p><strong>Snapshot 在我们坐标系里的落位:</strong>它是<em>内生的 Code-Template</em> —— 残差以代码形式随两份产物出厂,天生常开。和我们的 Element Templates 同一格;只是默认值不同。三列之间的差异<em>不在</em>切分 —— 切分完全相同 —— 而在残差接下来取什么形态。不过先问一句:每家编译器的 block 信息,到底从哪儿来?</p>`,
  // Λ2b 出处:内生 / 恢复 / 声明
  `<p><strong>同一次切分,三种出处。</strong>vdom 编译器把切分<em>递到手上</em>(<code>dynamicChildren</code> / patchFlags)—— 内生;ReactLynx 的 Snapshot codegen 也一样。上游 Vapor 的 codegen 却把它留给了自己 —— 我们只拿到一段 HTML 字符串 —— 于是 <code>+b</code> 靠走这段字符串把 block <em>恢复</em>出来,盖上 <code>__vlxAddressing</code> 的戳。</p><p><strong>恢复出来的名字必须可证明。</strong>运行时的树若与戳不符(结构指纹校验),就静默回退到 per-node 命名 —— 正确性从不押在恢复上。这也是坐标表里 vapor 的 addressing 写作 <em>walk+recover</em> 的原因。干净的解法在上游:让 <code>@vue/compiler-vapor</code> 直接发出声明式 addressing(已提 #332)—— 恢复和它的保险丝一起退役。</p>`,
  // Λ3 跨线程复活解释器
  `<p><strong>戏剧性的反转。</strong>在 Web 上,Vapor 的 <code>t0()</code> 终点是 <code>cloneNode(true)</code> —— 浏览器引擎原生克隆残差。用我们的词说,那<em>本来就已经是 Engine-Template</em>:热路径上哪儿都没有解释器。梯子的顶端,我们免费拿到过。</p><p><strong>然后 Lynx 的分线程拓扑把它收走了。</strong>以代码形式活在 BG 的残差,没法隔着一条线被调用 —— 它必须<em>旅行</em>,而旅行的东西只能是数据(<code>REGISTER_TREE</code> 的 structure AST,或者 ops 本身)。对岸的数据需要一个<em>解释器</em>来重新物化。边界把我们反编译了 —— 它复活了解释侧。这意味着接下来的每一次优化都是同一个动作:把解释器重新编译掉。下一页:那把梯子。</p><p><strong>行业押韵,有人问就说。</strong>React Server Components 是同一定律的网络边界实例:服务端把树部分求值,把残差作为数据(Flight 载荷)发给客户端的解释器。Glimmer 把模板编译成 VM 解释的字节码线格式 —— data 档的模板。Qwik 把残差序列化进文档以实现 resumability。边界不同 —— 网络、产物体积、线程 —— 复活的都是解释侧。</p>`,
  // Λ4 阶梯 · 把解释器编译掉
  `<p><strong>这把梯子,自上而下 = 今天讲过的顺序。</strong><em>ops</em> —— vdom 的扁平流:MT 每次更新解释每一条 op。<em>data</em> —— Vapor 的 <code>REGISTER_TREE</code> / <code>CLONE_TREE</code>:structure 解释一次,之后按名克隆;逐次更新的解释器基本消失。<em>code</em> —— 残差变成函数(<code>create()</code>)烘进两份产物:Element Templates 和 Snapshot 都住这里。这正是第一 Futamura 投影 —— 把解释器对一个固定程序特化,得到的就是编译产物。<em>native</em> —— 引擎自己持有模板并克隆;连 JS 都没有了。Web 的 <code>cloneNode</code> 一直住在这一档;Lynx 上引擎的 Element Template API 是同一档(我们的探针在 flag 后面跑 —— 诚实备注:Lynx-for-Web 上今天是 stub)。</p><p>要落地的一句话:<strong>这里的优化,就是对解释器本身做 partial evaluation,一档一档来。</strong></p><p><strong>预判尖锐提问 —— Vapor 为什么停在 data,不用 code?</strong>是上游,不是物理:<code>@vue/compiler-vapor</code> 的 codegen 只把残差装在 <code>template()</code> 的 HTML 字符串里给我们,于是最省事且正确的路是运行时 parse + <code>REGISTER_TREE</code> —— data。没有什么禁止 vapor 的 code 档:那段字符串是静态的,我们的插件可以在构建期解析它,把 <code>create()</code> 烘进两份产物 —— 和 ET/Snapshot 一模一样。那就是未建成的 vapor <code>:c</code> / bundle 交付格;上游声明式 addressing(#332)会让它更干净。历史,不是本质 —— 104 页的种子,在这里收线。</p>`,
  // Λ5 逐轴图 · render 轴
  `<p><strong>一根轴,按干净了读。</strong>两根柱都是 per-node 基线 —— 不带任何模板 flag —— 所以这是更新路径上纯粹的 effect vs diff:同一个应用、真实点击、unified storms @10k、中位数。select storm 是最纯的用例(翻一个文本):vdom 重跑组件再 diff,vapor 跑一个 effect —— 1330 → 168 ms,8 倍。与前面章节另一套 harness 的 5.8–9.8× 官方基准数字互相印证。</p><p><strong>诚实的代价:</strong>create 慢约 12%(2017 → 2258)—— Vapor 的 REGISTER/CLONE 协议加逐实例 effect 建立。更新收益每一帧都在收,create 税只付一次 —— 而下一根轴恰好就是削 create 的杠杆。这张图强制执行的归因纪律:render 轴做到的事,永远不要记在模板头上。</p>`,
  // Λ5b 逐轴图 · +b 随静态占比
  `<p><strong>模板轴是创建杠杆,而且随"可证明"变化。</strong>同机 sfc-probe 阶梯,同一个应用,两档静态倍数。×1 时行内几乎全是洞 —— 没多少残差可下沉,+b(这里是 vdom 的 ET / Code-Template)只动 FCP 约 2%,贴着噪声。×4 时编译器能证明四倍的骨架,同一个 flag 直接还你 −17%。deck 前面 1000× 载荷那页,就是这条曲线的远端:几乎全静态的屏幕。</p><p><strong>vapor 的 +b 在 create 路径上是同一形状:</strong>storms 里这个动态偏重的构成下 create −5%,随静态占比增长 —— 并记得那句警告:vdom +b 捆绑 staging+naming+delivery,这张图是捆绑包的效果;总结表里只有 vapor 行是单列读数。update 与 select 全程对模板视盲 —— op 帧核对一致。</p>`,
  // Λ5b2 逐轴图 · +ifr 遇上 +b
  `<p><strong>交互作用图 —— 为什么轴要放在一起读。</strong>IFR 把绘制挪到 BG 启动之前,然后要为 MTS 录制的所有内容付一次 hydrate join。1k 时两列都赢(vdom −11%,vdom +b −9% —— 就是 −22% 那页展示的首帧杠杆)。10k 时录制巨大:纯 vdom 的逐节点 ops 让 join 的开销压过省下的启动(+22%),而 +b 的录制是每个 block 一条 INSTANTIATE 加洞的 SET —— join 缩小,IFR 重新赢回(−14%)。</p><p><strong>这就是 5→3 那页,被测出来了。</strong>缩小协议的那次塌缩,正是让 IFR 能随规模成立的东西。用数据杀掉耦合迷思:ET 不是"IFR 的功能" —— 它是让 IFR 的承诺在规模下兑现的那个 flag。下一页:这三根杠杆共同指向的那一格 —— 我们还没建的那格。</p>`,
  // Λ5b3 空着的那一格 · vapor +b:c(架构 + 困境)
  `<p><strong>为什么这一格的上限大概率最高。</strong>把刚看完的三张图叠起来:它保住 render 轴(update storm −54%、select storm −87% —— 活在 effect 系统里,不受影响);它把 create 挪到 <em>code</em> 档 —— ×4 静态时还你 −17%、ops 载荷 1000× 的那根轴;它的录制是每个 block 一条 INSTANTIATE —— 正是把 IFR 的 +22% 税翻成 −14% 的那个形状。没有第二个未建格能把三根实测杠杆全部组合起来。engine 档(:e)理论上更高,但被平台 PAPI 卡住;+b:c <em>今天</em>就能在我们的插件里建。</p><p><strong>困境,说精确。</strong>上游 <code>@vue/compiler-vapor</code> 只把残差作为运行时 HTML 字符串装在 <code>template()</code> 里发出 —— 没有任何构建期结构可以消费。于是插件必须在构建期自己解析这段字符串、把 <code>create()</code> 烘进两份产物 —— 然后<em>证明</em>自己的解析与 BG 的运行时解析相等,否则克隆会跨线程失步。和 recovered naming 的指纹同一证明类:能建,但需要保险丝。上游声明式 codegen(#332)会把整个义务溶解 —— 编译器把 structure + addressing 发一次,我们的解析和指纹一起退役。诚实的代价:MTS 产物变大(ET 先例:探针应用上约 2.26× gzip),资格规则(组件、v-if/v-for 宿主留在普通路径)照旧。姐妹格:+b! 在产物里交付 <em>data</em> AST 而非代码 —— 更便宜,保留 MT 解释;若肯为 codegen 买单,:c 可以吞并它。</p>`,
  // Λ5c 逐因子 · 一次只动一根轴
  `<p><strong>边际效应 —— 动一根轴,按住其余。</strong>第一行是头条:换 render 模型,update storm 腰斩、select storm 塌缩;代价是 create 约 +12%(Vapor 的克隆协议)。模板各行在这个格子构成下都在个位数徘徊 —— <em>update 与 select 对模板视盲</em>:我们核对过模板各格的 op 帧与原生调用次数完全一致;模板的回报在 create 和协议字节上,随静态占比增长(这个应用偏动态,所以 deck 前面 1000× ops 载荷那页是曲线的另一端)。</p><p><strong>当心那个脏因子。</strong>vdom +b 那行一次动 staging+naming+delivery —— 它 +11.6% 的 storm 代价是 ET 包装在 10k 的取舍,不是对任何单轴的裁决;只有 vapor 各行是干净的单列读数。+ifr 用一点 create 税换 −12…−22% 的 FCP(FCP 阶梯在链接的报告里,同机跑到 30k),而叠上 +b 后这笔税还会缩小 —— 轴是可组合的。:e 那行的存在就是为了诚实:引擎是 stub 时,差值就是噪声 —— 它量的正是这件事。</p><p><strong>置灰的行是排好序的路线图 —— est. 数字是推算,不是基准。</strong>+b:c(#337)—— 刚看过的那页空格;区间取自实测的 code 档类比(×1 静态 −2% → ×4 静态 −17%),update ~0 因为更新对模板视盲,IFR 形状就是 +22%→−14% 那次翻转。+b!(#338)—— 把 structure AST 打进 MTS 产物:过线收益是定义性的(已知模板的 structure 字节 → 0),create 的削减来自首次 clone 的摊销;它把 delivery 轴单独隔离出来供归因。:d→e —— 卡在引擎 PAPI,等一个原生宿主。还有一个为科学而非产品的第四格:data 档的 vdom,能让 vdom 一族像 vapor 阶梯那样一次一列地分解。</p>`,
  // Λ6 定律 · 交接给摇篮
  `<p><strong>定律,与交接。</strong>分线程拓扑会不断复活解释侧 —— 每一条线都会重新把它打开;这不是 Lynx 的怪癖,这是边界对代码做的事。手艺在于按屏幕逐一选择:你把它编译回去多深 —— 不得不时用 ops,能命名时用 data,编译器能证明切分时用 code,引擎愿意替你持有模板时用 native。</p><p>然后翻页 —— <em>这</em>就是 Lynx 是框架设计摇篮的原因:整把梯子都对前端框架开放。带着这个视角读收尾那页。</p>`,
  // 90c E20c · 摇篮 · 收束设计空间
  `<p><strong>框架作者为什么该关心 Lynx。</strong>Lynx 做过很多有趣甚至有争议的设计决定,而且还在继续:双线程、MTS、一台不在 DOM 上的真 CSS 引擎。这是一支深爱 Web、也有胆量和空间在必要处打破 Web 的团队。</p><p>对 Vue 而言:一个真正有奔跑空间的原生平台 —— 在这种空间里,一个 Vapor 原生渲染器,就是一个周末的 vibe 量。</p>`,
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
  // 91a E21·a · 全景种子 · 先 React
  `<p><strong>织物从一根线开始。</strong>React 最先把这套模式跑通 —— 声明式 UI、一个做 reconcile 的运行时。先点它的名,让它落到织机上。</p><p>从这里起步,是为了让"生长"读起来像一个故事:一根线,然后两根,然后整张 Web。</p>`,
  // 91b E21·b · 全景种子 · React + Vue
  `<p><strong>Vue 加入 —— 现在是两根线。</strong>整场论证的核心就是:谁都不特殊。React 与 Vue 是同一设计空间里的两个坐标,都能织上同一台织机。</p><p>在这里停一拍,再让整张 Web 涌进来。</p>`,
  // 91 E21 · 全景 · 左半
  `<p><strong>全景开始。</strong>线落下时逐一点名:Vue 的绿、React 的蓝、Svelte 和 Solid 隐约的黄、Octane 的红 —— 一种还在纺的新织物 —— CSS、Tailwind、Motion、Pretext。整个 Web 生态,化作丝线。</p><p>它们全都收向同一个又细又有力的腰身。</p>`,
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
  // 96 E26 · 自然语言（含原「十年翻新」「还是前端」）
  `<p><strong>个人的证据。</strong>这一年我回头把 10 年前的自己想做的项目全都翻新了一遍:十年没动过的个人网站(hux.pro);我的第一个 Vue 项目,Vue 0.12;还有这套 deck —— 手 vibe 的 HTML,底下没有任何 slide 库,正是当年那个 slides 编辑器的直系后代。</p><p><strong>转折 —— 可我做的,还是前端。</strong>那我整天在做什么呢,从敲代码变成 prompt?我只是又换了一门语言 —— 汇编到 C 到 JS 到……自然语言。源变了,工作没变:我仍然在把人的意图,翻译成人能看见、能触摸的东西。这从来就是这份工作。这<em>就是</em>前端。</p>`,
  // 97 E27 · 前端永生
  `<p><strong>真正的收尾。</strong>小字划掉:前端已死。大字:前端永生。谢谢 —— 这次是真的 —— 然后留在这页做 Q&amp;A。</p><p>Q&amp;A 弹药:"能上生产吗?" —— pre-alpha,架构稳,已覆盖的部分测试充分。"Android?" —— 同一份产物,两端都跑。"AI 会取代 Vue 吗?" —— 你刚看完整个答案。</p>`,
];
