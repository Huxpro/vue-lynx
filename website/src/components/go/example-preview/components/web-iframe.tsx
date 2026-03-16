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

export const WebIframe = ({ show, src }: WebIframeProps) => {
  const lynxViewRef = useRef<LynxView>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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
      // @ts-ignore
      lynxViewRef.current.browserConfig = {
        pixelWidth: Math.round(
          containerRef.current.clientWidth * window.devicePixelRatio,
        ),
        pixelHeight: Math.round(
          containerRef.current.clientHeight * window.devicePixelRatio,
        ),
      };

      // Rewrite relative asset paths in the template to be absolute,
      // based on the bundle URL's directory. Without this, the browser
      // resolves relative <img src> against the page URL instead of
      // the bundle URL.
      const baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
      // @ts-ignore
      lynxViewRef.current.customTemplateLoader = async (url: string) => {
        const res = await fetch(url);
        const text = await res.text();
        // Rewrite relative paths (e.g. "static/image/foo.png") to absolute
        const rewritten = text.replace(
          /(")(static\/[^"]+)/g,
          (_, quote, path) => `${quote}${baseUrl}${path}`,
        );
        return JSON.parse(rewritten);
      };

      lynxViewRef.current.url = src;
    }
  }, [ready, show, src]);

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
      {isVisible && show && src && (
        <lynx-view
          ref={lynxViewRef}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};
