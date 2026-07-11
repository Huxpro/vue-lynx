/**
 * BenchPlayground — interactive cross-framework benchmark embed.
 *
 * Loads the black-box benchmark apps (packages/benchmark/apps/ui-*) as real
 * Lynx-for-Web bundles inside a <lynx-view>, with a config picker so readers
 * can feel the difference between ReactLynx (three optimization levels),
 * Vue VDOM, and Vue Vapor by tapping the same buttons the harness clicks.
 *
 * A latency badge measures tap → DOM-settled (last shadow-DOM mutation
 * followed by 300 ms of quiet), the embeddable cousin of the harness metric.
 */
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lynx-view': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

const CONFIGS = [
  { key: 'vapor', label: 'Vue Vapor' },
  { key: 'vdom', label: 'Vue VDOM' },
  { key: 'react', label: 'React (hooks)' },
  { key: 'react-naive', label: 'React (naive)' },
  { key: 'react-compiler', label: 'React (compiler)' },
] as const;

type ConfigKey = (typeof CONFIGS)[number]['key'];

// Neutralize web-core's always-on lynx.profile shim for NATIVE PARITY.
// On native Lynx, framework profiling calls (lynx profileStart/profileEnd)
// are no-ops unless a tracing session is active. web-core's shim maps every
// call onto performance.mark()/measure()/clearMarks() and never clears the
// measures, so the performance timeline grows without bound and frameworks
// that profile per rendered snapshot (ReactLynx) degrade superlinearly —
// an artifact that does not exist on native. Same patch as the benchmark
// harness (packages/benchmark/harness/cross.mjs).
const NEUTRALIZE_LYNX_PROFILE = `(() => {
  const P = globalThis.Performance && globalThis.Performance.prototype;
  if (!P || P.__lynxProfileNeutralized) return;
  P.__lynxProfileNeutralized = true;
  const isProf = (n) => typeof n === 'string' && n.startsWith('lynx.profile:');
  for (const k of ['mark', 'clearMarks']) {
    const orig = P[k];
    P[k] = function (name, ...rest) {
      if (isProf(name)) return undefined;
      return orig.call(this, name, ...rest);
    };
  }
  const origMeasure = P.measure;
  P.measure = function (name, ...rest) {
    if (isProf(name) || (typeof rest[0] === 'string' && isProf(rest[0]))
      || (rest[0] && typeof rest[0] === 'object' && isProf(rest[0].start))) {
      return undefined;
    }
    return origMeasure.call(this, name, ...rest);
  };
})()`;

function installProfileNeutralization() {
  try {
    // page context (main-thread side of the runtime)
    (0, eval)(NEUTRALIZE_LYNX_PROFILE);
    // worker context: wrap Worker so the patch runs before the module chunk
    const w = window as unknown as {
      Worker: typeof Worker;
      __benchWorkerPatched?: boolean;
    };
    if (!w.__benchWorkerPatched) {
      w.__benchWorkerPatched = true;
      const OrigWorker = w.Worker;
      w.Worker = class extends OrigWorker {
        constructor(url: string | URL, opts?: WorkerOptions) {
          if (opts?.type === 'module') {
            const abs = new URL(url, location.href).href;
            const blob = new Blob(
              [`${NEUTRALIZE_LYNX_PROFILE};\nawait import(${JSON.stringify(abs)});`],
              { type: 'text/javascript' },
            );
            super(URL.createObjectURL(blob), opts);
          } else {
            super(url, opts);
          }
        }
      } as typeof Worker;
    }
  } catch {
    /* degrade gracefully — playground still works, numbers include the artifact */
  }
}

// Shared dynamic import so multiple embeds don't race.
let runtimeReady: Promise<void> | null = null;
function ensureRuntime() {
  if (!runtimeReady) {
    installProfileNeutralization();
    runtimeReady = import('@lynx-js/web-core/client').then(() => {});
  }
  return runtimeReady;
}

const WEBPACK_PUBLIC_PATH_RE = /\.p=\\"[^"]*\\"/g;

export function BenchPlayground() {
  const [config, setConfig] = useState<ConfigKey>('vapor');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'rendered'>('loading');
  const [latency, setLatency] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureRuntime()
      .then(() => setReady(true))
      .catch((err) =>
        setError(`Failed to load Lynx runtime: ${err?.message ?? err}`),
      );
  }, []);

  useEffect(() => {
    if (!ready || !viewHostRef.current) return;
    setStatus('loading');
    setLatency(null);

    const host = viewHostRef.current;
    host.innerHTML = '';
    const view = document.createElement('lynx-view') as HTMLElement & {
      url?: string;
      customTemplateLoader?: (url: string) => Promise<unknown>;
      browserConfig?: { pixelWidth: number; pixelHeight: number };
    };
    view.setAttribute('style', 'display:block;width:100%;height:100%;');

    const rect = host.getBoundingClientRect();
    view.browserConfig = {
      pixelWidth: Math.round(rect.width * window.devicePixelRatio),
      pixelHeight: Math.round(rect.height * window.devicePixelRatio),
    };

    // Same template loader tweaks as @lynx-js/go-web's WebIframe: rewrite the
    // webpack public path to the bundle location and shim the webpack runtime
    // when rspack omits it from lepusCode.
    view.customTemplateLoader = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
      const text = await res.text();
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const rewritten = text.replace(
        WEBPACK_PUBLIC_PATH_RE,
        `.p=\\"${baseUrl}\\"`,
      );
      const template = JSON.parse(rewritten) as {
        lepusCode?: { root?: string };
      };
      const root = template.lepusCode?.root;
      if (
        typeof root === 'string'
        && root.includes('__webpack_require__')
        && !root.includes('function __webpack_require__')
      ) {
        template.lepusCode.root =
          `var __webpack_require__={p:"${baseUrl}"};` + root;
      }
      return template;
    };

    host.appendChild(view);
    view.url = `/benchmark/${config}/main.web.bundle`;

    // tap → DOM-settled latency: t0 at pointerdown (capture), then wait for
    // mutations to go quiet for 300 ms.
    let t0: number | null = null;
    let lastMutation = 0;
    let raf = 0;
    let mo: MutationObserver | undefined;
    let disposed = false;

    const onDown = (e: Event) => {
      // web-core reads viewport-relative MouseEvent.x/.y; fix coordinates for
      // embedded (offset) views, same as go-web's WebIframe.
      const me = e as MouseEvent;
      if (typeof me.clientX === 'number') {
        const r = view.getBoundingClientRect();
        const ax = me.clientX - r.left;
        const ay = me.clientY - r.top;
        try {
          Object.defineProperties(me, {
            clientX: { get: () => ax },
            clientY: { get: () => ay },
            x: { get: () => ax },
            y: { get: () => ay },
            pageX: { get: () => ax },
            pageY: { get: () => ay },
          });
        } catch {
          /* already redefined */
        }
      }
      t0 = performance.now();
      lastMutation = 0;
      setLatency('…');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      if (disposed || t0 == null) return;
      const now = performance.now();
      if (lastMutation > t0 && now - lastMutation > 300) {
        setLatency(`${Math.round(lastMutation - t0)} ms`);
        t0 = null;
        return;
      }
      if (now - t0 > 300_000) {
        setLatency('> 5 min…');
        t0 = null;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const pollStart = performance.now();
    const pollShadow = () => {
      if (disposed) return;
      const shadow = view.shadowRoot;
      if (shadow) {
        mo = new MutationObserver(() => {
          lastMutation = performance.now();
          setStatus('rendered');
        });
        mo.observe(shadow, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
        shadow.addEventListener('pointerdown', onDown, true);
        shadow.addEventListener('click', () => {}, true);
        return;
      }
      if (performance.now() - pollStart > 5000) {
        setError('lynx-view shadow root was not created');
        return;
      }
      setTimeout(pollShadow, 50);
    };
    pollShadow();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      mo?.disconnect();
      view.shadowRoot?.removeEventListener('pointerdown', onDown, true);
      host.innerHTML = '';
    };
  }, [ready, config]);

  const pick = useCallback((key: ConfigKey) => {
    setConfig(key);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        border: '1px solid var(--rp-c-divider, #e2e2e3)',
        borderRadius: 12,
        overflow: 'hidden',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          padding: 10,
          borderBottom: '1px solid var(--rp-c-divider, #e2e2e3)',
        }}
      >
        {CONFIGS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pick(c.key)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 13,
              lineHeight: 1.4,
              cursor: 'pointer',
              border:
                config === c.key
                  ? '1px solid var(--rp-c-brand, #42b883)'
                  : '1px solid var(--rp-c-divider, #d0d0d3)',
              background:
                config === c.key
                  ? 'var(--rp-c-brand, #42b883)'
                  : 'transparent',
              color: config === c.key ? '#fff' : 'inherit',
            }}
          >
            {c.label}
          </button>
        ))}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 13,
            fontVariantNumeric: 'tabular-nums',
            opacity: latency ? 1 : 0.55,
          }}
        >
          {latency ? `tap → DOM settled: ${latency}` : 'tap a button to measure'}
        </span>
      </div>
      <div
        ref={viewHostRef}
        style={{
          width: '100%',
          height: 'min(65vh, 560px)',
          minHeight: 380,
          background: '#fff',
        }}
      />
      {(error || (!ready && status === 'loading')) && (
        <div style={{ padding: 10, fontSize: 13 }}>
          {error ?? 'Loading Lynx runtime…'}
        </div>
      )}
    </div>
  );
}

export default BenchPlayground;
