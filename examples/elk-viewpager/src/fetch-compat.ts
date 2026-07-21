export type FetchLike = (...args: any[]) => any;

export function resolveFetch(
  globalFetch: unknown,
  wrapperFetch: unknown,
): FetchLike | undefined {
  if (typeof wrapperFetch === 'function')
    return wrapperFetch as FetchLike;
  if (typeof globalFetch === 'function')
    return globalFetch as FetchLike;
  return undefined;
}

/**
 * Read a header in a Headers-like / plain-object compatible way.
 * Lynx native Response.headers sometimes omit iterable helpers; masto.js
 * pagination depends on `Link`, and content decoding on `Content-Type`.
 *
 * @see https://lynxjs.org/guide/interaction/networking
 * @see https://lynxjs.org/api/lynx-api/global/fetch — Lynx Fetch aligns with
 * Web but has subtle differences; third-party libs may need adaptation.
 */
export function readHeader(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== 'object')
    return null;

  const lower = name.toLowerCase();
  const h = headers as {
    get?: (n: string) => string | null | undefined;
    forEach?: (fn: (value: string, key: string) => void) => void;
    entries?: () => IterableIterator<[string, string]>;
  };

  if (typeof h.get === 'function') {
    for (const candidate of [name, lower, name.replace(/^\w/, c => c.toUpperCase())]) {
      try {
        const direct = h.get(candidate);
        if (direct != null && direct !== '')
          return String(direct);
      }
      catch {
        // some native Headers.get implementations throw on unknown names
      }
    }
  }

  if (typeof h.forEach === 'function') {
    let found: string | null = null;
    try {
      h.forEach((value, key) => {
        if (found == null && String(key).toLowerCase() === lower)
          found = String(value);
      });
    }
    catch {
      // ignore
    }
    if (found != null)
      return found;
  }

  if (typeof h.entries === 'function') {
    try {
      for (const [key, value] of h.entries()) {
        if (String(key).toLowerCase() === lower)
          return String(value);
      }
    }
    catch {
      // ignore
    }
  }

  try {
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (key.toLowerCase() === lower && value != null)
        return String(value);
    }
  }
  catch {
    // ignore
  }

  return null;
}

type MutableHeaders = {
  get: (name: string) => string | null;
  set: (name: string, value: string) => void;
  has: (name: string) => boolean;
  forEach: (fn: (value: string, key: string) => void) => void;
};

function createHeadersBag(seed?: Record<string, string>): MutableHeaders {
  const map = new Map<string, string>();
  if (seed) {
    for (const [k, v] of Object.entries(seed))
      map.set(k.toLowerCase(), v);
  }
  return {
    get: name => map.get(name.toLowerCase()) ?? null,
    set: (name, value) => {
      map.set(name.toLowerCase(), value);
    },
    has: name => map.has(name.toLowerCase()),
    forEach: (fn) => {
      for (const [k, v] of map) fn(v, k);
    },
  };
}

/**
 * Build a headers bag that always exposes `.get`, seeding critical fields via
 * readHeader first. Native Lynx Headers often do not enumerate with
 * Object.entries / forEach the way Web does — copying only via iteration
 * drops Content-Type and breaks masto's getEncoding().
 */
export function normalizeResponseHeaders(source: unknown): MutableHeaders {
  const headers = createHeadersBag();

  // Prefer explicit gets for fields masto needs.
  const contentType = readHeader(source, 'content-type');
  if (contentType)
    headers.set('content-type', contentType);
  const link = readHeader(source, 'link');
  if (link)
    headers.set('link', link);

  if (source && typeof source === 'object') {
    const h = source as {
      forEach?: (fn: (value: string, key: string) => void) => void;
      entries?: () => IterableIterator<[string, string]>;
    };
    try {
      if (typeof h.forEach === 'function') {
        h.forEach((value, key) => headers.set(key, String(value)));
      }
      else if (typeof h.entries === 'function') {
        for (const [key, value] of h.entries()) headers.set(key, String(value));
      }
    }
    catch {
      // keep seeded content-type / link
    }
  }

  return headers;
}

/**
 * Lynx native Headers can enumerate mixed-case response names while `.get()`
 * only matches the original casing. masto always asks for lowercase `link`, so
 * add a case-insensitive fallback on the existing Headers object. Keeping the
 * original object means the native Response and its unread body stay intact.
 */
function patchNativeHeaderGet(source: unknown): boolean {
  if (!source || typeof source !== 'object')
    return false;

  const headers = source as { get?: (name: string) => unknown };
  if (typeof headers.get !== 'function')
    return false;

  const originalGet = headers.get.bind(headers);
  const normalized = normalizeResponseHeaders(source);
  const compatibleGet = (name: string): string | null => {
    try {
      const direct = originalGet(name);
      if (direct != null && direct !== '')
        return String(direct);
    }
    catch {
      // Fall back to the case-insensitive snapshot below.
    }
    return normalized.get(name);
  };

  try {
    Object.defineProperty(headers, 'get', {
      value: compatibleGet,
      configurable: true,
      writable: true,
    });
  }
  catch {
    try {
      headers.get = compatibleGet;
    }
    catch {
      return false;
    }
  }

  return true;
}

function requestUrl(input: unknown): string {
  if (typeof input === 'string')
    return input;
  if (input && typeof input === 'object') {
    const r = input as { url?: unknown; href?: unknown };
    if (typeof r.url === 'string')
      return r.url;
    if (typeof r.href === 'string')
      return r.href;
  }
  return String(input ?? '');
}

/**
 * When Mastodon-compatible APIs return a page of entities but the runtime
 * stripped the `Link` header, synthesize `rel="next"` so masto.js Paginator
 * can continue. Timelines / notifications / follow lists use `max_id`;
 * offset-based trends use `offset`.
 */
export function synthesizeNextLink(
  requestHref: string,
  bodyText: string,
): string | null {
  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  }
  catch {
    return null;
  }
  if (!Array.isArray(data) || data.length === 0)
    return null;

  if (!requestHref)
    return null;

  const hashIndex = requestHref.indexOf('#');
  const hash = hashIndex >= 0 ? requestHref.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? requestHref.slice(0, hashIndex) : requestHref;
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const rawQuery = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  const pairs = rawQuery ? rawQuery.split('&').filter(Boolean) : [];

  const decodeKey = (pair: string) => {
    const raw = pair.split('=', 1)[0];
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' '));
    }
    catch {
      return raw;
    }
  };
  const getParam = (name: string): string | null => {
    const pair = pairs.find(item => decodeKey(item) === name);
    if (!pair)
      return null;
    const raw = pair.includes('=') ? pair.slice(pair.indexOf('=') + 1) : '';
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' '));
    }
    catch {
      return raw;
    }
  };
  const setParam = (name: string, value: string): string => {
    const kept = pairs.filter(item => decodeKey(item) !== name);
    kept.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    return `${base}?${kept.join('&')}${hash}`;
  };

  let nextHref: string;
  const last = data[data.length - 1] as Record<string, unknown>;
  if (last && last.id != null) {
    const nextMax = String(last.id);
    // Avoid a tight loop if the server ignored max_id and returned the same head.
    if (getParam('max_id') === nextMax)
      return null;
    nextHref = setParam('max_id', nextMax);
  }
  else {
    const prevOffset = Number(getParam('offset') || '0');
    if (!Number.isFinite(prevOffset))
      return null;
    nextHref = setParam('offset', String(prevOffset + data.length));
  }

  return `<${nextHref}>; rel="next"`;
}

function buildPatchedResponse(
  response: any,
  text: string,
  headers: MutableHeaders,
  input: unknown,
): any {
  const status = typeof response?.status === 'number' ? response.status : 200;
  const ok = typeof response?.ok === 'boolean'
    ? response.ok
    : status >= 200 && status < 300;
  const statusText = response?.statusText ?? '';
  const url = response?.url ?? requestUrl(input);

  // Prefer a real Response so `instanceof Response` still works in masto's
  // error path (Lynx documents Response as available since 2.18).
  if (typeof Response === 'function') {
    try {
      const initHeaders: Record<string, string> = {};
      headers.forEach((value, key) => {
        initHeaders[key] = value;
      });
      const built = new Response(text, { status, statusText, headers: initHeaders });
      // Some Lynx builds omit .url on constructed Responses.
      if (!(built as any).url && url) {
        try {
          Object.defineProperty(built, 'url', { value: url, configurable: true });
        }
        catch {
          // ignore
        }
      }
      return built;
    }
    catch {
      // fall through to duck-typed response
    }
  }

  return {
    ok,
    status,
    statusText,
    url,
    headers,
    async text() {
      return text;
    },
    async json() {
      return JSON.parse(text);
    },
  };
}

/**
 * Wrap fetch for masto.js pagination without breaking Lynx's native Response.
 *
 * Per https://lynxjs.org/guide/interaction/networking — Lynx Fetch is Web-
 * compatible with subtle differences; keep the native Response when `Link`
 * is already readable. Only buffer + rebuild when we must synthesize `Link`
 * (native stacks often drop that header after the first Mastodon page).
 */
export function wrapFetchForMastoPagination(fetchImpl: FetchLike): FetchLike {
  return async function fetchWithMastoLink(input: unknown, init?: unknown) {
    const response = await fetchImpl(input, init);

    // Fast path: leave Lynx/Web Response and body untouched when Link exists.
    // Lynx may expose it only through iteration because Headers.get is
    // case-sensitive; patch that method in place before masto reads `link`.
    if (readHeader(response?.headers, 'link')) {
      patchNativeHeaderGet(response?.headers);
      try {
        if (response?.headers?.get?.('link'))
          return response;
      }
      catch {
        // Fall through to the buffered compatibility response.
      }
    }

    // Need body to synthesize next — buffer once. Always keep Content-Type
    // via readHeader; empty iteration of native Headers was dropping it and
    // causing masto "unknown encoding" → Failed to load timeline.
    const text = await response.text();
    const headers = normalizeResponseHeaders(response?.headers);
    if (!headers.get('content-type'))
      headers.set('content-type', 'application/json');

    const synthesized = synthesizeNextLink(requestUrl(input), text);
    if (synthesized)
      headers.set('link', synthesized);

    return buildPatchedResponse(response, text, headers, input);
  };
}
