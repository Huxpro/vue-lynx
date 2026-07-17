/**
 * Frame for embedded benchmark HTML artifacts.
 * - Open-in-new-window chrome (locale-aware)
 * - Syncs Rspress dark/light + lang into the iframe via query + postMessage
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@rspress/core/runtime';
import './BenchArtifactFrame.scss';

export type BenchArtifactFrameProps = {
  /** English (or default) artifact URL */
  src: string;
  /** Optional Chinese artifact URL; falls back to `src` + runtime lang bridge */
  srcZh?: string;
  title?: string;
  titleZh?: string;
  height?: number | string;
  /** Extra query params always appended */
  query?: Record<string, string>;
};

function readDocTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function withParams(url: string, params: Record<string, string>): string {
  const u = new URL(url, 'https://vue.lynxjs.org');
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') u.searchParams.set(k, v);
  }
  return `${u.pathname}${u.search}${u.hash}`;
}

export function BenchArtifactFrame({
  src,
  srcZh,
  title = 'Benchmark report',
  titleZh = '基准报告',
  height = 1400,
  query,
}: BenchArtifactFrameProps) {
  const lang = useLang();
  const isZh = lang === 'zh';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(readDocTheme);
  const readyRef = useRef(false);

  useEffect(() => {
    const check = () => setTheme(readDocTheme());
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => obs.disconnect();
  }, []);

  const baseSrc = isZh ? (srcZh ?? src) : src;

  // Include theme+lang on first paint so first frame matches the docs shell.
  // Theme toggles after load use postMessage (no remount).
  const frameSrc = useMemo(
    () =>
      withParams(baseSrc, {
        theme,
        lang: isZh ? 'zh' : 'en',
        ...(query ?? {}),
      }),
    // Intentionally omit `theme` — remount only when the artifact file / lang changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseSrc, isZh, query],
  );

  const openHref = useMemo(
    () =>
      withParams(baseSrc, {
        theme,
        lang: isZh ? 'zh' : 'en',
        ...(query ?? {}),
      }),
    [baseSrc, theme, isZh, query],
  );

  const postBridge = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ source: 'vue-lynx-docs', type: 'theme', theme }, '*');
    win.postMessage(
      { source: 'vue-lynx-docs', type: 'lang', lang: isZh ? 'zh' : 'en' },
      '*',
    );
  };

  useEffect(() => {
    postBridge();
  }, [theme, isZh, frameSrc]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.source !== 'vue-lynx-bench' || d.type !== 'ready') return;
      readyRef.current = true;
      postBridge();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [theme, isZh]);

  const label = isZh ? titleZh : title;
  const openLabel = isZh ? '新窗口打开' : 'Open in new window';

  return (
    <figure className="bench-artifact">
      <figcaption className="bench-artifact__bar">
        <div className="bench-artifact__meta">
          <span className="bench-artifact__dot" aria-hidden="true" />
          <span className="bench-artifact__title">{label}</span>
        </div>
        <a
          className="bench-artifact__open"
          href={openHref}
          target="_blank"
          rel="noreferrer"
        >
          <span>{openLabel}</span>
          <svg
            className="bench-artifact__icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 5h5v5M19 5l-9 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </figcaption>
      <div className="bench-artifact__frame">
        <iframe
          ref={iframeRef}
          key={baseSrc}
          src={frameSrc}
          title={label}
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          loading="lazy"
        />
      </div>
    </figure>
  );
}

export default BenchArtifactFrame;
