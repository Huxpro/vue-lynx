// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Convert a Vapor compiler HTML string into the REGISTER_TREE `TemplateNode`
 * shape — without allocating a ShadowElement tree.
 *
 * Used by:
 *  - build-time structured-template rewrite (skip runtime HTML parse)
 *  - IFR×ET bake path (straight-line create from the same IR)
 *
 * Semantics mirror `buildStructure` in shadow-element.ts: only-child #text
 * folds into `props.t`, comments / empty text keep preorder slots, dynamic
 * interpolation placeholders (`" "`) are omitted from baked text.
 */

import type { TemplateNode, TemplateNodeProps } from './ops.js';

const NAMED_ENTITIES: Record<string, string> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(text: string): string {
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

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

/** Parse a style attribute value into the object form `buildStructure` uses. */
function parseStyleAttr(raw: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const part of raw.split(';')) {
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    const key = part.slice(0, colon).trim();
    const value = part.slice(colon + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

interface ProtoNode {
  tag: string;
  className: string;
  style: Record<string, unknown> | null;
  attrs: [string, string][] | null;
  id: string | undefined;
  text: string | undefined;
  children: ProtoNode[];
}

function parseProto(html: string): ProtoNode {
  const fragment: ProtoNode = {
    tag: '#fragment',
    className: '',
    style: null,
    attrs: null,
    id: undefined,
    text: undefined,
    children: [],
  };
  const stack: ProtoNode[] = [fragment];
  const top = (): ProtoNode => stack[stack.length - 1]!;

  let i = 0;
  const len = html.length;

  while (i < len) {
    if (html[i] === '<') {
      if (html[i + 1] === '!') {
        if (html.startsWith('<!--', i)) {
          const end = html.indexOf('-->', i + 4);
          const text = end === -1 ? html.slice(i + 4) : html.slice(i + 4, end);
          top().children.push({
            tag: '#comment',
            className: '',
            style: null,
            attrs: null,
            id: undefined,
            text: decodeEntities(text),
            children: [],
          });
          i = end === -1 ? len : end + 3;
        } else {
          const end = html.indexOf('>', i);
          top().children.push({
            tag: '#comment',
            className: '',
            style: null,
            attrs: null,
            id: undefined,
            text: '',
            children: [],
          });
          i = end === -1 ? len : end + 1;
        }
        continue;
      }

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

      let j = i + 1;
      while (
        j < len && !isWhitespace(html[j]!) && html[j] !== '>' && html[j] !== '/'
      ) {
        j++;
      }
      const tag = html.slice(i + 1, j);
      const el: ProtoNode = {
        tag,
        className: '',
        style: null,
        attrs: null,
        id: undefined,
        text: undefined,
        children: [],
      };

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
        if (name) {
          const decoded = decodeEntities(value);
          if (name === 'class') {
            el.className = decoded;
          } else if (name === 'style') {
            el.style = parseStyleAttr(decoded);
          } else if (name === 'id') {
            el.id = decoded;
          } else {
            if (!el.attrs) el.attrs = [];
            el.attrs.push([name, decoded]);
          }
        }
      }
      i++; // '>'

      top().children.push(el);
      if (!selfClosing && !VOID_ELEMENTS.has(tag)) {
        stack.push(el);
      }
      continue;
    }

    let end = html.indexOf('<', i);
    if (end === -1) end = len;
    const raw = html.slice(i, end);
    if (raw) {
      top().children.push({
        tag: '#text',
        className: '',
        style: null,
        attrs: null,
        id: undefined,
        text: decodeEntities(raw),
        children: [],
      });
    }
    i = end;
  }

  return fragment;
}

function isOnlyChildText(proto: ProtoNode): boolean {
  return (
    proto.tag !== '#text'
    && proto.tag !== '#comment'
    && proto.tag !== '#fragment'
    && proto.children.length === 1
    && proto.children[0]!.tag === '#text'
  );
}

function emitStructure(
  proto: ProtoNode,
  counter: { value: number },
): TemplateNode {
  counter.value++;
  if (proto.tag === '#comment') {
    return ['#comment', 0, []];
  }
  if (proto.tag === '#text') {
    return ['#text', proto.text ? { t: proto.text } : 0, []];
  }

  const props: TemplateNodeProps = {};
  if (proto.className) props.c = proto.className;
  if (proto.style && Object.keys(proto.style).length > 0) {
    props.s = { ...proto.style };
  }
  if (proto.attrs && proto.attrs.length > 0) props.a = [...proto.attrs];
  if (proto.id !== undefined) props.i = proto.id;

  const children: TemplateNode[] = [];
  if (isOnlyChildText(proto)) {
    const text = proto.children[0]!.text;
    if (text != null && text !== ' ') props.t = text;
  } else {
    if (proto.text != null) props.t = proto.text;
    for (const child of proto.children) {
      children.push(emitStructure(child, counter));
    }
  }

  const hasProps = Object.keys(props).length > 0;
  return [proto.tag, hasProps ? props : 0, children];
}

/**
 * Parse a Vapor `template()` HTML string into `{ structure, slotCount }`.
 * `slotCount` is the dense preorder length (including comment / empty-text
 * slots), matching `CLONE_TREE` uid reservation.
 */
export function htmlToTemplateNode(html: string): {
  structure: TemplateNode;
  slotCount: number;
} {
  const frag = parseProto(html);
  // Vapor's template() takes the first child of the fragment as the root
  // (see runtime-vapor: `_child(t.content)`). Multi-root fragments are not
  // emitted by the compiler when flags request a single root.
  const root = frag.children[0];
  if (!root) {
    return { structure: ['#comment', 0, []], slotCount: 1 };
  }
  const counter = { value: 0 };
  const structure = emitStructure(root, counter);
  return { structure, slotCount: counter.value };
}

function hasProps(
  props: TemplateNodeProps | 0,
): props is TemplateNodeProps {
  return props !== 0;
}

/**
 * Detect preorder slots that look like dynamic holes in a baked skeleton:
 * folded/aliased text placeholders (`props.t` absent on an element that
 * vapor would fill via setText) and `#text` nodes with a single-space
 * placeholder. Used by IFR×ET sparse naming heuristics until the compiler
 * emits authoritative hole lists.
 */
export function inferHoleSlots(structure: TemplateNode): number[] {
  const holes: number[] = [];
  let slot = 0;

  const walk = (node: TemplateNode): void => {
    const index = slot++;
    const [tag, props, children] = node;
    if (tag === '#text') {
      const text = hasProps(props) ? props.t : undefined;
      if (text === undefined || text === '' || text === ' ') {
        holes.push(index);
      }
      return;
    }
    if (tag === '#comment') return;
    // Folded text host with the interpolation placeholder omitted — vapor
    // will setText on the aliased #text / host. Typical for `<text> </text>`.
    if (tag === 'text' && children.length === 0) {
      const text = hasProps(props) ? props.t : undefined;
      if (text === undefined || text === ' ') {
        holes.push(index);
      }
    }
    for (const child of children) walk(child);
  };

  walk(structure);
  return holes;
}

/**
 * Preorder slots that IFR MT must materialise as ShadowElement facades so
 * vapor `child` / `next` / `txt` can reach holes — without cloning entire
 * static subtrees off the navigation path.
 *
 * Includes: root, holes, ancestors of holes, and prefix siblings up to the
 * last hole-bearing child at each parent (so `next()` walks stay valid).
 */
export function computeIfrNavSlots(
  structure: TemplateNode,
  holes: readonly number[],
): Set<number> {
  type NodeInfo = {
    slot: number;
    parent: number | null;
    children: number[];
    /** Preorder slots in this subtree, including self. */
    subtree: number[];
  };

  const infos: NodeInfo[] = [];
  let nextSlot = 0;

  const walk = (node: TemplateNode, parent: number | null): NodeInfo => {
    const slot = nextSlot++;
    const children: number[] = [];
    const subtree: number[] = [slot];
    const [, , kids] = node;
    const info: NodeInfo = { slot, parent, children, subtree };
    infos.push(info);
    for (const kid of kids) {
      const childInfo = walk(kid, slot);
      children.push(childInfo.slot);
      for (const s of childInfo.subtree) subtree.push(s);
    }
    return info;
  };

  walk(structure, null);

  const bySlot = new Map<number, NodeInfo>();
  for (const info of infos) bySlot.set(info.slot, info);

  const needed = new Set<number>([0, ...holes]);

  for (const hole of holes) {
    let parent = bySlot.get(hole)?.parent ?? null;
    while (parent != null) {
      needed.add(parent);
      parent = bySlot.get(parent)?.parent ?? null;
    }
  }

  // Prefix siblings: vapor often does child(parent) then next() to a hole.
  for (const info of infos) {
    if (info.children.length === 0) continue;
    let last = -1;
    for (let i = 0; i < info.children.length; i++) {
      const childInfo = bySlot.get(info.children[i]!)!;
      if (childInfo.subtree.some((s) => needed.has(s))) last = i;
    }
    if (last >= 0) {
      for (let i = 0; i <= last; i++) needed.add(info.children[i]!);
    }
  }

  return needed;
}
