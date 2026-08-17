// masto only uses these two change-case exports for Mastodon action names and
// JSON keys, whose wire format is ASCII. change-case@5 uses Unicode property
// escapes that PrimJS cannot parse, even though those broader semantics are
// unnecessary at this API boundary.
const SPLIT_LOWER_UPPER_RE = /([a-z\d])([A-Z])/g;
const SPLIT_UPPER_UPPER_RE = /([A-Z])([A-Z][a-z])/g;
const STRIP_RE = /[^A-Z\d]+/gi;

function split(input: string): string[] {
  const value = input
    .trim()
    .replace(SPLIT_LOWER_UPPER_RE, '$1\0$2')
    .replace(SPLIT_UPPER_UPPER_RE, '$1\0$2')
    .replace(STRIP_RE, '\0')
    .replace(/^\0+|\0+$/g, '');

  return value ? value.split('\0') : [];
}

export function camelCase(input: string): string {
  return split(input)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0)
        return lower;
      const initial = lower[0];
      return `${initial >= '0' && initial <= '9' ? `_${initial}` : initial.toUpperCase()}${lower.slice(1)}`;
    })
    .join('');
}

export function snakeCase(input: string): string {
  return split(input).map(word => word.toLowerCase()).join('_');
}
