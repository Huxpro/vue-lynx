/**
 * Build-parse ≡ runtime-parse parity (#337 / #338).
 *
 * The plugin parses vapor `template()` HTML strings at build time
 * (`templateNodeFromHtml`) into the same `TemplateNode` shape the Background
 * Thread produces at runtime (`parseTemplate` + `buildStructure`). The
 * runtime structure oracle is NOT re-derived here: it is the actual
 * REGISTER_TREE payload emitted by a dense template clone, so any fold-rule
 * or attribute-semantics drift shows up as a parity failure instead of being
 * replicated into the test.
 *
 * Corpus: representative compiler-dialect shapes (bench rows, entities,
 * anchors, unquoted/valueless attrs, inline styles incl. auto-px, scoped
 * `data-v-*` tokens, implicit closes). Fuzz: PRNG-generated dialect HTML
 * (pattern: graph-eng-random-parity).
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  OP,
  OP_ARITY,
  hashVaporStructure,
  type TemplateNode,
} from 'vue-lynx/internal/ops';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { parseTemplate } from '../../../vue-lynx/runtime/src/vapor/html-parser.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import { templateNodeFromHtml } from '../../../vue-lynx/plugin/src/compiler/vapor-template-node.js';

afterEach(() => {
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
});

/** Runtime oracle: the REGISTER_TREE payload of a dense template clone. */
function runtimeStructure(html: string): TemplateNode | null {
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
  const proto = parseTemplate(html).firstChild;
  if (!proto || proto.tag.startsWith('#')) return null;
  setPendingVaporAddressing(undefined);
  proto.cloneNode(true);
  const ops = takeOps();
  // Arity-walk to the REGISTER_TREE frame — scoped (`data-v-*`) protos push
  // stray SET_CLASS ops for uids the MT never materializes, so the frame is
  // not necessarily first.
  let i = 0;
  while (i < ops.length) {
    const code = ops[i] as number;
    if (code === OP.REGISTER_TREE) return ops[i + 2] as TemplateNode;
    const arity = OP_ARITY[code];
    expect(arity).toBeDefined();
    i += arity! + 1;
  }
  throw new Error('no REGISTER_TREE frame emitted');
}

function slotCountOf(structure: TemplateNode): number {
  let n = 0;
  const walk = (node: TemplateNode): void => {
    n++;
    for (const child of node[2]) walk(child);
  };
  walk(structure);
  return n;
}

const CORPUS: string[] = [
  // js-framework-benchmark row (the storms workload shape)
  '<view class=row><text class=col-id> </text><text class=col-label> </text><text class=col-remove>x</text></view>',
  // sfc-probe card shape: nested statics + hole placeholders
  '<view class=card><image class=avatar src=a.png><view class=body><text class=title> </text><text class=subtitle>static sub</text></view></view>',
  // entities in text and attributes
  '<text>a &lt;b&gt; &amp; &#65; &#x41; &nbsp;.</text>',
  '<view title="q&quot;t&apos;s"><text>&amp;ok</text></view>',
  // anchors + comments + void elements
  '<view><!><text>x</text><!--note--><input></view>',
  // unclosed tail (compiler-minimized output)
  '<view class=container><text class=title> </text><!><input>',
  // implicit close of inner tags
  '<view><view><text>deep</text><image src=x.png></view>',
  // single hole placeholder root child
  '<text> </text>',
  // unquoted / single-quoted / valueless attributes
  "<view data-x=1 data-y='two' flat><text mode=plain>t</text></view>",
  // inline styles: strings, numeric auto-px, dimensionless, kebab-case, flex
  '<view style="color:red;flex:1;width:5;opacity:.5;font-size:12px;border-top-width:2"></view>',
  // scoped CSS tokens merge into the class fingerprint
  '<view data-v-7ba5bd90 class=card><text data-v-7ba5bd90 class=t>hi</text></view>',
  // id attribute (Teleport registry) + nested folds
  '<view id=host><view class=inner><text>fold</text></view><text> </text></view>',
  // multiple text siblings (no fold)
  '<view><text>a</text><text>b</text>tail</view>',
  // scroll-view / typed creators
  '<scroll-view scroll-y=true><view class=item><text>1</text></view></scroll-view>',
];

describe('build-parse ≡ runtime-parse (corpus)', () => {
  for (const html of CORPUS) {
    it(JSON.stringify(html.slice(0, 60)), () => {
      const runtime = runtimeStructure(html);
      const built = templateNodeFromHtml(html, { autoPixelUnit: true });
      expect(runtime).not.toBeNull();
      expect(built).not.toBeNull();
      expect(built!.structure).toEqual(runtime);
      expect(built!.slotCount).toBe(slotCountOf(runtime!));
      expect(built!.hash).toBe(
        hashVaporStructure(JSON.stringify(runtime)),
      );
    });
  }
});

// ---------------------------------------------------------------------------
// PRNG fuzz — seeded, reproducible
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAGS = ['view', 'text', 'image', 'scroll-view', 'x-custom'];
const VOIDS = ['input', 'img', 'br'];

function randomAttrs(rand: () => number): string {
  let out = '';
  if (rand() < 0.5) {
    const cls = `c${Math.floor(rand() * 10)}${rand() < 0.3 ? ` d${Math.floor(rand() * 5)}` : ''}`;
    out += rand() < 0.5 ? ` class=${cls.split(' ')[0]}` : ` class="${cls}"`;
  }
  if (rand() < 0.25) out += ` data-v-${Math.floor(rand() * 0xffff).toString(16)}`;
  if (rand() < 0.25) {
    const styles = ['color:red', 'width:5', 'flex:1', 'opacity:.5', 'margin-top:3'];
    const n = 1 + Math.floor(rand() * 3);
    const picked = Array.from({ length: n }, () => styles[Math.floor(rand() * styles.length)]);
    out += ` style="${picked.join(';')}"`;
  }
  if (rand() < 0.2) out += ` id=t${Math.floor(rand() * 100)}`;
  if (rand() < 0.4) out += ` a${Math.floor(rand() * 5)}=${rand() < 0.5 ? `v${Math.floor(rand() * 10)}` : `'q ${Math.floor(rand() * 10)}'`}`;
  if (rand() < 0.15) out += ' flat';
  return out;
}

function randomText(rand: () => number): string {
  const roll = rand();
  if (roll < 0.25) return ' ';
  if (roll < 0.5) return `t${Math.floor(rand() * 100)}`;
  return `a&amp;b&lt;${Math.floor(rand() * 10)}&gt;&#65;`;
}

function randomHtml(rand: () => number, depth = 0): string {
  const tag = TAGS[Math.floor(rand() * TAGS.length)]!;
  let out = `<${tag}${randomAttrs(rand)}>`;
  const childCount = depth >= 3 ? 0 : Math.floor(rand() * 4);
  if (childCount === 0 && rand() < 0.6) {
    out += randomText(rand); // only-child text → fold rule
  } else {
    for (let i = 0; i < childCount; i++) {
      const roll = rand();
      if (roll < 0.15) out += '<!>';
      else if (roll < 0.25) out += `<!--n${Math.floor(rand() * 10)}-->`;
      else if (roll < 0.4) out += randomText(rand);
      else if (roll < 0.55) out += `<${VOIDS[Math.floor(rand() * VOIDS.length)]}${randomAttrs(rand)}>`;
      else out += randomHtml(rand, depth + 1);
    }
  }
  // Compiler output may leave trailing tags unclosed — exercise auto-close.
  if (!(depth === 0 && rand() < 0.3)) out += `</${tag}>`;
  return out;
}

describe('build-parse ≡ runtime-parse (PRNG fuzz)', () => {
  const RUNS = 60;
  for (let seed = 1; seed <= RUNS; seed++) {
    it(`seed ${seed}`, () => {
      const html = randomHtml(mulberry32(seed * 7919));
      const runtime = runtimeStructure(html);
      const built = templateNodeFromHtml(html, { autoPixelUnit: true });
      expect(runtime).not.toBeNull();
      expect(built).not.toBeNull();
      expect(built!.structure).toEqual(runtime);
      expect(built!.slotCount).toBe(slotCountOf(runtime!));
      expect(built!.hash).toBe(hashVaporStructure(JSON.stringify(runtime)));
    });
  }
});
