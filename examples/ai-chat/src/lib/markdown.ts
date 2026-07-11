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

export type Block =
  | { type: 'p'; inline: InlineToken[] }
  | { type: 'heading'; level: number; inline: InlineToken[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: InlineToken[][] }
  | { type: 'quote'; inline: InlineToken[] }
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

  for (const line of lines) {
    if (code) {
      if (line.trimEnd() === '```') {
        blocks.push({ type: 'code', lang: code.lang, code: code.lines.join('\n') });
        code = null;
      } else {
        code.lines.push(line);
      }
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
