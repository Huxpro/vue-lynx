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
 * Lynx native Response.headers sometimes omit `.get`, or only expose a
 * subset of names; masto.js pagination depends on `Link`.
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
    const direct = h.get(name) ?? h.get(lower) ?? h.get(name.replace(/^\w/, c => c.toUpperCase()));
    if (direct != null && direct !== '')
      return String(direct);
  }

  if (typeof h.forEach === 'function') {
    let found: string | null = null;
    h.forEach((value, key) => {
      if (found == null && String(key).toLowerCase() === lower)
        found = String(value);
    });
    if (found != null)
      return found;
  }

  if (typeof h.entries === 'function') {
    for (const [key, value] of h.entries()) {
      if (String(key).toLowerCase() === lower)
        return String(value);
    }
  }

  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === lower && value != null)
      return String(value);
  }

  return null;
}

type MutableHeaders = {
  get: (name: string) => string | null;
  set: (name: string, value: string) => void;
  has: (name: string) => boolean;
  forEach: (fn: (value: string, key: string) => void) => void;
};

function copyHeaders(source: unknown): MutableHeaders {
  const map = new Map<string, string>();

  const set = (name: string, value: string) => {
    map.set(name.toLowerCase(), value);
  };

  if (source && typeof source === 'object') {
    const h = source as {
      forEach?: (fn: (value: string, key: string) => void) => void;
      entries?: () => IterableIterator<[string, string]>;
    };
    if (typeof h.forEach === 'function') {
      h.forEach((value, key) => set(key, String(value)));
    }
    else if (typeof h.entries === 'function') {
      for (const [key, value] of h.entries()) set(key, String(value));
    }
    else {
      for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
        if (value != null)
          set(key, String(value));
      }
    }
  }

  return {
    get: name => map.get(name.toLowerCase()) ?? null,
    set: (name, value) => set(name, value),
    has: name => map.has(name.toLowerCase()),
    forEach: (fn) => {
      for (const [k, v] of map) fn(v, k);
    },
  };
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

  let nextHref: string;
  try {
    // Prefer URL when available (web / modern native); fall back to string surgery.
    if (typeof URL === 'function') {
      const url = new URL(requestHref);
      const last = data[data.length - 1] as Record<string, unknown>;
      if (last && last.id != null) {
        url.searchParams.set('max_id', String(last.id));
        // Avoid a tight loop if the server ignored max_id and returned the same head.
        const prevMax = new URL(requestHref).searchParams.get('max_id');
        if (prevMax === String(last.id))
          return null;
      }
      else {
        const prevOffset = Number(url.searchParams.get('offset') || '0');
        if (!Number.isFinite(prevOffset))
          return null;
        url.searchParams.set('offset', String(prevOffset + data.length));
      }
      nextHref = url.href;
    }
    else {
      return null;
    }
  }
  catch {
    return null;
  }

  return `<${nextHref}>; rel="next"`;
}

/**
 * Wrap fetch so Response.headers always supports `.get('link')` for masto.js.
 * If the native stack drops `Link`, synthesize the next page URL from the body.
 *
 * Body is buffered once (timeline pages are small JSON arrays).
 */
export function wrapFetchForMastoPagination(fetchImpl: FetchLike): FetchLike {
  return async function fetchWithMastoLink(input: unknown, init?: unknown) {
    const response = await fetchImpl(input, init);
    const headers = copyHeaders(response?.headers);
    const text = await response.text();

    if (!headers.get('link')) {
      const synthesized = synthesizeNextLink(requestUrl(input), text);
      if (synthesized)
        headers.set('link', synthesized);
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url ?? requestUrl(input),
      headers,
      async text() {
        return text;
      },
      async json() {
        return JSON.parse(text);
      },
    };
  };
}
