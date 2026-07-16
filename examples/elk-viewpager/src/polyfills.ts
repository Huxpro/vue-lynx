// Fill-if-missing polyfills for the native Lynx JS runtime (PrimJS).
//
// The official native surface (@lynx-js/types) guarantees only `fetch`,
// `Request`, `Response` and timers on the background thread. masto.js
// additionally touches, on EVERY request:
//   - AbortSignal.any (unconditionally, even with no timeout configured)
//   - new Headers(...) (mergeHeadersInit)
//   - new URL(path, base) + url.search setter (resolvePath)
// plus Object.hasOwn / Array.prototype.at in the ported content parser.
//
// Polyfills install only when missing. Lynx for Web keeps its real worker
// implementations; only the fetch scope synchronization runs on both targets.
/* eslint-disable no-restricted-globals */

import { installDOMException } from './dom-exception-compat';
import { resolveFetch } from './fetch-compat';

const g = globalThis as Record<string, any>;

// RuntimeWrapperWebpackPlugin injects native fetch as an outer wrapper
// parameter, while Lynx for Web exposes it on globalThis. Synchronize the
// callable implementation before masto modules execute so their bare fetch
// identifier works in both environments.
const sharedFetch = resolveFetch(
  g.fetch,
  typeof fetch === 'function' ? fetch : undefined,
);
if (sharedFetch) {
  g.fetch = sharedFetch;
  // Assigns RuntimeWrapperWebpackPlugin's injected wrapper parameter.
  // @ts-expect-error fetch is declared as a global function in DOM typings.
  fetch = sharedFetch as typeof fetch;
}

installDOMException(g);

// ---------------------------------------------------------------------------
// AbortController / AbortSignal
// ---------------------------------------------------------------------------

if (typeof g.AbortSignal !== 'function' || typeof g.AbortSignal.any !== 'function') {
  type Listener = () => void;

  class LynxAbortSignal {
    aborted = false;
    reason: unknown;
    onabort: Listener | null = null;
    private listeners: Listener[] = [];

    addEventListener(type: string, fn: Listener) {
      if (type === 'abort')
        this.listeners.push(fn);
    }

    removeEventListener(type: string, fn: Listener) {
      if (type === 'abort')
        this.listeners = this.listeners.filter(l => l !== fn);
    }

    throwIfAborted() {
      if (this.aborted)
        throw this.reason;
    }

    /** @internal */
    _abort(reason?: unknown) {
      if (this.aborted)
        return;
      this.aborted = true;
      this.reason = reason ?? new Error('The operation was aborted.');
      this.onabort?.();
      for (const fn of this.listeners) fn();
    }

    static abort(reason?: unknown) {
      const signal = new LynxAbortSignal();
      signal._abort(reason);
      return signal;
    }

    static timeout(ms: number) {
      const signal = new LynxAbortSignal();
      setTimeout(() => signal._abort(new Error('TimeoutError')), ms);
      return signal;
    }

    static any(signals: LynxAbortSignal[]) {
      // Spec deviation: masto calls AbortSignal.any(signals) on every
      // request even when `signals` is empty. Returning undefined keeps
      // polyfill signal objects out of the native fetch's RequestInit,
      // whose signal handling is an unknown quantity.
      if (!signals || signals.length === 0)
        return undefined as unknown as LynxAbortSignal;
      const combined = new LynxAbortSignal();
      for (const signal of signals) {
        if (signal.aborted) {
          combined._abort(signal.reason);
          break;
        }
        signal.addEventListener?.('abort', () => combined._abort(signal.reason));
      }
      return combined;
    }
  }

  class LynxAbortController {
    signal = new LynxAbortSignal();
    abort(reason?: unknown) {
      this.signal._abort(reason);
    }
  }

  g.AbortSignal = LynxAbortSignal;
  g.AbortController = LynxAbortController;
}

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------

if (typeof g.Headers !== 'function') {
  type HeadersInitLike =
    | Array<[string, string]>
    | Record<string, string>
    | { entries: () => IterableIterator<[string, string]> }
    | undefined;

  class LynxHeaders {
    private map = new Map<string, string>();

    constructor(init?: HeadersInitLike) {
      if (!init)
        return;
      if (Array.isArray(init)) {
        for (const [k, v] of init) this.append(k, v);
      }
      else if (typeof (init as any).entries === 'function') {
        for (const [k, v] of (init as any).entries()) this.append(k, v);
      }
      else {
        for (const [k, v] of Object.entries(init)) this.append(k, String(v));
      }
    }

    get(name: string) {
      return this.map.get(name.toLowerCase()) ?? null;
    }

    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), String(value));
    }

    append(name: string, value: string) {
      const key = name.toLowerCase();
      const existing = this.map.get(key);
      this.map.set(key, existing ? `${existing}, ${value}` : String(value));
    }

    has(name: string) {
      return this.map.has(name.toLowerCase());
    }

    delete(name: string) {
      this.map.delete(name.toLowerCase());
    }

    forEach(fn: (value: string, key: string, headers: LynxHeaders) => void) {
      for (const [k, v] of this.map) fn(v, k, this);
    }

    *entries(): IterableIterator<[string, string]> {
      yield* this.map.entries();
    }

    *keys() {
      yield* this.map.keys();
    }

    *values() {
      yield* this.map.values();
    }

    [Symbol.iterator]() {
      return this.entries();
    }
  }

  g.Headers = LynxHeaders;
}

// ---------------------------------------------------------------------------
// URL / URLSearchParams — the subset masto.js uses:
//   new URL(absolute), new URL(path, base), url.search = 'a=b', String(url)
// ---------------------------------------------------------------------------

if (typeof g.URL !== 'function') {
  const ABSOLUTE_RE = /^([a-z][\w+.-]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i;

  class LynxURL {
    protocol = '';
    host = '';
    pathname = '';
    private _search = '';
    hash = '';

    constructor(input: string | LynxURL, base?: string | LynxURL) {
      const url = String(input);
      const match = url.match(ABSOLUTE_RE);
      if (match) {
        this.protocol = `${match[1].toLowerCase()}:`;
        this.host = match[2];
        this.pathname = match[3] || '/';
        this._search = match[4] ?? '';
        this.hash = match[5] ?? '';
        return;
      }

      if (base === undefined)
        throw new TypeError(`Invalid URL: ${url}`);
      const parsedBase = base instanceof LynxURL ? base : new LynxURL(String(base));
      this.protocol = parsedBase.protocol;
      this.host = parsedBase.host;

      const [beforeHash, ...hashParts] = url.split('#');
      this.hash = hashParts.length ? `#${hashParts.join('#')}` : '';
      const [path, ...queryParts] = beforeHash.split('?');
      this._search = queryParts.length ? `?${queryParts.join('?')}` : '';

      if (path.startsWith('/')) {
        this.pathname = path;
      }
      else if (path === '') {
        this.pathname = parsedBase.pathname;
        if (!queryParts.length)
          this._search = parsedBase.search;
      }
      else {
        // resolve against the base directory
        const dir = parsedBase.pathname.replace(/[^/]*$/, '');
        this.pathname = dir + path;
      }
    }

    get search() {
      return this._search;
    }

    set search(value: string) {
      const v = String(value ?? '');
      this._search = v && !v.startsWith('?') ? `?${v}` : v;
    }

    get searchParams() {
      return new (g.URLSearchParams)(this._search);
    }

    get origin() {
      return `${this.protocol}//${this.host}`;
    }

    get hostname() {
      return this.host.replace(/:\d+$/, '');
    }

    get port() {
      const m = this.host.match(/:(\d+)$/);
      return m ? m[1] : '';
    }

    get href() {
      return `${this.origin}${this.pathname}${this._search}${this.hash}`;
    }

    /** Non-standard: native Request implementations may duck-type
     * non-string inputs as Request-like objects and read `.url`. */
    get url() {
      return this.href;
    }

    toString() {
      return this.href;
    }

    toJSON() {
      return this.href;
    }
  }

  g.URL = LynxURL;
}

if (typeof g.URLSearchParams !== 'function') {
  class LynxURLSearchParams {
    private pairs: Array<[string, string]> = [];

    constructor(init?: string | Record<string, string> | Array<[string, string]>) {
      if (!init)
        return;
      if (typeof init === 'string') {
        const raw = init.startsWith('?') ? init.slice(1) : init;
        for (const part of raw.split('&')) {
          if (!part)
            continue;
          const [k, ...rest] = part.split('=');
          this.pairs.push([decodeURIComponent(k), decodeURIComponent(rest.join('=') ?? '')]);
        }
      }
      else if (Array.isArray(init)) {
        this.pairs = init.map(([k, v]) => [String(k), String(v)]);
      }
      else {
        this.pairs = Object.entries(init).map(([k, v]) => [k, String(v)]);
      }
    }

    get(name: string) {
      const hit = this.pairs.find(([k]) => k === name);
      return hit ? hit[1] : null;
    }

    getAll(name: string) {
      return this.pairs.filter(([k]) => k === name).map(([, v]) => v);
    }

    set(name: string, value: string) {
      this.delete(name);
      this.pairs.push([name, String(value)]);
    }

    append(name: string, value: string) {
      this.pairs.push([name, String(value)]);
    }

    has(name: string) {
      return this.pairs.some(([k]) => k === name);
    }

    delete(name: string) {
      this.pairs = this.pairs.filter(([k]) => k !== name);
    }

    forEach(fn: (value: string, key: string) => void) {
      for (const [k, v] of this.pairs) fn(v, k);
    }

    *entries(): IterableIterator<[string, string]> {
      yield* this.pairs;
    }

    [Symbol.iterator]() {
      return this.entries();
    }

    toString() {
      return this.pairs
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    }
  }

  g.URLSearchParams = LynxURLSearchParams;
}

// ---------------------------------------------------------------------------
// ES2022 statics the ported Elk code uses
// ---------------------------------------------------------------------------

if (typeof Object.hasOwn !== 'function') {
  Object.defineProperty(Object, 'hasOwn', {
    value: (obj: object, key: PropertyKey) =>
      Object.prototype.hasOwnProperty.call(obj, key),
    configurable: true,
    writable: true,
  });
}

if (typeof Array.prototype.at !== 'function') {
  Object.defineProperty(Array.prototype, 'at', {
    value(this: unknown[], index: number) {
      const i = Math.trunc(index) || 0;
      const n = i < 0 ? this.length + i : i;
      return n >= 0 && n < this.length ? this[n] : undefined;
    },
    configurable: true,
    writable: true,
  });
}
