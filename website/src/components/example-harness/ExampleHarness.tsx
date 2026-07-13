import { useEffect, useRef, useState } from 'react';

import { mountExampleView } from './runtime';

declare global {
  interface Window {
    __VUE_LYNX_EXAMPLE_HARNESS__?: {
      status: 'loading' | 'ready' | 'error';
      bundle: string;
      error: string;
    };
  }
}

let runtimeReady: Promise<unknown> | null = null;

function ensureRuntime() {
  runtimeReady ??= import('@lynx-js/web-core/client');
  return runtimeReady;
}

export function ExampleHarness() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const bundle = new URLSearchParams(window.location.search).get('bundle') ?? '';
    if (!bundle.startsWith('/examples/') || !bundle.endsWith('.web.bundle')) {
      const message = 'Expected an /examples/*.web.bundle query parameter';
      window.__VUE_LYNX_EXAMPLE_HARNESS__ = { status: 'error', bundle, error: message };
      setError(message);
      return;
    }

    let cleanup: (() => void) | undefined;
    const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const reason = 'reason' in event ? event.reason : event.error ?? event.message;
      const message = reason?.stack ?? reason?.message ?? String(reason);
      window.__VUE_LYNX_EXAMPLE_HARNESS__ = { status: 'error', bundle, error: message };
      setError(message);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);

    ensureRuntime()
      .then(() => {
        if (!hostRef.current) return;
        cleanup = mountExampleView({
          bundle,
          document,
          globalObject: window,
          host: hostRef.current,
        });
      })
      .catch((reason) => {
        const message = reason?.stack ?? reason?.message ?? String(reason);
        window.__VUE_LYNX_EXAMPLE_HARNESS__ = { status: 'error', bundle, error: message };
        setError(message);
      });

    return () => {
      cleanup?.();
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
    };
  }, []);

  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
      <div ref={hostRef} style={{ width: '100%', height: '100%', background: '#fff' }} />
      {error && <pre data-example-harness-error>{error}</pre>}
    </main>
  );
}

export default ExampleHarness;
