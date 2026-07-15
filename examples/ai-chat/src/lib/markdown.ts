/**
 * Minimal streaming-tolerant markdown parser. Replaces Comark + Shiki:
 * Lynx cannot render HTML (no v-html, no DOM), so markdown becomes a block
 * tree rendered with native <text>/<view> nodes by MarkdownView.vue, and
 * code highlighting is a small regex tokenizer instead of Shiki grammars.
 */

export interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
  text: string;
  href?: string;
}

export type TableAlignment = 'left' | 'center' | 'right' | null;

export type Block =
  | { type: 'p'; inline: InlineToken[] }
  | { type: 'heading'; level: number; inline: InlineToken[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: InlineToken[][] }
  | { type: 'quote'; inline: InlineToken[] }
  | {
      type: 'table';
      headers: InlineToken[][];
      rows: InlineToken[][][];
      alignments: TableAlignment[];
    }
  | { type: 'hr' };

const INLINE_RE = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*\s][^*]*)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let rest = text;
  for (;;) {
    const match = INLINE_RE.exec(rest);
    if (!match) {
      if (rest) tokens.push({ type: 'text', text: rest });
      return tokens;
    }
    if (match.index > 0) {
      tokens.push({ type: 'text', text: rest.slice(0, match.index) });
    }
    if (match[1]) tokens.push({ type: 'code', text: match[2]! });
    else if (match[3]) tokens.push({ type: 'bold', text: match[4]! });
    else if (match[5]) tokens.push({ type: 'italic', text: match[6]! });
    else if (match[7]) tokens.push({ type: 'link', text: match[8]!, href: match[9]! });
    rest = rest.slice(match.index + match[0].length);
  }
}

function hasUnescapedTerminalPipe(source: string): boolean {
  if (!source.endsWith('|')) return false;
  let slashes = 0;
  for (let i = source.length - 2; i >= 0 && source[i] === '\\'; i--) slashes++;
  return slashes % 2 === 0;
}

/** Split a Markdown pipe row while preserving escaped and inline-code pipes. */
function splitTableRow(line: string): string[] | null {
  const source = line.trim();
  const cells: string[] = [];
  let cell = '';
  let inCode = false;
  let sawPipe = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (char === '\\' && source[i + 1] === '|') {
      cell += '|';
      i++;
      continue;
    }
    if (char === '`') {
      inCode = !inCode;
      cell += char;
      continue;
    }
    if (char === '|' && !inCode) {
      cells.push(cell.trim());
      cell = '';
      sawPipe = true;
      continue;
    }
    cell += char;
  }

  if (!sawPipe) return null;
  cells.push(cell.trim());
  if (source.startsWith('|')) cells.shift();
  if (hasUnescapedTerminalPipe(source)) cells.pop();
  return cells;
}

function tableAlignment(cell: string): TableAlignment | undefined {
  const delimiter = cell.trim();
  if (!/^:?-{3,}:?$/.test(delimiter)) return undefined;
  const left = delimiter.startsWith(':');
  const right = delimiter.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return null;
}

function parseTable(
  lines: string[],
  start: number,
): { block: Extract<Block, { type: 'table' }>; next: number } | null {
  const header = splitTableRow(lines[start] ?? '');
  const delimiter = splitTableRow(lines[start + 1] ?? '');
  if (!header?.length || !delimiter || delimiter.length !== header.length) return null;

  const alignments = delimiter.map(tableAlignment);
  if (alignments.some((alignment) => alignment === undefined)) return null;

  const rows: InlineToken[][][] = [];
  let next = start + 2;
  while (next < lines.length && lines[next]!.trim()) {
    const cells = splitTableRow(lines[next]!);
    if (!cells) break;
    const normalized = cells.slice(0, header.length);
    while (normalized.length < header.length) normalized.push('');
    rows.push(normalized.map(parseInline));
    next++;
  }

  return {
    block: {
      type: 'table',
      headers: header.map(parseInline),
      rows,
      alignments: alignments as TableAlignment[],
    },
    next,
  };
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.split('\n');
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: { lang: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', inline: parseInline(paragraph.join(' ')) });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({
        type: 'list',
        ordered: list.ordered,
        items: list.items.map(parseInline),
      });
      list = null;
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]!;
    if (code) {
      if (line.trimEnd() === '```') {
        blocks.push({ type: 'code', lang: code.lang, code: code.lines.join('\n') });
        code = null;
      } else {
        code.lines.push(line);
      }
      continue;
    }

    const table = parseTable(lines, lineIndex);
    if (table) {
      flushParagraph();
      flushList();
      blocks.push(table.block);
      lineIndex = table.next - 1;
      continue;
    }

    const fence = line.match(/^```(\w*)/);
    if (fence) {
      flushParagraph();
      flushList();
      code = { lang: fence[1] ?? '', lines: [] };
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: heading[1]!.length,
        inline: parseInline(heading[2]!),
      });
      continue;
    }

    if (/^\s*([-*_]){3,}\s*$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'hr' });
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', inline: parseInline(quote[1]!) });
      continue;
    }

    const item = line.match(/^\s*(?:[-*+]|(\d+)[.)])\s+(.*)$/);
    if (item) {
      flushParagraph();
      const ordered = Boolean(item[1]);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item[2]!);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  // Unterminated code fence while streaming: show what we have so far.
  if (code) {
    const pending = code as { lang: string; lines: string[] };
    blocks.push({ type: 'code', lang: pending.lang, code: pending.lines.join('\n') });
  }
  flushParagraph();
  flushList();
  return blocks;
}

// --- lightweight code highlighting ----------------------------------------

export interface CodeToken {
  text: string;
  /** css class suffix: kw | str | com | num | fn | plain */
  kind: 'kw' | 'str' | 'com' | 'num' | 'fn' | 'plain';
}

const KEYWORDS = new Set(
  (
    'const let var function return if else for while switch case break continue ' +
    'import export from default class extends new this super async await try catch ' +
    'finally throw typeof instanceof in of null undefined true false void delete ' +
    'interface type enum implements public private protected readonly static ' +
    'def elif except lambda pass raise with yield not and or is print fn mut impl ' +
    'struct trait match loop pub use mod crate self package func go chan defer'
  ).split(' '),
);

const CODE_RE =
  /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)(?=\s*\()|\b([A-Za-z_$][\w$]*)\b|(\s+|[^\w\s]+)/g;

export function tokenizeCodeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let match: RegExpExecArray | null;
  CODE_RE.lastIndex = 0;
  while ((match = CODE_RE.exec(line))) {
    const [, comment, str, num, fn, word, other] = match;
    if (comment !== undefined) tokens.push({ text: comment, kind: 'com' });
    else if (str !== undefined) tokens.push({ text: str, kind: 'str' });
    else if (num !== undefined) tokens.push({ text: num, kind: 'num' });
    else if (fn !== undefined) {
      tokens.push({ text: fn, kind: KEYWORDS.has(fn) ? 'kw' : 'fn' });
    } else if (word !== undefined) {
      tokens.push({ text: word, kind: KEYWORDS.has(word) ? 'kw' : 'plain' });
    } else if (other !== undefined) tokens.push({ text: other, kind: 'plain' });
  }
  return tokens;
}
