type HarnessStatus = {
  status: 'loading' | 'ready' | 'error';
  bundle: string;
  error: string;
};

type HarnessGlobal = {
  devicePixelRatio?: number;
  __VUE_LYNX_EXAMPLE_HARNESS__?: HarnessStatus;
};

type LynxView = {
  browserConfig?: { pixelWidth: number; pixelHeight: number };
  customTemplateLoader?: (url: string) => Promise<unknown>;
  setAttribute(name: string, value: string): void;
  shadowRoot?: { childNodes: ArrayLike<unknown> } | null;
  url?: string;
};

type Host = {
  innerHTML: string;
  appendChild(view: LynxView): void;
  getBoundingClientRect(): { width: number; height: number };
};

const WEBPACK_PUBLIC_PATH_RE = /\.p=\\"[^"]*\\"/g;

export function createTemplateLoader(
  fetcher: (url: string) => Promise<{ ok: boolean; status?: number; text(): Promise<string> }> = fetch,
) {
  return async (url: string) => {
    const response = await fetcher(url);
    if (!response.ok) throw new Error(`HTTP ${response.status ?? 'error'} loading ${url}`);
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const rewritten = (await response.text()).replace(
      WEBPACK_PUBLIC_PATH_RE,
      `.p=\\"${baseUrl}\\"`,
    );
    const template = JSON.parse(rewritten) as { lepusCode?: { root?: string } };
    const root = template.lepusCode?.root;
    if (
      typeof root === 'string'
      && root.includes('__webpack_require__')
      && !root.includes('function __webpack_require__')
    ) {
      template.lepusCode!.root = `var __webpack_require__={p:"${baseUrl}"};${root}`;
    }
    return template;
  };
}

export function mountExampleView({
  bundle,
  document,
  globalObject,
  host,
  schedule = (callback) => setTimeout(callback, 50),
}: {
  bundle: string;
  document: { createElement(name: string): LynxView };
  globalObject: HarnessGlobal;
  host: Host;
  schedule?: (callback: () => void) => unknown;
}) {
  let disposed = false;
  let polls = 0;
  const setStatus = (status: HarnessStatus['status'], error = '') => {
    globalObject.__VUE_LYNX_EXAMPLE_HARNESS__ = { status, bundle, error };
  };

  setStatus('loading');
  host.innerHTML = '';
  const view = document.createElement('lynx-view');
  view.setAttribute('style', 'display:block;width:100%;height:100%;');
  const rect = host.getBoundingClientRect();
  const ratio = globalObject.devicePixelRatio ?? 1;
  view.browserConfig = {
    pixelWidth: Math.round(rect.width * ratio),
    pixelHeight: Math.round(rect.height * ratio),
  };
  view.customTemplateLoader = createTemplateLoader();
  host.appendChild(view);
  view.url = bundle;

  const poll = () => {
    if (disposed) return;
    if (view.shadowRoot && view.shadowRoot.childNodes.length > 0) {
      setStatus('ready');
      return;
    }
    polls += 1;
    if (polls >= 200) {
      setStatus('error', 'lynx-view did not render within 10 seconds');
      return;
    }
    schedule(poll);
  };
  schedule(poll);

  return () => {
    disposed = true;
    host.innerHTML = '';
  };
}

export type { HarnessStatus };
