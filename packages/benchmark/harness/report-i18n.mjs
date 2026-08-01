/**
 * EN / ZH copy + conclusion builders for the unified report.
 *
 * Data lives in tables/charts. Conclusions are decision-first:
 *   title  — one quotable takeaway
 *   why    — so what / product implication
 *   evidence — numbers to verify (not the whole story)
 */

export function copy(lang) {
  const zh = lang === 'zh';
  return {
    lang: zh ? 'zh-CN' : 'en',
    title: zh
      ? 'Vue Lynx 统一基准矩阵'
      : 'Unified Vue Lynx benchmark matrix',
    lede: zh
      ? '同一量纲下看 IFR × VDOM/Vapor × ReactLynx。上方是结论（好消化）；下方表格与曲线用来核对数据。中位数延迟；<b>(n.nn)</b> = 相对该行最优的慢速倍数。'
      : 'IFR × VDOM/Vapor × ReactLynx on one scale. Conclusions up top (easy to digest); tables and charts below for verification. Median latency; <b>(n.nn)</b> = slowdown vs the row’s best.',
    generated: (meta) =>
      zh
        ? `生成于 ${meta.date.slice(0, 10)} · git ${meta.sha} · ${meta.cpus}× ${meta.cpuModel}`
        : `Generated ${meta.date.slice(0, 10)} · git ${meta.sha} · ${meta.cpus}× ${meta.cpuModel}`,
    pills: {
      env: zh ? '环境：lynx-web（主）' : 'env: lynx-web (primary)',
      ladder: zh ? '阶梯：1k → 30k' : 'ladder: 1k → 30k',
      cells: (n) => (zh ? `数据格：${n}` : `cells: ${n}`),
      conclusions: (n) => (zh ? `结论：${n}` : `conclusions: ${n}`),
    },
    hConclusions: zh ? '结论' : 'Conclusions',
    subConclusions: zh
      ? '标题是 takeaway；含义怎么用；核对是数字。勿跨环境比毫秒。'
      : 'Title = takeaway; so what = how to use; verify = numbers. Never ratio ms across environments.',
    whyLabel: zh ? '含义' : 'so what',
    evidenceLabel: zh ? '核对' : 'verify',
    altLang: zh
      ? { href: 'report.html', label: 'English' }
      : { href: 'report.zh.html', label: '中文' },
    // When published under /benchmark/, sibling links differ:
    altLangPublished: zh
      ? { href: 'unified.html', label: 'English' }
      : { href: 'unified.zh.html', label: '中文' },
    hStorms: zh ? '交互 Storms — IFR × 框架矩阵' : 'Table storms — IFR × framework matrix',
    subStorms: zh
      ? '黑盒协议：真实点击 → 合成 DOM 终态。单机全量测量（四轴全排列 + ReactLynx × 1k/10k/30k 一次跑完；同 key 以最新单机跑为准）。'
        + '<b>Select = 点状更新</b>（每次只动选中态/少量 class）；'
        + '<b>Update = 批量更新</b>（每轮改很多行）。'
        + '<b>ReactLynx (memo)</b> = Snapshot + IFR（始终开启）+ 手动 memo/useCallback。'
      : 'Black-box: real clicks → composed-DOM end state. Single-host full sweep (all four-axis permutations + ReactLynx × 1k/10k/30k in one run; per-key newest single-host samples win). '
        + '<b>Select = point update</b> (selection / a few classes per tick); '
        + '<b>Update = batch update</b> (many rows touched each pass). '
        + '<b>ReactLynx (memo)</b> = Snapshot + IFR (always on) + manual memo/useCallback.',
    hStormScale: zh ? 'Storm 随规模变化（1k → 30k）' : 'Storm scaling (1k → 30k)',
    subStormScale: zh
      ? '线性坐标、零基线——看绝对差距，不是对数压缩后的形状。Select 曲线看点状更新；Update 曲线看批量吞吐。'
      : 'Linear axes, zero baseline — absolute gaps, not log-compressed shape. Select charts = point updates; Update charts = batch throughput.',
    hFcp: zh ? '首帧 FCP — 架构阶梯' : 'Content-probe FCP (architecture ladder)',
    subFcp: zh
      ? '相同卡片密度（约 1k→30k 元素）：全部四轴排列 + ReactLynx Snapshot+IFR，单机一次跑完（sfc-probe 规模阶梯）。这是<strong>首帧</strong>量纲，不能和上面的 storm 毫秒直接比。下表 CPU ×1，全部 cells 覆盖 1k→30k（×4 覆盖到 10k）。'
      : 'Same card density (~1k→30k els): every four-axis permutation + ReactLynx Snapshot+IFR, one single-host sweep (sfc-probe scale ladder). This is the <b>first-frame</b> scale — not comparable to storm ms above. Table below: CPU ×1; every cell covers 1k→30k (×4 covers through 10k).',
    subFcp4: zh
      ? 'CPU ×4（同矩阵，阶梯截到 10k——×4 侧只有到 10k 的完整覆盖）。'
      : 'CPU ×4 (same matrix; ladder clipped to 10k — full ×4 coverage only through 10k).',
    hGraphEng: zh
      ? 'Graph-eng 命名单位 — node（Named Tree）vs block（Tree-Template）'
      : 'Graph-eng naming unit — node (Named Tree) vs block (Tree-Template)',
    subGraphEng: zh
      ? '同款 sfc-probe（~1004 元素）：仅切换 <code>enableSparseNaming</code>。Native ET 仍 stub；稀疏仍全量建 native 树。详见 <code>ifr-bench/GRAPH-ENG-MATRIX.md</code>。'
      : 'Same-source sfc-probe (~1004 els): only <code>enableSparseNaming</code> flips. Native ET still stub; sparse still builds the full native tree. See <code>ifr-bench/GRAPH-ENG-MATRIX.md</code>.',
    hGraphEngFactors: zh
      ? '优化 flag 矩阵 — 全排列 create/update 与因子归因'
      : 'Optimization-flag matrix — all-permutation create/update + factor attribution',
    subGraphEngFactors: zh
      ? '统一 table app（真实点击、双线程），全部合法优化组合（cell 名 = 基线 × <code>+b[:t|c|e]</code> × <code>+ifr[:c|e]</code>，见下方图例；因子 = 单个 flag 的 marginal Δ%）各测 create / update10th / updateStorm / select / selectStorm（1k/10k，reps=2 — ±10% 内视为噪声）。因子 = 单轴 marginal Δ%。engine cells 在本环境（Lynx for Web，无引擎 ET PAPI）数据记为 <b>N/A</b>，默认从表格滤除（顶部开关可显示）；其解释回退的对照原始样本仍在 results JSON 中。详见 <code>ifr-bench/GRAPH-ENG-REPORT.md</code> §3.3。'
      : 'Unified table app (real clicks, dual-thread), every legal optimization combination (cell name = baseline × <code>+b[:t|c|e]</code> × <code>+ifr[:c|e]</code>, see the legend below; a factor = per-flag marginal Δ%), each measured for create / update10th / updateStorm / select / selectStorm (1k/10k, reps=2 — read ±10% as noise). Factors = single-axis marginal Δ%. Engine cells are recorded as <b>N/A</b> on this host (Lynx for Web has no engine ET PAPI) and filtered out of the tables by default (toggle at the top reveals them); their interpretation-fallback control samples remain in the results JSON. See <code>ifr-bench/GRAPH-ENG-REPORT.md</code> §3.3.',
    hFirstScreen: zh
      ? '首屏 — 无交互量纲'
      : 'First screen — the interaction-free scale',
    subFirstScreen: zh
      ? '同一 session、同一台机器、每次 rep 轮换 mode 顺序。<b>启动</b> = <code>&lt;lynx-view&gt;</code> attach → 首个内容绘出（空应用）；'
        + '<b>mount-create</b> = 应用<strong>构建时</strong>就带满表格（<code>BENCH_AUTOROWS=N</code>），量 attach → N 行全部绘出，因此包含框架启动。'
        + '这是首屏量纲，不能和上面的 storm 毫秒或 content-probe FCP 直接比。'
        + 'Octane 的 Rspeedy 产物无条件在主线程画首屏（<code>installLynxMainThread({ firstScreen: true })</code>，插件没有关掉的选项），'
        + '所以公平的 Vue 对照是 <code>+ifr</code> 那两格。'
      : 'One session, one host, mode order rotated per rep. <b>startup</b> = <code>&lt;lynx-view&gt;</code> attach → first content painted (empty app); '
        + '<b>mount-create</b> = the app is <strong>built</strong> with the table already populated (<code>BENCH_AUTOROWS=N</code>), measuring attach → all N rows painted, so it includes framework boot. '
        + 'This is the first-frame scale — not comparable to the storm ms or the content-probe FCP above. '
        + 'Octane’s Rspeedy output always paints the first screen on the main thread (<code>installLynxMainThread({ firstScreen: true })</code>, no plugin option to disable), '
        + 'so the fair Vue comparators are the two <code>+ifr</code> rows.',
    fsHeaders: {
      arch: zh ? '架构' : 'architecture',
      startup: zh ? '启动（空）' : 'startup (empty)',
      range: zh ? '样本区间 ms' : 'min–max ms',
      mount: (s) => (zh ? `mount-create ${s}` : `mount-create ${s}`),
      web: zh ? 'web gzip' : 'web gzip',
      lynx: zh ? 'lynx gzip' : 'lynx gzip',
    },
    noteOctane: zh
      ? '<b>Octane 现在全矩阵可测。</b>在 <a href="https://github.com/octanejs/octane/pull/459">octanejs/octane#459</a> 之前，'
        + '它在 Lynx for Web 上一个点击都收不到：两个线程是不同的 JS realm（背景在 iframe 里），'
        + '而校验用的是 realm 本地的 <code>getPrototypeOf(v) === Object.prototype</code>，'
        + '于是主线程把背景发来的每一条消息都判成「不是 plain object」而拒收——握手第一条就断，背景永远不提交。'
        + '本页 Octane 的所有数字都在该修复之上测得；'
        + '<b>本仓库更早发布过的 Octane mount-create 数字量的是纯主线程首屏</b>，已被本轮重测取代。'
        + '方法与解读见 <code>packages/benchmark/OCTANE.md</code>。'
      : '<b>Octane is now measurable across the whole matrix.</b> Before '
        + '<a href="https://github.com/octanejs/octane/pull/459">octanejs/octane#459</a> it received no taps at all on '
        + 'Lynx for Web: the two threads are separate JS realms (the background runs in an iframe), and the validators '
        + 'used a realm-local <code>getPrototypeOf(v) === Object.prototype</code> check, so main rejected every message '
        + 'the background sent as “not a plain object” — the handshake never completed and the background never committed. '
        + 'Every Octane number on this page was measured on top of that fix; '
        + '<b>the Octane mount-create figures this repo published earlier measured main-thread-only first screen</b> and are '
        + 'superseded by this run. Method and reading: <code>packages/benchmark/OCTANE.md</code>.',
    hCoverage: zh ? '覆盖面' : 'Coverage',
    subCoverage: zh
      ? '每种架构在统一 schema 里量过什么。'
      : 'What each architecture has been measured for in the unified schema.',
    scenario: zh ? '场景' : 'scenario',
    geoMean: zh ? '慢速几何平均' : 'slowdown geometric mean',
    scale: zh ? '规模' : 'scale',
    colLabels: {
      // V4 flag notation: `render [+b[:staging]] [+ifr[:paint]]`. Bare +b
      // uses the render model's natural staging (vdom→:c, vapor→:t).
      // Legacy bench ids stay as data keys (see the flag legend).
      vapor: zh ? 'vapor +b（默认）' : 'vapor +b (default)',
      'vapor-dense': zh ? 'vapor（基线）' : 'vapor (baseline)',
      'vapor-bang': zh ? 'vapor +b!（bundle 交付）' : 'vapor +b! (bundle delivery)',
      'vapor-code': zh ? 'vapor +b:c（code 档）' : 'vapor +b:c (code staging)',
      'vapor-engine': zh ? 'vapor +b:e（N/A）' : 'vapor +b:e (N/A)',
      'vapor-ifr': zh ? 'vapor +b +ifr（默认+ifr）' : 'vapor +b +ifr (default +ifr)',
      'vapor-ifr-dense': 'vapor +ifr',
      'vapor-ifr-sparse': zh
        ? 'vapor +b +ifr（alias）'
        : 'vapor +b +ifr (alias)',
      'vapor-ifr-engine-et': zh
        ? 'vapor +b +ifr:e（N/A）'
        : 'vapor +b +ifr:e (N/A)',
      'vapor-ifr-code-paint': 'vapor +b +ifr:c',
      vdom: zh ? 'vdom（基线）' : 'vdom (baseline)',
      'vdom-et': 'vdom +b',
      'vdom-ifr': 'vdom +ifr',
      'vdom-ifr-et': 'vdom +b +ifr',
      react: zh ? 'rl（Snapshot+IFR+memo）' : 'rl (Snapshot+IFR+memo)',
      // Third framework family — not a Vue flag permutation, so no V4 notation.
      octane: zh ? 'octane（universal core）' : 'octane (universal core)',
    },
    stormRowLabels: zh
      ? {
          'create@1k': '创建 · 1k 行',
          'updateStorm@1k': 'update storm ×50 · 1k',
          'selectStorm@1k': 'select storm ×30 · 1k',
          'create@10k': '创建 · 10k 行',
          'update10th@10k': '每 10 行更新 · 10k',
          'select@10k': '选中一行 · 10k',
          'updateStorm@10k': 'update storm ×50 · 10k',
          'selectStorm@10k': 'select storm ×30 · 10k',
          'create@30k': '创建 · 30k 行',
          'updateStorm@30k': 'update storm ×50 · 30k',
          'selectStorm@30k': 'select storm ×30 · 30k',
        }
      : {
          'create@1k': 'create · 1k rows',
          'updateStorm@1k': 'update storm ×50 · 1k',
          'selectStorm@1k': 'select storm ×30 · 1k',
          'create@10k': 'create · 10k rows',
          'update10th@10k': 'update every 10th · 10k',
          'select@10k': 'select row · 10k',
          'updateStorm@10k': 'update storm ×50 · 10k',
          'selectStorm@10k': 'select storm ×30 · 10k',
          'create@30k': 'create · 30k rows',
          'updateStorm@30k': 'update storm ×50 · 30k',
          'selectStorm@30k': 'select storm ×30 · 30k',
        },
    fcpScale: (s) => (zh ? `${s} 元素` : `${s} elements`),
    fcpArchLabels: {
      react: 'rl',
      vdom: zh ? 'vdom（基线）' : 'vdom (baseline)',
      'vdom-et': 'vdom +b',
      'vdom-ifr': 'vdom +ifr',
      'vdom-ifr-et': 'vdom +b +ifr',
      vapor: zh ? 'vapor +b（默认）' : 'vapor +b (default)',
      'vapor-dense': zh ? 'vapor（基线）' : 'vapor (baseline)',
      'vapor-bang': zh ? 'vapor +b!（bundle 交付）' : 'vapor +b! (bundle delivery)',
      'vapor-code': zh ? 'vapor +b:c（code 档）' : 'vapor +b:c (code staging)',
      'vapor-engine': zh ? 'vapor +b:e（N/A）' : 'vapor +b:e (N/A)',
      'vapor-ifr': zh ? 'vapor +b +ifr（默认+ifr）' : 'vapor +b +ifr (default +ifr)',
      'vapor-ifr-dense': 'vapor +ifr',
      'vapor-ifr-sparse': zh
        ? 'vapor +b +ifr（alias）'
        : 'vapor +b +ifr (alias)',
      'vapor-ifr-engine-et': zh
        ? 'vapor +b +ifr:e（N/A）'
        : 'vapor +b +ifr:e (N/A)',
      'vapor-ifr-code-paint': 'vapor +b +ifr:c',
      octane: zh ? 'octane（universal core）' : 'octane (universal core)',
    },
    charts: {
      mount: {
        title: zh
          ? 'mount-create vs 行数（含 Octane）'
          : 'mount-create vs table size (incl. Octane)',
        sub: zh
          ? '应用构建时就带满 N 行：attach → N 行全部绘出，因此包含框架启动。'
            + '这是 Octane 唯一能进的规模曲线——它没有可用的原生事件，storm 曲线里进不来。'
          : 'The app is built with N rows already in it: attach → all N rows painted, so this includes framework boot. '
            + 'It is the only scale curve Octane can appear on — with no usable native events it cannot enter the storm charts.',
        x: zh ? '行数 N — 线性' : 'rows N — linear',
        y: zh ? 'mount-create — ms' : 'mount-create — ms',
      },
      mountNorm: {
        title: zh
          ? 'mount-create，归一到 vdom 基线'
          : 'mount-create, normalized to the vdom baseline',
        sub: zh
          ? '同一份数据除以 vdom 自己的曲线。绝对毫秒会随机器漂移，比率不会——'
            + '看曲线是随规模张开还是收敛，而不是看谁在某个点上快几毫秒。'
          : 'The same data divided by vdom’s own curve. Absolute ms drift with the host; ratios do not — '
            + 'read whether a curve opens up or converges with scale, not who is a few ms faster at one rung.',
        x: zh ? '行数 N — 线性' : 'rows N — linear',
        y: zh ? '相对 vdom 的倍数' : 'slowdown vs vdom',
      },
      selectStorm: {
        title: zh ? 'Select storm（点状）vs 行数' : 'select storm (point) vs table size',
        sub: zh
          ? '点状更新：30 次连续选中的总墙钟。每次 tick 只改选中态。vapor 全家几乎压平；ReactLynx 陡升；vdom +b +ifr 把 vdom 往下拉。'
          : 'Point updates: wall time for 30 sequential selects — each tick touches selection state only. The vapor family stays flat; ReactLynx climbs; vdom +b +ifr pulls vdom down.',
        x: zh ? '行数 N — 线性' : 'rows N — linear',
        y: zh ? 'select storm — ms' : 'select storm — ms',
      },
      updateStorm: {
        title: zh ? 'Update storm（批量）vs 行数' : 'update storm (batch) vs table size',
        sub: zh
          ? '批量更新：50 轮全表/多行更新的总墙钟。创建另算——这里只看持续批量吞吐。'
          : 'Batch updates: wall time for 50 multi-row update passes. Creation is separate — sustained batch throughput only.',
        x: zh ? '行数 N — 线性' : 'rows N — linear',
        y: zh ? 'update storm — ms' : 'update storm — ms',
      },
      create: {
        title: zh ? 'Create vs 行数' : 'create vs table size',
        sub: zh
          ? 'ReactLynx 创建仍领先。vdom +b +ifr 靠模板 clone 略微帮助创建。'
          : 'ReactLynx still leads creation. vdom +b +ifr slightly helps create via template clone.',
        x: zh ? '行数 N — 线性' : 'rows N — linear',
        y: zh ? 'create — ms' : 'create — ms',
      },
      fcp1: {
        title: zh ? 'FCP vs 内容规模（CPU ×1）' : 'FCP vs content scale (CPU ×1)',
        sub: zh
          ? 'ReactLynx 全程最低。Vue 侧：vdom +ifr（无 +b）在 10k 越过 vdom 基线；vdom +b +ifr 是规模对冲。'
          : 'ReactLynx lowest throughout. Among Vue: vdom +ifr (no +b) crosses above vdom baseline by 10k; vdom +b +ifr is the scale hedge.',
        x: zh ? '元素数 N — 线性' : 'elements N — linear',
        y: 'FCP — ms',
      },
      fcp4: {
        title: zh ? 'FCP vs 内容规模（CPU ×4，至 10k）' : 'FCP vs content scale (CPU ×4, through 10k)',
        sub: zh
          ? '阶梯截到 10k（×4 完整覆盖范围）。慢 CPU 放大 MT 包体解析成本。'
          : 'Ladder clipped to 10k (full ×4 coverage). Slow CPU amplifies MT parse cost.',
        x: zh ? '元素数 N — 线性' : 'elements N — linear',
        y: 'FCP — ms',
      },
    },
    coverageHeaders: zh
      ? ['架构', '交互 storms', '首帧 FCP', 'instrumented BG/e2e', '首屏（无交互）']
      : [
          'architecture',
          'table storms',
          'content-probe FCP',
          'instrumented BG/e2e',
          'first screen',
        ],
    notes: zh
      ? [
          '<b>量纲不能混。</b> Instrumented BG/e2e、黑盒 click→DOM、lynx-web FCP、node --jitless 暖渲染共用 1k→30k 标签，但不是同一把尺子。',
          '<b>着色怎么读：</b>与 playground 相同——颜色是相对该行最优的慢速倍数；数字本身才是权威。',
          '<b>CPU ×4 展示：</b>阶梯截到 10k（该 throttle 下完整覆盖范围）。',
          '<b>复现：</b><code>pnpm --filter vue-lynx-benchmark bench:unified && bench:synthesize && bench:report</code>',
        ]
      : [
          '<b>Environments are not interchangeable.</b> Instrumented BG/e2e, black-box click→DOM, lynx-web FCP, and node --jitless share ladder labels but not a metric scale.',
          '<b>How to read the tint:</b> same as the playground — color is slowdown vs row best; the number is authoritative.',
          '<b>CPU ×4 display:</b> ladder clipped to 10k (full coverage at that throttle).',
          '<b>Reproduce:</b> <code>pnpm --filter vue-lynx-benchmark bench:unified && bench:synthesize && bench:report</code>',
        ],
  };
}

/**
 * @param {object} d numbers extracted from unified cells
 * @param {'en'|'zh'} lang
 */
export function buildConclusions(d, lang) {
  const zh = lang === 'zh';
  const {
    stormVapor,
    stormVdom,
    stormReact,
    stormEt,
    stormIfr,
    createReact,
    createVdom,
    createVapor,
    fcpReact,
    fcpEt,
    fcpOff,
    fcpIfr,
    fcpIfr1k,
    fcpOff1k,
    fcpVaporIfrDense,
    fcpVaporIfrSparse,
    fcpVaporIfrDense4,
    fcpVaporIfrSparse4,
    bgSelectV,
    bgSelectD,
    fsStartupOctane,
    fsStartupVdomIfr,
    fsStartupVdom,
    fsMountOctane1k,
    fsMountVdom1k,
    fsMountOctaneMax,
    fsMountVdomMax,
    octSelect10k,
    octUpdate10th10k,
    octCreate10k,
    octUpdateStorm30k,
    vdomSelect10k,
    vdomUpdate10th10k,
    vdomCreate10k,
    vdomUpdateStorm30k,
  } = d;

  const out = [];
  const r = (a, b) => (a != null && b != null && b !== 0 ? a / b : null);

  const vaporX = r(stormVdom, stormVapor);
  const vaporRx = r(stormReact, stormVapor);
  if (vaporX != null) {
    const bgX =
      bgSelectV != null && bgSelectD != null
        ? (bgSelectD / bgSelectV).toFixed(1)
        : null;
    out.push({
      tone: 'good',
      title: zh
        ? `Vapor 点状更新 ~${vaporX.toFixed(1)}×`
        : `Vapor ~${vaporX.toFixed(1)}× on point updates`,
      why: zh
        ? 'Select = 点状更新。交互密集列表默认 Vapor；单次点击常贴帧地板。'
        : 'Select = point update. Default Vapor for interaction-heavy lists; one-shots often sit on the frame floor.',
      evidence: zh
        ? `selectStorm@10k ${stormVdom.toFixed(0)}→${stormVapor.toFixed(0)} ms` +
          (vaporRx != null ? ` · vs RL ~${vaporRx.toFixed(0)}×` : '') +
          (bgX != null ? ` · BG ~${bgX}×` : '')
        : `selectStorm@10k ${stormVdom.toFixed(0)}→${stormVapor.toFixed(0)} ms` +
          (vaporRx != null ? ` · vs RL ~${vaporRx.toFixed(0)}×` : '') +
          (bgX != null ? ` · BG ~${bgX}×` : ''),
    });
  }

  if (createReact != null && createVdom != null) {
    const x = createVdom / createReact;
    out.push({
      tone: 'good',
      title: zh
        ? `ReactLynx 创建更快 ~${x.toFixed(2)}×`
        : `ReactLynx wins create ~${x.toFixed(2)}×`,
      why: zh
        ? 'Snapshot 擅长一次铺开大量节点。创建 ≠ 更新。'
        : 'Snapshot bulk-instantiate. Creation ≠ update.',
      evidence: zh
        ? `create@10k RL ${createReact.toFixed(0)} · VDOM ${createVdom.toFixed(0)} · Vapor ${createVapor?.toFixed(0) ?? '—'} ms`
        : `create@10k RL ${createReact.toFixed(0)} · VDOM ${createVdom.toFixed(0)} · Vapor ${createVapor?.toFixed(0) ?? '—'} ms`,
    });
  }

  if (fcpReact != null && fcpEt != null && fcpOff != null) {
    out.push({
      tone: 'good',
      title: zh
        ? `ReactLynx 首帧最低`
        : `ReactLynx lowest FCP`,
      why: zh
        ? '同密度探针上 RL 最快。Vue 追首帧 → vdom +b +ifr。'
        : 'Same-density probe: RL wins. Vue first-frame → vdom +b +ifr.',
      evidence: zh
        ? `FCP@10k RL ${fcpReact.toFixed(0)} · +b +ifr ${fcpEt.toFixed(0)} · vdom 基线 ${fcpOff.toFixed(0)} ms`
        : `FCP@10k RL ${fcpReact.toFixed(0)} · +b +ifr ${fcpEt.toFixed(0)} · vdom baseline ${fcpOff.toFixed(0)} ms`,
    });
  }

  if (fcpIfr != null && fcpOff != null && fcpIfr1k != null && fcpOff1k != null) {
    const d1 = ((fcpIfr1k - fcpOff1k) / fcpOff1k) * 100;
    const d10 = ((fcpIfr - fcpOff) / fcpOff) * 100;
    out.push({
      tone: d10 > 0 ? 'critical' : 'warn',
      title: zh ? '别用 +ifr 不带 +b' : 'No +ifr without +b',
      why: zh
        ? '“−19%”不是常数。中大树 vdom +ifr（无 +b）会变慢；默认 vdom +b +ifr。'
        : '“−19%” isn’t a constant. vdom +ifr (no +b) loses at scale; default vdom +b +ifr.',
      evidence: zh
        ? `vs off：1k ${d1.toFixed(0)}% · 10k ${d10 >= 0 ? '+' : ''}${d10.toFixed(0)}%`
        : `vs off: 1k ${d1.toFixed(0)}% · 10k ${d10 >= 0 ? '+' : ''}${d10.toFixed(0)}%`,
    });
  }

  if (stormEt != null && stormVdom != null && stormIfr != null) {
    const fasterPct = (1 - stormEt / stormVdom) * 100;
    out.push({
      tone: 'warn',
      title: zh
        ? `+b 也加速更新 ~${fasterPct.toFixed(0)}%`
        : `+b speeds updates ~${fasterPct.toFixed(0)}%`,
      why: zh
        ? '模板 clone 挂载后仍有用。+ifr（无 +b）≈ 基线。'
        : 'Template clone helps post-mount too. +ifr (no +b) ≈ baseline.',
      evidence: zh
        ? `selectStorm@10k 基线 ${stormVdom.toFixed(0)} · +ifr ${stormIfr.toFixed(0)} · +b +ifr ${stormEt.toFixed(0)} ms`
        : `selectStorm@10k baseline ${stormVdom.toFixed(0)} · +ifr ${stormIfr.toFixed(0)} · +b +ifr ${stormEt.toFixed(0)} ms`,
    });
  }

  if (fcpVaporIfrDense != null && fcpVaporIfrSparse != null) {
    const d1 = ((fcpVaporIfrSparse - fcpVaporIfrDense) / fcpVaporIfrDense) * 100;
    const d4 =
      fcpVaporIfrDense4 != null && fcpVaporIfrSparse4 != null
        ? ((fcpVaporIfrSparse4 - fcpVaporIfrDense4) / fcpVaporIfrDense4) * 100
        : null;
    out.push({
      tone: d1 < -5 ? 'good' : 'warn',
      title: zh
        ? `Vapor 稀疏命名 ×1 FCP ${d1.toFixed(0)}%`
        : `Vapor sparse naming ×1 FCP ${d1.toFixed(0)}%`,
      why: zh
        ? 'A2 稳态稀疏有同机 ×1 收益；×4 未成 hedge。Native ET 仍是大头。'
        : 'Keeper sparse A2 helps ×1 on this host; ×4 is not a hedge. Native ET remains the big lever.',
      evidence: zh
        ? `dense ${fcpVaporIfrDense.toFixed(1)} → sparse ${fcpVaporIfrSparse.toFixed(1)} ms`
          + (d4 != null
            ? ` · ×4 ${d4 >= 0 ? '+' : ''}${d4.toFixed(0)}%`
            : '')
        : `dense ${fcpVaporIfrDense.toFixed(1)} → sparse ${fcpVaporIfrSparse.toFixed(1)} ms`
          + (d4 != null
            ? ` · ×4 ${d4 >= 0 ? '+' : ''}${d4.toFixed(0)}%`
            : ''),
    });
  }

  if (octSelect10k != null && vdomSelect10k != null) {
    const sel = octSelect10k / vdomSelect10k;
    const upd =
      octUpdate10th10k != null && vdomUpdate10th10k != null
        ? octUpdate10th10k / vdomUpdate10th10k
        : null;
    const cre =
      octCreate10k != null && vdomCreate10k != null ? octCreate10k / vdomCreate10k : null;
    const batch =
      octUpdateStorm30k != null && vdomUpdateStorm30k != null
        ? octUpdateStorm30k / vdomUpdateStorm30k
        : null;
    out.push({
      tone: sel > 10 ? 'serious' : 'warn',
      title: zh
        ? `Octane：点状更新 ${sel.toFixed(0)}× vdom，批量与创建却接近持平`
        : `Octane: ${sel.toFixed(0)}× vdom on point updates, yet level on batch and create`,
      why: zh
        ? '差距只出在“改一点点”的场景。它的 per-node 对象命令协议每次更新都要重发整节点命令并走 structured clone，'
          + '没有 Vue 那种把点状更新压成极小 op 载荷的路径；批量更新时每节点成本被摊薄，差距就消失了。'
          + '选型含义：Octane 适合首屏与整块重绘，不适合高频点状交互。'
        : 'The gap is specific to touching a little. Its per-node object command protocol re-ships whole-node commands '
          + 'through structured clone on every update, with no equivalent of the tiny op payload Vue collapses a point '
          + 'update into; under batch updates the per-node cost amortizes and the gap closes. Product read: Octane suits '
          + 'first screen and wholesale repaints, not high-frequency point interaction.',
      evidence: zh
        ? `select@10k ${octSelect10k.toFixed(0)} vs vdom ${vdomSelect10k.toFixed(0)} ms（${sel.toFixed(1)}×）`
          + (upd != null ? ` · update10th@10k ${upd.toFixed(1)}×` : '')
          + (cre != null ? ` · create@10k ${cre.toFixed(2)}×` : '')
          + (batch != null ? ` · updateStorm@30k ${batch.toFixed(2)}×` : '')
        : `select@10k ${octSelect10k.toFixed(0)} vs vdom ${vdomSelect10k.toFixed(0)} ms (${sel.toFixed(1)}×)`
          + (upd != null ? ` · update10th@10k ${upd.toFixed(1)}×` : '')
          + (cre != null ? ` · create@10k ${cre.toFixed(2)}×` : '')
          + (batch != null ? ` · updateStorm@30k ${batch.toFixed(2)}×` : ''),
    });
  }

  if (fsStartupOctane != null && fsMountOctane1k != null && fsMountVdom1k != null) {
    const mount1k = fsMountOctane1k / fsMountVdom1k;
    const big =
      fsMountOctaneMax && fsMountVdomMax && fsMountVdomMax.ms
        ? fsMountOctaneMax.ms / fsMountVdomMax.ms
        : null;
    out.push({
      tone: 'warn',
      title: zh
        ? `Octane 首屏：整条阶梯稳定 ${mount1k.toFixed(1)}× vdom，空屏启动也垫底`
        : `Octane first screen: a flat ${mount1k.toFixed(1)}× vdom across the ladder, and last on empty startup`,
      why: zh
        ? '同一个 per-node 常数因子，从 1k 到 30k 几乎不变——是每节点的固定成本，不是能被摊销掉的开销。'
          + '主线程包确实带的是专用只渲染 renderer 而不是第二份框架运行时，这是真实的设计优势；'
          + '只是在本环境下抵不过背景握手与 adoption 的代价。'
        : 'One per-node constant factor, near-flat from 1k to 30k — a fixed cost per node rather than an overhead that '
          + 'amortizes. The main-thread bundle does carry a purpose-built render-only renderer instead of a second copy '
          + 'of the framework runtime, which is a real design advantage; it just does not pay for the background '
          + 'handshake and adoption on this host.',
      evidence: zh
        ? `启动 ${fsStartupOctane.toFixed(0)} ms vs vdom +ifr ${fsStartupVdomIfr?.toFixed(0) ?? '—'}（最慢一格）· `
          + `mount-create 1k ${mount1k.toFixed(2)}× vdom`
          + (big != null ? ` · ${fsMountOctaneMax.scale} ${big.toFixed(2)}× vdom` : '')
        : `startup ${fsStartupOctane.toFixed(0)} ms vs vdom +ifr ${
          fsStartupVdomIfr?.toFixed(0) ?? '—'
        } (slowest cell) · mount-create 1k ${mount1k.toFixed(2)}× vdom`
          + (big != null ? ` · ${fsMountOctaneMax.scale} ${big.toFixed(2)}× vdom` : ''),
    });
  }

  out.push({
    tone: 'warn',
    title: zh
      ? '创建→RL · 更新→Vapor · Vue 首帧→vdom +b +ifr'
      : 'create→RL · updates→Vapor · Vue FCP→vdom +b +ifr',
    why: zh
      ? 'Select=点状，Update=批量。产品选择压成这一句。'
      : 'Select=point, Update=batch. Product choice collapses to this line.',
    evidence: zh
      ? '见下方表；跨表勿用毫秒互除。'
      : 'See tables below; never divide ms across instruments.',
  });

  out.push({
    tone: 'warn',
    title: zh ? '报比率，别报绝对 ms' : 'Quote ratios, not ms',
    why: zh
      ? '换机器中位数可差 2×+。只带同机比率。'
      : 'Medians move 2×+ across hosts. Same-host ratios only.',
    evidence: zh
      ? `例：旧机 React selectStorm@10k ≈2544 ms；本机 ≈${stormReact?.toFixed(0) ?? '1018'} ms。`
      : `Ex: older host React selectStorm@10k ≈2544 ms; this host ≈${stormReact?.toFixed(0) ?? '1018'} ms.`,
  });

  return out;
}
