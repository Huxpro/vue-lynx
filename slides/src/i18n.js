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
  'native UI primitives': '原生 UI primitive',
  'custom rendering engine': '自定义渲染引擎',
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
  'II · Vue coverage · 1/9': 'II · Vue 覆盖度 · 1/9',
  'II · Vue coverage · 2/9': 'II · Vue 覆盖度 · 2/9',
  'II · Vue coverage · 3/9': 'II · Vue 覆盖度 · 3/9',
  'II · Vue coverage · 4/9': 'II · Vue 覆盖度 · 4/9',
  'II · Vue coverage · 5/9': 'II · Vue 覆盖度 · 5/9',
  'II · Vue coverage · 6/9': 'II · Vue 覆盖度 · 6/9',
  'II · Vue coverage · 7/9': 'II · Vue 覆盖度 · 7/9',
  'II · Vue coverage · 8/9': 'II · Vue 覆盖度 · 8/9',
  'II · Vue coverage · 9/9': 'II · Vue 覆盖度 · 9/9',
  'reactive() + composables':
    '<code class="brand-text">reactive()</code> + 组合式函数',
  'Event modifiers': '事件<span class="brand-text">修饰符</span>',

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
  'Transition, Suspense, slots': '<b>Transition、Suspense、插槽</b>',
  'Pinia, Router, Query, Tailwind': '<b>Pinia、Router、Query、Tailwind</b>',
  'KeepAlive, Teleport': '<b>KeepAlive、Teleport</b>',
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
  // 3 Logo · +Chrome(三角)
  `<p><strong>Chrome 从下方升起</strong> —— React 和 Vue 抬到上方两角,三个 logo 落成三角,Web 在底下托着它们。</p><p>"先聊 Web。"React 和 Vue 只是载体 —— 我们真正共同站立的地面,是 Web:它的开发体验、它的开放性、它的可达性。</p>`,
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
  `<p><strong>秀肌肉章节。</strong>"为了让大家感受到诚意" —— 我带了一桌丰盛的 demo。三道菜:Vue API 覆盖度、完整应用、然后是原生超能力。</p><p>接下来看到的每台手机都是活的 —— 边看边扫码,在自己设备上跑。</p>`,
  // 14 852/949
  `<p><strong>先上硬指标。</strong>我们把 Vue core 自己的测试套件拿来直接跑在 Vue Lynx 渲染器上:949 个通过 852 个;每个 skip 都有记录、有交代。"兼容 Vue"在这里是可测量的命题,不是一句口号。</p>`,
  // 15 ref
  `<p><strong>从最简单的开始:</strong><code>ref()</code>、一个事件回调、一个样式绑定。整页和 Web Vue 的差别只有两处:import 写 <code>vue-lynx</code>,标签是 <code>&lt;view&gt;/&lt;text&gt;/&lt;image&gt;</code>。</p><p><strong>现场:</strong>点一下 —— logo 沿着 ref 驱动的 transform 弹起来。</p>`,
  // 16 reactive
  `<p>整个响应式内核原样复用自 Vue —— <code>reactive</code>、<code>toRefs</code>、<code>computed</code>、watch 全部一致。这意味着<strong>组合式函数 —— 你组织 Vue 应用的方式 —— 原封不动可用</strong>。这个秒表就是一个普通的 composable。</p>`,
  // 17 v-model
  `<p>双向绑定,两种形态都有:组件层 <code>defineModel</code>(含具名 model),以及直接绑在 Lynx <strong>原生</strong> <code>&lt;input&gt;/&lt;textarea&gt;</code> 上的 <code>v-model</code> —— 连 <code>.lazy/.trim/.number</code> 修饰符都在。时序敏感的场景(预置值、程序化赋值、与 <code>@input</code> 共存)也都覆盖了。</p>`,
  // 18 event modifiers
  `<p>Vue 的事件修饰符映射到 Lynx 事件系统:<code>.once</code>、<code>.stop</code>、<code>.self</code>、链式组合 —— demo 里每个都和"不加修饰符"的孪生版本并排对照。(<code>.prevent</code> 是兼容性 no-op —— 原生没有默认行为可阻止。)</p>`,
  // 19 slots
  `<p>组合模式整体平移:默认插槽、具名插槽、作用域插槽 —— 你搭设计系统用的整套组件写法都在。</p>`,
  // 20 provide/inject
  `<p>跨层级依赖注入 —— 响应式值也支持。根部切主题,深层子组件通过注入的 ref 一起重渲染。Pinia 和 Router 正是骑在这套机制上工作的 —— 这也是它们能直接跑通的原因。</p>`,
  // 21 style scoped
  `<p>真 CSS 是 Lynx 的超能力 —— 所以 Vue 的 SFC CSS 特性全都落地:<code>&lt;style scoped&gt;</code>、CSS Modules、外链样式,甚至 CSS 里的 <code>v-bind()</code>,让响应式状态直接驱动原生样式。</p>`,
  // 22 Suspense
  `<p>异步编排:<code>defineAsyncComponent</code>、异步 <code>setup()</code>、嵌套 Suspense 边界、重挂载时的 fallback —— 全部跑在原生元素树上。</p>`,
  // 23 Transition
  `<p>覆盖度的收官:<code>&lt;Transition&gt;</code> 和 <code>&lt;TransitionGroup&gt;</code>,由<strong>原生合成器</strong>上的 CSS 动画驱动 —— 进入/离开、列表移动,类名全是你熟的那套。</p><p>九个特性、九个现场应用。API 讲完了 —— 接下来,整个应用。</p>`,
  // 24 Whole apps
  `<p>API 逐个通过只是入场券。"Web DX 是基线"真正的考验,是把一整个 Vue 代码库 —— 状态、路由、样式、数据请求 —— 整体落到原生上。来两个经典。</p>`,
  // 25 TodoMVC
  `<p><strong>TodoMVC</strong> —— 每个框架的成人礼。和写 Web 一模一样的 Composition API;输入框是<em>原生</em>的,滚动是<em>原生</em>的,点击延迟不到一帧。</p><p><strong>现场:</strong>加一条、勾几条、清除已完成。</p>`,
  // 26 HackerNews
  `<p><strong>HackerNews</strong> —— 社区公认的"真应用"基准:网络、分页、嵌套评论。数据 TanStack Vue Query,样式 Tailwind,滚动跑在带复用的原生 <code>&lt;list&gt;</code> 上。<strong>跟着过来的不只是框架,是生态。</strong></p>`,
  // 27 Runs on web
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
  // 70 Thank you
  `<p><strong>收尾。</strong>感谢,邀请提问,停在这页做 Q&amp;A。</p><p>"能上生产吗?" —— pre-alpha,架构稳,已覆盖的部分测试充分。"Android?" —— Lynx 跨平台,同一产物两端都跑。</p>`,
];
