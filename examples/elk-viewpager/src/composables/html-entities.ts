// Replaces Elk's `tiny-decode` dependency: its browser build decodes
// entities through DOMParser, which exists neither in the Lynx JS runtime
// nor in the web-platform background worker. Mastodon's sanitized HTML
// only emits the XML-safe named entities plus numeric references, so a
// table + numeric decoder is complete for this input domain.
const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  middot: '·',
  bull: '•',
  ast: '*',
  grave: '`',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  copy: '©',
  reg: '®',
  trade: '™',
  sect: '§',
  para: '¶',
};

const ENTITY_RE = /&([a-z]+|#\d{1,6}|#x[0-9a-f]{1,6});/gi;

export function decode(value: string): string {
  ENTITY_RE.lastIndex = 0;
  return value.replace(ENTITY_RE, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      if (Number.isNaN(code) || code <= 0 || code > 0x10FFFF)
        return match;
      try {
        return String.fromCodePoint(code);
      }
      catch {
        return match;
      }
    }
    return NAMED[body.toLowerCase()] ?? match;
  });
}
