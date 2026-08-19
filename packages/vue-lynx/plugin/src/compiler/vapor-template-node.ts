// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Build-time parse of vapor `template()` HTML strings into the exact
 * `TemplateNode` structure the Background Thread produces at runtime
 * (#337 / #338).
 *
 * Mirrors, statement for statement:
 *  - runtime `vapor/html-parser.ts` `parseTemplate` (compiler dialect:
 *    unclosed tags, `<!>` anchors, unquoted attrs, entity escapes, void
 *    elements),
 *  - runtime `shadow-element.ts` `_setAttrRecord` (class / style / id /
 *    `data-v-*` scope classes / plain attrs) including inline-style parsing
 *    through `normalizeStylePropertyName` / `normalizeStyleValue`,
 *  - runtime `buildStructure` (only-child `#text` fold, single-space
 *    interpolation placeholder omitted, props packing order).
 *
 * The parity contract is enforced twice: by the corpus + PRNG fuzz tests
 * (build-parse ≡ runtime-parse), and at runtime by the structure-hash
 * fail-safe — a build here that disagrees with the BG parse produces a
 * different `hashVaporStructure`, and the runtime silently falls back to the
 * wire REGISTER_TREE path. Correctness never rides on this file.
 *
 * Also hosts the straight-line-PAPI `create()` codegen for the vapor
 * Code-Template cell (`+b:c`): the generated function materializes the whole
 * static skeleton and returns one handle per ADDRESSED slot (sparse order),
 * `null` for BG-only anchors — the exact element set the sparse interpreter
 * names, so `uid = base + indexInAddressed` addressing is unchanged.
 */

import type { TemplateNode, TemplateNodeProps } from 'vue-lynx/internal/ops';
import { hashVaporStructure } from 'vue-lynx/internal/ops';

export { hashVaporStructure };

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

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

// ---------------------------------------------------------------------------
// Style normalization — mirrors runtime style-normalization.ts, with the
// build-time `autoPixelUnit` plugin option standing in for the
// __VUE_LYNX_AUTO_PIXEL_UNIT__ define.
// ---------------------------------------------------------------------------

const DIMENSIONLESS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexOrder',
  'order',
  'opacity',
  'zIndex',
  'aspectRatio',
  'fontWeight',
  'lineClamp',
]);

const NUMERIC_VALUE = /^-?(?:\d+\.?\d*|\.\d+)$/;

function normalizeStylePropertyName(name: string): string {
  if (name.startsWith('--')) return name;
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function normalizeStyleValue(
  property: string,
  value: string,
  autoPixelUnit: boolean,
): unknown {
  if (property.startsWith('--')) return value;
  if (!NUMERIC_VALUE.test(value.trim())) return value;
  const numeric = Number(value);
  if (property === 'flex') return `${numeric}`;
  if (autoPixelUnit && !DIMENSIONLESS.has(property)) {
    return numeric === 0 ? 0 : `${numeric}px`;
  }
  return value.trim();
}

function parseInlineStyle(
  text: string,
  autoPixelUnit: boolean,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const decl of text.split(';')) {
    const idx = decl.indexOf(':');
    if (idx <= 0) continue;
    const key = normalizeStylePropertyName(decl.slice(0, idx).trim());
    const value = decl.slice(idx + 1).trim();
    if (key) out[key] = normalizeStyleValue(key, value, autoPixelUnit);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parse — build-side twin of runtime parseTemplate, recording the same
// attribute semantics as ShadowElement._setAttrRecord.
// ---------------------------------------------------------------------------

interface BuildNode {
  tag: string;
  text: string;
  baseClass: string;
  scopeClasses: string[];
  style: Record<string, unknown>;
  attrs: Map<string, string>;
  id: string | undefined;
  children: BuildNode[];
}

function newNode(tag: string): BuildNode {
  return {
    tag,
    text: '',
    baseClass: '',
    scopeClasses: [],
    style: {},
    attrs: new Map(),
    id: undefined,
    children: [],
  };
}

function setAttrRecord(
  node: BuildNode,
  key: string,
  value: string,
  autoPixelUnit: boolean,
): void {
  if (key === 'class') {
    node.baseClass = value;
  } else if (key === 'style') {
    node.style = parseInlineStyle(value, autoPixelUnit);
  } else if (key === 'id') {
    node.id = value;
  } else if (key.startsWith('data-v-')) {
    if (!node.scopeClasses.includes(key)) node.scopeClasses.push(key);
  } else {
    node.attrs.set(key, value);
  }
}

export interface ParseVaporTemplateOptions {
  /** Mirrors the plugin's `autoPixelUnit` (the runtime define). */
  autoPixelUnit?: boolean;
}

function parseHtml(html: string, autoPixelUnit: boolean): BuildNode {
  const fragment = newNode('#fragment');
  const stack: BuildNode[] = [fragment];
  const top = (): BuildNode => stack[stack.length - 1]!;

  let i = 0;
  const len = html.length;

  while (i < len) {
    if (html[i] === '<') {
      if (html[i + 1] === '!') {
        if (html.startsWith('<!--', i)) {
          const end = html.indexOf('-->', i + 4);
          const text = end === -1 ? html.slice(i + 4) : html.slice(i + 4, end);
          const comment = newNode('#comment');
          comment.text = decodeEntities(text);
          top().children.push(comment);
          i = end === -1 ? len : end + 3;
        } else {
          const end = html.indexOf('>', i);
          top().children.push(newNode('#comment'));
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
      while (j < len && !isWhitespace(html[j]!) && html[j] !== '>' && html[j] !== '/') {
        j++;
      }
      const tag = html.slice(i + 1, j);
      const el = newNode(tag);

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
        if (name) setAttrRecord(el, name, decodeEntities(value), autoPixelUnit);
      }
      i++; // consume '>'

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
      const text = newNode('#text');
      text.text = decodeEntities(raw);
      top().children.push(text);
    }
    i = end;
  }

  return fragment;
}

// ---------------------------------------------------------------------------
// buildStructure twin — same fold rules, same props packing.
// ---------------------------------------------------------------------------

function isOnlyChildText(node: BuildNode): boolean {
  return (
    !node.tag.startsWith('#')
    && node.children.length === 1
    && node.children[0]!.tag === '#text'
  );
}

function resolveClass(node: BuildNode): string {
  const parts: string[] = [];
  if (node.baseClass) parts.push(node.baseClass);
  for (const cls of node.scopeClasses) parts.push(cls);
  return parts.join(' ');
}

function hasAnyKey(o: Record<string, unknown>): boolean {
  for (const _ in o) return true;
  return false;
}

function buildStructure(
  node: BuildNode,
  counter: { value: number },
): TemplateNode {
  counter.value++;
  if (node.tag === '#comment') {
    return ['#comment', 0, []];
  }
  if (node.tag === '#text') {
    return ['#text', node.text ? { t: node.text } : 0, []];
  }

  const props: TemplateNodeProps = {};
  const resolvedClass = resolveClass(node);
  if (resolvedClass) props.c = resolvedClass;
  if (hasAnyKey(node.style)) {
    props.s = { ...node.style } as TemplateNodeProps['s'];
  }
  if (node.attrs.size > 0) props.a = [...node.attrs];
  if (node.id !== undefined) props.i = node.id;

  const fold = isOnlyChildText(node);
  const children: TemplateNode[] = [];
  if (fold) {
    const text = node.children[0]!.text;
    // Single-space dynamic-interpolation placeholder is omitted (a
    // renderEffect overwrites it immediately) — mirrors the runtime fold.
    if (text != null && text !== ' ') props.t = text;
  } else {
    for (const child of node.children) {
      children.push(buildStructure(child, counter));
    }
  }

  const hasProps = Object.keys(props).length > 0;
  return [node.tag, hasProps ? props : 0, children];
}

export interface VaporTemplateBuildResult {
  /** Structure of the template's FIRST root (the runtime clone prototype). */
  structure: TemplateNode;
  /** Preorder slot count (identical to the runtime buildStructure counter). */
  slotCount: number;
  /** `hashVaporStructure(JSON.stringify(structure))` — the fail-safe key. */
  hash: string;
}

/**
 * Parse a vapor template HTML string into the runtime-equivalent
 * `TemplateNode` (first root element only — `template()` prototypes are
 * `content.firstChild`). Returns null when the first root is not an element
 * (the runtime fast path never engages for those).
 */
export function templateNodeFromHtml(
  html: string,
  options: ParseVaporTemplateOptions = {},
): VaporTemplateBuildResult | null {
  const autoPixelUnit = options.autoPixelUnit ?? true;
  const fragment = parseHtml(html, autoPixelUnit);
  const root = fragment.children[0];
  if (!root || root.tag.startsWith('#')) return null;
  const counter = { value: 0 };
  const structure = buildStructure(root, counter);
  return {
    structure,
    slotCount: counter.value,
    hash: hashVaporStructure(JSON.stringify(structure)),
  };
}

// ---------------------------------------------------------------------------
// create() codegen — vapor Code-Template (`+b:c`, #337)
// ---------------------------------------------------------------------------

const TYPED_CREATE: Record<string, string> = {
  view: '__CreateView',
  text: '__CreateText',
  image: '__CreateImage',
  'scroll-view': '__CreateScrollView',
  // KeepAlive's internal storage container — mapped to view like the
  // interpreter's createTypedElement.
  div: '__CreateView',
};

export interface VaporCreateCodegen {
  /**
   * `function (P) { … return [h0, h1, …]; }` source. One handle per
   * ADDRESSED slot in sparse order; `null` for BG-only anchors (#comment /
   * empty #text) — the MT names `base + i` only for non-null handles,
   * matching `instantiateTemplateSparse` exactly.
   */
  src: string;
  /**
   * For each addressed index `i`: the addressed index of the DIRECT parent
   * when that parent is itself addressed, else -1 (root included). Drives
   * the MT insert-tracking bookkeeping, mirroring the sparse interpreter
   * (which only tracks named-child-under-named-parent edges).
   */
  namedParents: number[];
}

/**
 * Generate the straight-line-PAPI `create()` for a template structure and
 * its addressed (sparse A2) naming list. The generated code materializes the
 * full static skeleton exactly like the sparse interpreter: typed creators,
 * `__SetCSSId([el], 0)` per element, static props, bottom-up appends.
 */
export function codegenVaporCreate(
  structure: TemplateNode,
  addressed: readonly number[],
): VaporCreateCodegen {
  const slotToSparse = new Map(addressed.map((s, i) => [s, i] as const));
  const lines: string[] = [];
  const handles: string[] = new Array(addressed.length).fill('null');
  const namedParents: number[] = new Array(addressed.length).fill(-1);
  const counter = { value: 0 };
  let nextVar = 0;

  const emit = (
    node: TemplateNode,
    parentSparse: number | null,
  ): string | null => {
    const slot = counter.value++;
    const [tag, props, children] = node;
    const sparseIdx = slotToSparse.get(slot);

    if (tag === '#comment') return null;
    if (tag === '#text' && (!props || props.t === undefined || props.t === '')) {
      return null;
    }

    const v = `e${nextVar++}`;
    const createFn = TYPED_CREATE[tag];
    lines.push(
      tag === '#text'
        ? `const ${v} = __CreateText(P);`
        : createFn !== undefined
        ? `const ${v} = ${createFn}(P);`
        : `const ${v} = __CreateElement(${JSON.stringify(tag)}, P);`,
    );
    lines.push(`__SetCSSId([${v}], 0);`);
    if (props) {
      if (props.c !== undefined) {
        lines.push(`__SetClasses(${v}, ${JSON.stringify(props.c)});`);
      }
      if (props.s !== undefined) {
        lines.push(`__SetInlineStyles(${v}, ${JSON.stringify(props.s)});`);
      }
      if (props.a) {
        for (const [key, value] of props.a) {
          lines.push(
            `__SetAttribute(${v}, ${JSON.stringify(key)}, ${
              JSON.stringify(value)
            });`,
          );
        }
      }
      if (props.i !== undefined) {
        lines.push(`__SetID(${v}, ${JSON.stringify(props.i)});`);
      }
      if (props.t !== undefined) {
        lines.push(`__SetAttribute(${v}, 'text', ${JSON.stringify(props.t)});`);
      }
    }

    if (sparseIdx !== undefined) {
      handles[sparseIdx] = v;
      if (parentSparse !== null) namedParents[sparseIdx] = parentSparse;
    }

    for (const childNode of children) {
      const child = emit(childNode, sparseIdx ?? null);
      if (child) lines.push(`__AppendElement(${v}, ${child});`);
    }
    return v;
  };

  // The interpreter consumes the anchor's preorder slot before bailing —
  // emit() above increments the counter first for the same lockstep.
  emit(structure, null);

  const body = lines.map((l) => `  ${l}`).join('\n');
  return {
    src: `function (P) {\n${body}\n  return [${handles.join(', ')}];\n}`,
    namedParents,
  };
}
