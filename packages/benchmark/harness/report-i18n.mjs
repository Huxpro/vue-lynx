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
      ? '黑盒协议：真实点击 → 合成 DOM 终态。本机测量（2026-07-17）。'
        + '<b>Select = 点状更新</b>（每次只动选中态/少量 class）；'
        + '<b>Update = 批量更新</b>（每轮改很多行）。'
        + '<b>ReactLynx (memo)</b> = Snapshot + IFR（始终开启）+ 手动 memo/useCallback。'
      : 'Black-box: real clicks → composed-DOM end state. Same-host (2026-07-17). '
        + '<b>Select = point update</b> (selection / a few classes per tick); '
        + '<b>Update = batch update</b> (many rows touched each pass). '
        + '<b>ReactLynx (memo)</b> = Snapshot + IFR (always on) + manual memo/useCallback.',
    hStormScale: zh ? 'Storm 随规模变化（1k → 30k）' : 'Storm scaling (1k → 30k)',
    subStormScale: zh
      ? '线性坐标、零基线——看绝对差距，不是对数压缩后的形状。Select 曲线看点状更新；Update 曲线看批量吞吐。'
      : 'Linear axes, zero baseline — absolute gaps, not log-compressed shape. Select charts = point updates; Update charts = batch throughput.',
    hFcp: zh ? '首帧 FCP — 架构阶梯' : 'Content-probe FCP (architecture ladder)',
    subFcp: zh
      ? '相同卡片密度（约 1k→30k 元素）：Vue 旗标矩阵 + 并行 ReactLynx Snapshot+IFR。这是<strong>首帧</strong>量纲，不能和上面的 storm 毫秒直接比。下表 CPU ×1。'
      : 'Same card density (~1k→30k els): Vue flag matrix + parallel ReactLynx Snapshot+IFR. This is the <b>first-frame</b> scale — not comparable to storm ms above. Table below: CPU ×1.',
    subFcp4: zh
      ? 'CPU ×4（同矩阵，阶梯截到 10k——×4 侧只有到 10k 的完整覆盖）。'
      : 'CPU ×4 (same matrix; ladder clipped to 10k — full ×4 coverage only through 10k).',
    hCoverage: zh ? '覆盖面' : 'Coverage',
    subCoverage: zh
      ? '每种架构在统一 schema 里量过什么。'
      : 'What each architecture has been measured for in the unified schema.',
    scenario: zh ? '场景' : 'scenario',
    geoMean: zh ? '慢速几何平均' : 'slowdown geometric mean',
    scale: zh ? '规模' : 'scale',
    colLabels: {
      vapor: 'Vue Vapor',
      'vapor-ifr': 'Vapor+IFR',
      vdom: 'Vue VDOM',
      'vdom-ifr': 'VDOM+IFR',
      'vdom-ifr-et': 'VDOM+IFR+ET',
      react: 'ReactLynx (memo)',
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
      react: 'ReactLynx',
      vdom: 'VDOM',
      'vdom-ifr': 'VDOM+IFR',
      'vdom-ifr-et': 'VDOM+IFR+ET',
      vapor: 'Vapor',
      'vapor-ifr': 'Vapor+IFR',
    },
    charts: {
      selectStorm: {
        title: zh ? 'Select storm（点状）vs 行数' : 'select storm (point) vs table size',
        sub: zh
          ? '点状更新：30 次连续选中的总墙钟。每次 tick 只改选中态。Vapor 几乎压平；React 陡升；IFR+ET 把 VDOM 往下拉。'
          : 'Point updates: wall time for 30 sequential selects — each tick touches selection state only. Vapor stays flat; React climbs; IFR+ET pulls VDOM down.',
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
          ? 'ReactLynx 创建仍领先。IFR+ET 通过模板 clone 略微帮助 VDOM 创建。'
          : 'ReactLynx still leads creation. IFR+ET slightly helps VDOM create via template clone.',
        x: zh ? '行数 N — 线性' : 'rows N — linear',
        y: zh ? 'create — ms' : 'create — ms',
      },
      fcp1: {
        title: zh ? 'FCP vs 内容规模（CPU ×1）' : 'FCP vs content scale (CPU ×1)',
        sub: zh
          ? 'ReactLynx 全程最低。Vue 侧：无 ET 的 IFR 在 10k 越过 plain VDOM；IFR+ET 是规模对冲。'
          : 'ReactLynx lowest throughout. Among Vue: IFR without ET crosses above plain VDOM by 10k; IFR+ET is the scale hedge.',
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
      ? ['架构', '交互 storms', '首帧 FCP', 'instrumented BG/e2e']
      : ['architecture', 'table storms', 'content-probe FCP', 'instrumented BG/e2e'],
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
    bgSelectV,
    bgSelectD,
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
        ? '同密度探针上 RL 最快。Vue 追首帧 → IFR+ET。'
        : 'Same-density probe: RL wins. Vue first-frame → IFR+ET.',
      evidence: zh
        ? `FCP@10k RL ${fcpReact.toFixed(0)} · IFR+ET ${fcpEt.toFixed(0)} · VDOM ${fcpOff.toFixed(0)} ms`
        : `FCP@10k RL ${fcpReact.toFixed(0)} · IFR+ET ${fcpEt.toFixed(0)} · VDOM ${fcpOff.toFixed(0)} ms`,
    });
  }

  if (fcpIfr != null && fcpOff != null && fcpIfr1k != null && fcpOff1k != null) {
    const d1 = ((fcpIfr1k - fcpOff1k) / fcpOff1k) * 100;
    const d10 = ((fcpIfr - fcpOff) / fcpOff) * 100;
    out.push({
      tone: d10 > 0 ? 'critical' : 'warn',
      title: zh ? '别裸开 IFR' : 'No IFR without ET',
      why: zh
        ? '“−19%”不是常数。中大树无 ET 会变慢；默认 IFR+ET。'
        : '“−19%” isn’t a constant. Plain IFR loses at scale; default IFR+ET.',
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
        ? `ET 也加速更新 ~${fasterPct.toFixed(0)}%`
        : `ET speeds updates ~${fasterPct.toFixed(0)}%`,
      why: zh
        ? '模板 clone 挂载后仍有用。裸 IFR ≈ off。'
        : 'Template clone helps post-mount too. Plain IFR ≈ off.',
      evidence: zh
        ? `selectStorm@10k off ${stormVdom.toFixed(0)} · IFR ${stormIfr.toFixed(0)} · ET ${stormEt.toFixed(0)} ms`
        : `selectStorm@10k off ${stormVdom.toFixed(0)} · IFR ${stormIfr.toFixed(0)} · ET ${stormEt.toFixed(0)} ms`,
    });
  }

  out.push({
    tone: 'warn',
    title: zh
      ? '创建→RL · 更新→Vapor · 首帧→IFR+ET'
      : 'create→RL · updates→Vapor · Vue FCP→IFR+ET',
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
