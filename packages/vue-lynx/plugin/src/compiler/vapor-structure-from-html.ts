/**
 * Extract REGISTER_TREE preorder tags from a vapor template HTML string.
 *
 * Mirrors runtime `html-parser` + `buildStructure` fold rules:
 * only-child `#text` is folded into the parent (no separate slot);
 * `#comment` always consumes a slot (including only-child comments).
 *
 * Kept local to the addressing analyzer so the plugin does not depend on the
 * runtime package. Must stay in lockstep with shadow-element.ts buildStructure.
 */

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

interface HtmlNode {
  tag: string;
  children: HtmlNode[];
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

/** Minimal vapor-dialect HTML → tree (same dialect as runtime html-parser). */
function parseHtmlTree(html: string): HtmlNode | null {
  const fragment: HtmlNode = { tag: '#fragment', children: [] };
  const stack: HtmlNode[] = [fragment];
  const top = (): HtmlNode => stack[stack.length - 1]!;

  let i = 0;
  const len = html.length;

  while (i < len) {
    if (html[i] === '<') {
      if (html[i + 1] === '!') {
        if (html.startsWith('<!--', i)) {
          const end = html.indexOf('-->', i + 4);
          top().children.push({ tag: '#comment', children: [] });
          i = end === -1 ? len : end + 3;
          continue;
        }
        // `<!>` empty comment anchor
        if (html[i + 2] === '>') {
          top().children.push({ tag: '#comment', children: [] });
          i += 3;
          continue;
        }
      }
      if (html[i + 1] === '/') {
        const gt = html.indexOf('>', i + 2);
        if (stack.length > 1) stack.pop();
        i = gt === -1 ? len : gt + 1;
        continue;
      }
      // open tag
      let j = i + 1;
      while (j < len && !isWhitespace(html[j]!) && html[j] !== '>' && html[j] !== '/') {
        j++;
      }
      const tag = html.slice(i + 1, j).toLowerCase();
      // skip attrs
      let selfClosing = false;
      while (j < len && html[j] !== '>') {
        if (html[j] === '/' && html[j + 1] === '>') {
          selfClosing = true;
          j += 2;
          break;
        }
        // quoted attr value
        if (html[j] === '"' || html[j] === "'") {
          const q = html[j]!;
          j++;
          while (j < len && html[j] !== q) j++;
          j++;
          continue;
        }
        j++;
      }
      if (j < len && html[j] === '>') j++;
      const node: HtmlNode = { tag, children: [] };
      top().children.push(node);
      i = j;
      if (!selfClosing && !VOID_ELEMENTS.has(tag)) {
        stack.push(node);
      }
      continue;
    }
    // text
    let j = i;
    while (j < len && html[j] !== '<') j++;
    const text = html.slice(i, j);
    if (text.length > 0) {
      top().children.push({ tag: '#text', children: [] });
    }
    i = j;
  }

  return fragment.children[0] ?? null;
}

interface StructSlot {
  tag: string;
  parent: number | null;
  children: number[];
}

/**
 * Preorder slots matching runtime `buildStructure` (only-child `#text` folded).
 */
export function structureSlotsFromHtml(html: string): {
  tags: string[];
  nodes: StructSlot[];
  slotCount: number;
} {
  const root = parseHtmlTree(html);
  const tags: string[] = [];
  const nodes: StructSlot[] = [];

  if (!root) {
    return { tags, nodes, slotCount: 0 };
  }

  const walk = (node: HtmlNode, parent: number | null): number => {
    const slot = tags.length;
    tags.push(node.tag);
    const info: StructSlot = { tag: node.tag, parent, children: [] };
    nodes[slot] = info;
    if (parent != null) nodes[parent]!.children.push(slot);

    if (node.tag === '#text' || node.tag === '#comment') {
      return slot;
    }

    const kids = node.children;
    // Runtime fold: only-child #text → no child slot.
    if (kids.length === 1 && kids[0]!.tag === '#text') {
      return slot;
    }

    for (const kid of kids) {
      walk(kid, slot);
    }
    return slot;
  };

  walk(root, null);
  return { tags, nodes, slotCount: tags.length };
}
