import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@rspress/core/runtime';

import styles from './index.module.scss';

const HOST_MESSAGE = 'vue-lynx:artifact-host';

export interface ArtifactLink {
  href: string;
  label: string;
}

export interface ArtifactEmbedProps {
  /** Path to the HTML artifact (e.g. `/benchmark/table.html`). */
  src: string;
  /** Accessible name for the iframe. */
  title: string;
  /** Optional short label shown in the toolbar (defaults to title). */
  label?: string;
  /** Iframe height (CSS length). */
  height?: string | number;
  /** Extra toolbar links (e.g. alternate CPU-scale pages). */
  links?: ArtifactLink[];
}

function readTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function withHostParams(src: string, theme: 'dark' | 'light', lang: string): string {
  const url = new URL(src, 'https://vue.lynxjs.org');
  url.searchParams.set('theme', theme);
  url.searchParams.set('lang', lang === 'zh' ? 'zh' : 'en');
  return `${url.pathname}${url.search}${url.hash}`;
}

function ExternalIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6.5 2a.75.75 0 0 1 0 1.5H3.75A1.25 1.25 0 0 0 2.5 4.75v7.5A1.25 1.25 0 0 0 3.75 13.5h7.5a1.25 1.25 0 0 0 1.25-1.25V9.5a.75.75 0 0 1 1.5 0v2.75A2.75 2.75 0 0 1 11.25 15h-7.5A2.75 2.75 0 0 1 1 12.25v-7.5A2.75 2.75 0 0 1 3.75 2H6.5Z"
      />
      <path
        fill="currentColor"
        d="M9.25 1.25A.75.75 0 0 1 10 1h4.25a.75.75 0 0 1 .75.75V6a.75.75 0 0 1-1.5 0V3.56L7.53 9.53a.75.75 0 1 1-1.06-1.06L12.44 2.5H10a.75.75 0 0 1-.75-.75Z"
      />
    </svg>
  );
}

/**
 * Framed iframe for self-contained HTML benchmark artifacts.
 * Syncs Rspress dark/light + locale into the iframe, and offers open-in-new-window.
 */
export function ArtifactEmbed({
  src,
  title,
  label,
  height = 1400,
  links = [],
}: ArtifactEmbedProps) {
  const lang = useLang().startsWith('zh') ? 'zh' : 'en';
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Bake host prefs into the initial URL once; later toggles sync via postMessage.
  const [framedSrc] = useState(() =>
    withHostParams(
      src,
      typeof document !== 'undefined' ? readTheme() : 'light',
      lang,
    ),
  );

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const openHref = useMemo(
    () => withHostParams(src, theme, lang),
    [src, theme, lang],
  );

  const postPrefs = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { type: HOST_MESSAGE, theme, lang },
      '*',
    );
  }, [theme, lang]);

  useEffect(() => {
    postPrefs();
  }, [postPrefs]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== HOST_MESSAGE || !data.ready) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      postPrefs();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postPrefs]);

  const copy = lang === 'zh'
    ? {
        open: '在新窗口打开',
        openAria: `在新窗口打开：${title}`,
      }
    : {
        open: 'Open in new window',
        openAria: `Open in new window: ${title}`,
      };

  const heightCss = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.meta}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label}>{label ?? title}</span>
        </div>
        <div className={styles.actions}>
          {links.map((link) => (
            <a
              key={link.href}
              className={styles.ghost}
              href={withHostParams(link.href, theme, lang)}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
          <a
            className={styles.primary}
            href={openHref}
            target="_blank"
            rel="noreferrer"
            aria-label={copy.openAria}
          >
            <ExternalIcon />
            <span>{copy.open}</span>
          </a>
        </div>
      </div>
      <div className={styles.frame}>
        <iframe
          ref={iframeRef}
          className={styles.iframe}
          src={framedSrc}
          title={title}
          loading="lazy"
          style={{ height: heightCss }}
          onLoad={postPrefs}
        />
      </div>
    </div>
  );
}

export default ArtifactEmbed;
