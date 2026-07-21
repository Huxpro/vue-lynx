// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Minimal HTML parser for Vapor template strings.
 *
 * `@vue/compiler-vapor` emits minimized HTML like
 *
 *   `<view class=container><text class=title> </text><!><input>`
 *
 * and `@vue/runtime-vapor`'s `template()` normally parses it with the
 * browser's `<template>` element. On the Lynx Background Thread we parse it
 * ourselves into **inert** ShadowElement prototypes (no Main Thread ops);
 * `cloneNode(true)` later materialises live instances.
 *
 * The dialect is compiler-generated, not arbitrary HTML:
 *  - tags may be unclosed at the end of the string (auto-close), and a
 *    closing tag implicitly closes any unclosed inner tags
 *  - attribute values may be unquoted, single- or double-quoted, or absent
 *  - `<!>` is an empty comment (insertion anchor); `<!--x-->` full comments
 *  - text nodes use standard entity escapes (&lt; &gt; &amp; &quot; &#39;…)
 *  - HTML void elements (input, img, br, …) never take children
 */

import { ShadowElement } from '../shadow-element.js';

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
  nbsp: ' ',
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

/**
 * Parse a Vapor template HTML string into an inert `#fragment`
 * ShadowElement whose children are the template root nodes.
 */
export function parseTemplate(html: string): ShadowElement {
  const fragment = new ShadowElement('#fragment');
  fragment._inert = true;

  const stack: ShadowElement[] = [fragment];
  const top = (): ShadowElement => stack[stack.length - 1]!;

  const appendChild = (node: ShadowElement): void => {
    node._inert = true;
    top()._link(node, null);
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
          const comment = new ShadowElement('#comment');
          comment._text = decodeEntities(text);
          appendChild(comment);
          i = end === -1 ? len : end + 3;
        } else {
          // `<!>` — anchor comment emitted by the vapor compiler.
          const end = html.indexOf('>', i);
          const comment = new ShadowElement('#comment');
          comment._text = '';
          appendChild(comment);
          i = end === -1 ? len : end + 1;
        }
        continue;
      }

      // --- closing tag ---------------------------------------------------
      if (html[i + 1] === '/') {
        const end = html.indexOf('>', i);
        const name = html.slice(i + 2, end === -1 ? len : end).trim();
        // Pop until the matching open tag (implicitly closing inner tags).
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
      const el = new ShadowElement(tag);

      // parse attributes
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
        // attribute name
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
        if (name) el._setAttrRecord(name, decodeEntities(value));
      }
      i++; // consume '>'

      appendChild(el);
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
      const text = new ShadowElement('#text');
      text._text = decodeEntities(raw);
      appendChild(text);
    }
    i = end;
  }

  return fragment;
}
