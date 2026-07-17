// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Build-time HTML parser for Vapor template strings (issue #234, Part A).
 *
 * `@vue/compiler-vapor` emits minified HTML like
 *
 *   `<view class=page><text class=label> </text><!><input>`
 *
 * On the Background Thread the runtime normally parses this with its own
 * parser (runtime/src/vapor/html-parser.ts) into inert ShadowElement
 * prototypes. When the plugin's `vaporBuildTimeTemplates` flag is on, we parse
 * the string HERE, at build time, and emit a structured {@link VaporTemplateIR}
 * literal instead — the runtime then rebuilds the identical inert tree without
 * any HTML parsing (runtime/src/vapor/build-inert.ts).
 *
 * This is a faithful port of the runtime parser: it MUST produce the exact same
 * node/attribute/text shape, including entity decoding, so the downstream
 * REGISTER_TEMPLATE payload and the pre-order uid contract stay byte-identical.
 */

import type { VaporTemplateIR } from 'vue-lynx/internal/ops';

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

const NAMED_ENTITIES: Record<string, string> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

/** Mutable builder node mirroring the inert ShadowElement prototype tree. */
interface BuildNode {
  tag: string;
  attrs: [string, string][];
  children: BuildNode[];
  /** text/comment character data */
  text?: string;
}

function toIR(node: BuildNode): VaporTemplateIR {
  if (node.tag === '#text' || node.tag === '#comment') {
    return [node.tag, node.text ?? ''];
  }
  return [node.tag, node.attrs, node.children.map(toIR)];
}

/**
 * Parse a Vapor template HTML string into the structured {@link VaporTemplateIR}
 * root-node list (the children of the would-be inert `#fragment`).
 */
export function parseTemplateToIR(html: string): VaporTemplateIR[] {
  const fragment: BuildNode = { tag: '#fragment', attrs: [], children: [] };
  const stack: BuildNode[] = [fragment];
  const top = (): BuildNode => stack[stack.length - 1]!;
  const append = (node: BuildNode): void => {
    top().children.push(node);
  };

  let i = 0;
  const len = html.length;

  while (i < len) {
    if (html[i] === '<') {
      // --- comments ----------------------------------------------------
      if (html[i + 1] === '!') {
        if (html.startsWith('<!--', i)) {
          const end = html.indexOf('-->', i + 4);
          const text = end === -1 ? html.slice(i + 4) : html.slice(i + 4, end);
          append({ tag: '#comment', attrs: [], children: [], text: decodeEntities(text) });
          i = end === -1 ? len : end + 3;
        } else {
          // `<!>` — anchor comment emitted by the vapor compiler.
          const end = html.indexOf('>', i);
          append({ tag: '#comment', attrs: [], children: [], text: '' });
          i = end === -1 ? len : end + 1;
        }
        continue;
      }

      // --- closing tag ---------------------------------------------------
      if (html[i + 1] === '/') {
        const end = html.indexOf('>', i);
        const name = html.slice(i + 2, end === -1 ? len : end).trim();
        for (let d = stack.length - 1; d >= 1; d--) {
          if (stack[d]!.tag === name) {
            stack.length = d;
            break;
          }
        }
        i = end === -1 ? len : end + 1;
        continue;
      }

      // --- opening tag ---------------------------------------------------
      let j = i + 1;
      while (j < len && !isWhitespace(html[j]!) && html[j] !== '>' && html[j] !== '/') {
        j++;
      }
      const tag = html.slice(i + 1, j);
      const el: BuildNode = { tag, attrs: [], children: [] };

      i = j;
      let selfClosing = false;
      while (i < len && html[i] !== '>') {
        while (i < len && isWhitespace(html[i]!)) i++;
        if (html[i] === '>') break;
        if (html[i] === '/') {
          selfClosing = true;
          i++;
          continue;
        }
        let k = i;
        while (
          k < len && !isWhitespace(html[k]!) && html[k] !== '='
          && html[k] !== '>' && html[k] !== '/'
        ) {
          k++;
        }
        const name = html.slice(i, k);
        i = k;
        while (i < len && isWhitespace(html[i]!)) i++;
        let value = '';
        if (html[i] === '=') {
          i++;
          while (i < len && isWhitespace(html[i]!)) i++;
          const quote = html[i];
          if (quote === '"' || quote === "'") {
            const end = html.indexOf(quote, i + 1);
            value = end === -1 ? html.slice(i + 1) : html.slice(i + 1, end);
            i = end === -1 ? len : end + 1;
          } else {
            let e = i;
            while (e < len && !isWhitespace(html[e]!) && html[e] !== '>') e++;
            value = html.slice(i, e);
            i = e;
          }
        }
        if (name) el.attrs.push([name, decodeEntities(value)]);
      }
      i++; // consume '>'

      append(el);
      if (!selfClosing && !VOID_ELEMENTS.has(tag)) {
        stack.push(el);
      }
      continue;
    }

    // --- text ----------------------------------------------------------
    let end = html.indexOf('<', i);
    if (end === -1) end = len;
    const raw = html.slice(i, end);
    if (raw) {
      append({ tag: '#text', attrs: [], children: [], text: decodeEntities(raw) });
    }
    i = end;
  }

  return fragment.children.map(toIR);
}
