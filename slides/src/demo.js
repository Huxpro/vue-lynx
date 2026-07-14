// =============================================================================
// <vl-demo bundle="todomvc/dist/main.web.bundle"> — mounts a real Vue Lynx app
// via @lynx-js/web-core. Shared by the deck (main.js) and the fullscreen play
// page (play.js) so the runtime/loader logic lives in exactly one place.
// =============================================================================

const EMBED = new URLSearchParams(location.search).has('embed');

// Lynx runtime — lazy, single-flight.
let lynxRuntimeReady = null;
export function ensureLynxRuntime() {
  if (!lynxRuntimeReady) {
    lynxRuntimeReady = import('@lynx-js/web-core/client');
  }
  return lynxRuntimeReady;
}

// Rewrite the webpack publicPath baked into the bundle at build time so image
// URLs resolve against the bundle location, not the (unreachable) dev-machine
// address captured when the example was built. Both spacing variants occur
// across bundles: `.p="x"` and `.p = "x"`.
const WEBPACK_PUBLIC_PATH_RE = /\.p\s*=\s*\\"[^"]*\\"/g;

// Shared group keeps multiple lynx-views on a single worker.
const LYNX_GROUP_ID = 7;

export class VlDemo extends HTMLElement {
  static get observedAttributes() { return ['bundle']; }

  constructor() {
    super();
    this._mounted = false;
    this._loadStarted = false;
  }

  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;
    if (EMBED) {
      // Speaker preview: skip the live demo, show a calm placeholder.
      this.innerHTML = `
        <div class="vl-demo__loading vl-demo__loading--embed">
          <div class="vl-demo__bullet"></div>
          <div>Live on audience screen</div>
        </div>
      `;
      this.dataset.ready = 'embed';
      return;
    }
    this.innerHTML = `
      <div class="vl-demo__loading">
        <div class="spinner"></div>
        <div>Loading Lynx for Web</div>
      </div>
    `;
  }

  attributeChangedCallback() {
    if (this._loadStarted) this.load();
  }

  /** Begin loading the runtime + bundle. Called by the deck on slide reveal. */
  async load() {
    if (this._loadStarted) return;
    this._loadStarted = true;

    const bundle = this.getAttribute('bundle');
    if (!bundle) return;
    const url = `/examples/${bundle}`;

    try {
      await ensureLynxRuntime();

      const view = document.createElement('lynx-view');
      view.setAttribute('lynx-group-id', String(LYNX_GROUP_ID));
      view.setAttribute('transform-vh', '');
      view.setAttribute('transform-vw', '');

      view.customTemplateLoader = async (templateUrl) => {
        const res = await fetch(templateUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const baseUrl = templateUrl.substring(0, templateUrl.lastIndexOf('/') + 1);
        const rewritten = text.replace(
          WEBPACK_PUBLIC_PATH_RE,
          `.p=\\"${baseUrl}\\"`,
        );
        const template = JSON.parse(rewritten);

        if (template.lepusCode?.root) {
          const root = template.lepusCode.root;
          if (
            typeof root === 'string' &&
            root.includes('__webpack_require__') &&
            !root.includes('function __webpack_require__')
          ) {
            template.lepusCode.root =
              `var __webpack_require__={p:"${baseUrl}"};` + root;
          }
        }
        return template;
      };

      this.insertBefore(view, this.firstChild);

      const t0 = performance.now();
      const markReady = () => {
        this.dataset.ready = 'true';
      };

      const pollShadow = () => {
        const sr = view.shadowRoot;
        if (sr) {
          if (sr.childElementCount > 0) {
            markReady();
            return;
          }
          const mo = new MutationObserver(() => {
            if (sr.childElementCount > 0) {
              mo.disconnect();
              markReady();
            }
          });
          mo.observe(sr, { childList: true, subtree: true });
        } else if (performance.now() - t0 < 5000) {
          requestAnimationFrame(pollShadow);
        }
      };

      view.url = url;
      pollShadow();

      const updateDims = () => {
        const r = this.getBoundingClientRect();
        view.browserConfig = {
          pixelWidth: Math.round(r.width * window.devicePixelRatio),
          pixelHeight: Math.round(r.height * window.devicePixelRatio),
        };
      };
      requestAnimationFrame(updateDims);
      const ro = new ResizeObserver(updateDims);
      ro.observe(this);
    } catch (err) {
      console.error('[demo] load failed', err);
      const loading = this.querySelector('.vl-demo__loading');
      if (loading) {
        loading.innerHTML = `<div style="color:#ff8a8a;text-align:center;">
          Failed to load demo<br><small style="opacity:.6">${err.message ?? err}</small>
        </div>`;
      }
    }
  }
}

let defined = false;
/** Register the <vl-demo> custom element once. */
export function registerVlDemo() {
  if (defined || customElements.get('vl-demo')) return;
  defined = true;
  customElements.define('vl-demo', VlDemo);
}
