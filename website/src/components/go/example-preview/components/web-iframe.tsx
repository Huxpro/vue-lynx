import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import '@lynx-js/web-core/index.css';
import '@lynx-js/web-elements/index.css';
import type { LynxView } from '@lynx-js/web-core';

declare global {
  // biome-ignore lint/style/noNamespace: extending JSX intrinsic elements requires namespace
  namespace JSX {
    interface IntrinsicElements {
      'lynx-view': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface WebIframeProps {
  show: boolean;
  src: string;
}

const LOGO_LIGHT =
  'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/lynx-dark-logo.svg';
const LOGO_DARK =
  'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/lynx-light-logo.svg';

// Shared promise so multiple WebIframe instances don't re-import
let runtimeReady: Promise<void> | null = null;
function ensureRuntime() {
  if (!runtimeReady) {
    runtimeReady = Promise.all([
      import('@lynx-js/web-core'),
      import('@lynx-js/web-elements/all'),
    ]).then(() => { /* runtime loaded */ });
  }
  return runtimeReady;
}

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains('dark'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => mo.disconnect();
  }, []);
  return dark;
}

const LoadingOverlay = ({ visible }: { visible: boolean }) => {
  const isDark = useIsDark();
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        zIndex: 1,
        background: isDark ? '#1b1b1f' : '#ffffff',
      }}
    >
      <img
        src={isDark ? LOGO_DARK : LOGO_LIGHT}
        alt="Lynx"
        width={40}
        height={40}
        style={{ opacity: 0.5 }}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)',
              animation: `web-iframe-bounce 1.2s ${i * 0.15}s ease-in-out infinite`,
            }}
          />
        ))}
        <style>{`@keyframes web-iframe-bounce {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}`}</style>
      </div>
    </div>
  );
};

/**
 * Rewrite CSS viewport units (vh/vw) in a Lynx template's styleInfo to use
 * CSS custom properties (--lynx-vh / --lynx-vw). This fixes viewport-unit
 * sizing inside the <lynx-view> shadow DOM, where native CSS vh/vw resolve
 * to the browser viewport rather than the preview container.
 */
// biome-ignore lint/suspicious/noExplicitAny: template structure from web-core
function rewriteViewportUnits(template: any): any {
  if (!template.styleInfo) return template;

  const rewrite = (value: string) =>
    value
      .replace(/(-?\d+\.?\d*)vh/g, (_, num) => {
        const n = Number.parseFloat(num);
        if (n === 100) return 'var(--lynx-vh, 100vh)';
        return `calc(var(--lynx-vh, 100vh) * ${n / 100})`;
      })
      .replace(/(-?\d+\.?\d*)vw/g, (_, num) => {
        const n = Number.parseFloat(num);
        if (n === 100) return 'var(--lynx-vw, 100vw)';
        return `calc(var(--lynx-vw, 100vw) * ${n / 100})`;
      });

  for (const key of Object.keys(template.styleInfo)) {
    const info = template.styleInfo[key];
    if (info.content) {
      info.content = info.content.map((s: string) => rewrite(s));
    }
    if (info.rules) {
      for (const rule of info.rules) {
        if (rule.decl) {
          rule.decl = rule.decl.map(([prop, val]: [string, string]) => [
            prop,
            rewrite(val),
          ]);
        }
      }
    }
  }
  return template;
}

export const WebIframe = ({ show, src }: WebIframeProps) => {
  const lynxViewRef = useRef<LynxView>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Reset rendered state when src changes
  useEffect(() => {
    setRendered(false);
  }, [src]);

  // O1: IntersectionObserver — only activate when near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load web-core + web-elements only when visible, then mark ready
  useEffect(() => {
    if (isVisible) {
      ensureRuntime().then(() => setReady(true));
    }
  }, [isVisible]);

  // Set URL only after runtime is ready AND element is mounted
  useEffect(() => {
    if (ready && show && src && lynxViewRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // @ts-ignore
      lynxViewRef.current.browserConfig = {
        pixelWidth: Math.round(containerWidth * window.devicePixelRatio),
        pixelHeight: Math.round(containerHeight * window.devicePixelRatio),
      };

      // Map CSS viewport units to the preview container dimensions.
      // In shadow DOM, native vh/vw resolve to the browser viewport,
      // not the lynx-view container. We define custom properties and
      // rewrite the bundle CSS to reference them instead.
      // @ts-ignore
      lynxViewRef.current.injectStyleRules = [
        `:host { --lynx-vh: ${containerHeight}px; --lynx-vw: ${containerWidth}px; }`,
      ];

      // Rewrite webpack's public path in the bundle JS so that asset
      // URLs (images etc.) resolve relative to the bundle location,
      // not the page URL. The bundles are built with the default
      // publicPath "/" but served from e.g. /examples/hello-world/dist/.
      const baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
      // @ts-ignore
      lynxViewRef.current.customTemplateLoader = async (url: string) => {
        const res = await fetch(url);
        const text = await res.text();
        // Replace webpack public path assignment (e.g. .p="/") with
        // the actual base URL of the bundle directory
        const rewritten = text.replace(
          new RegExp('\\.p=\\\\".\\\\"', 'g'),
          `.p=\\"${baseUrl}\\"`,
        );
        const template = JSON.parse(rewritten);

        // Workaround: when no template modules reference publicPath (no asset
        // imports), rspack omits the local webpack runtime from lepusCode and
        // emits a bare `__webpack_require__` reference. Inject a minimal shim
        // so the entry-point executor (`__webpack_require__.x`) can run.
        if (template.lepusCode?.root) {
          const root = template.lepusCode.root;
          if (
            typeof root === 'string' &&
            root.includes('__webpack_require__') &&
            !root.includes('function __webpack_require__')
          ) {
            template.lepusCode.root =
              'var __webpack_require__={p:"/"};' + root;
          }
        }

        // Rewrite vh/vw units in CSS to use container-relative custom properties
        rewriteViewportUnits(template);

        return template;
      };

      lynxViewRef.current.url = src;

      // Detect when lynx-view has rendered content via MutationObserver
      // on its shadow root
      const el = lynxViewRef.current as unknown as HTMLElement;
      const shadow = el.shadowRoot;
      if (shadow) {
        const mo = new MutationObserver(() => {
          if (shadow.childElementCount > 0) {
            setRendered(true);
            mo.disconnect();
          }
        });
        mo.observe(shadow, { childList: true, subtree: true });
      }

      // Fallback: hide loading after timeout
      const timer = setTimeout(() => setRendered(true), 5000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [ready, show, src]);

  const loading = show && (!ready || !rendered);

  return (
    <div
      ref={containerRef}
      style={{
        display: show ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <LoadingOverlay visible={loading} />
      {isVisible && show && src && (
        <lynx-view
          ref={lynxViewRef}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};
