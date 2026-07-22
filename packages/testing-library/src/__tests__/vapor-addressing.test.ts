/**
 * Compile-time Vapor addressing analysis (#297 / #298).
 *
 * Locks the hole set + addressed-node set (REGISTER_TREE preorder slots)
 * derived from compiler HTML structure (runtime fold rules) + IR holes.
 * Tag fingerprints guard sparse A2 against same-count preorder skew.
 */

import { describe, expect, it } from 'vitest';

import {
  VAPOR_ADDRESSING_KEY,
  analyzeVaporAddressing,
  annotateVaporAddressing,
} from '../../../vue-lynx/plugin/src/compiler/vapor-addressing.js';
import { structureSlotsFromHtml } from '../../../vue-lynx/plugin/src/compiler/vapor-structure-from-html.js';

function analyze(
  source: string,
  bindingMetadata: Record<string, string> = {},
) {
  return analyzeVaporAddressing(source, {
    bindingMetadata,
    isNativeTag: () => true,
  });
}

describe('structureSlotsFromHtml (runtime fold parity)', () => {
  it('folds only-child #text but keeps only-child #comment as a slot', () => {
    expect(structureSlotsFromHtml('<view><text>hi').tags).toEqual([
      'view',
      'text',
    ]);
    expect(structureSlotsFromHtml('<view><!--only-->').tags).toEqual([
      'view',
      '#comment',
    ]);
  });

  it('keeps sibling comments in preorder', () => {
    expect(
      structureSlotsFromHtml('<view><text> </text><!--c--><image>').tags,
    ).toEqual(['view', 'text', '#comment', 'image']);
  });
});

describe('analyzeVaporAddressing', () => {
  it('names dynamic text + attr holes and keeps the static middle sibling for nthChild', () => {
    const { templates } = analyze(
      `<view class="card">
        <text>{{ title }}</text>
        <text class="sub">hi</text>
        <image :src="url" />
      </view>`,
      { title: 'setup-ref', url: 'setup-ref' },
    );
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({
      templateIndex: 0,
      slotCount: 4,
      holes: [1, 3],
      addressed: [0, 1, 2, 3],
      tags: ['view', 'text', 'text', 'image'],
    });
  });

  it('includes ancestor wrappers on the child/child path (p* cursors)', () => {
    const { templates } = analyze(
      `<view>
        <view class="wrap"><text>{{ t }}</text></view>
        <text class="s">static</text>
      </view>`,
      { t: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      slotCount: 4,
      holes: [2],
      addressed: [0, 1, 2],
      tags: ['view', 'view', 'text'],
    });
  });

  it('keeps deep ancestor chain for inlined _child(_child(_child(...)))', () => {
    const { templates } = analyze(
      `<view><view class="a"><view class="b"><text>{{ t }}</text></view></view></view>`,
      { t: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      holes: [3],
      addressed: [0, 1, 2, 3],
      tags: ['view', 'view', 'view', 'text'],
    });
  });

  it('keeps prefix siblings before a trailing text hole', () => {
    const { templates } = analyze(
      `<view><text>a</text><text>b</text><text>{{ t }}</text></view>`,
      { t: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      holes: [3],
      addressed: [0, 1, 2, 3],
    });
  });

  it('marks an event host as a hole; skips unreferenced static children', () => {
    const { templates } = analyze(
      `<view @tap="onTap"><text class="c">hi</text></view>`,
      { onTap: 'setup-const' },
    );
    expect(templates[0]).toMatchObject({
      holes: [0],
      addressed: [0],
      slotCount: 2,
      tags: ['view'],
    });
  });

  it('fully static templates have no holes — only the root is addressed', () => {
    const { templates } = analyze(
      `<view class="only"><text class="s">static</text><text class="s2">also</text></view>`,
    );
    expect(templates[0]).toMatchObject({
      holes: [],
      addressed: [0],
      slotCount: 3,
      tags: ['view'],
    });
  });

  it('treats template ref + dynamic text as holes', () => {
    const { templates } = analyze(
      `<view ref="root"><text>{{ title }}</text></view>`,
      { title: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      holes: [0, 1],
      addressed: [0, 1],
    });
  });

  it('marks v-if hosts as holes and analyzes the positive branch template', () => {
    const { templates } = analyze(
      `<view>
        <view v-if="ok"><text>{{ title }}</text><image :src="url" /></view>
        <text>static</text>
      </view>`,
      { ok: 'setup-ref', title: 'setup-ref', url: 'setup-ref' },
    );
    expect(templates).toHaveLength(2);
    const outer = templates.find((t) => t.templateIndex === 1)!;
    const inner = templates.find((t) => t.templateIndex === 0)!;
    expect(outer).toMatchObject({
      holes: [0],
      addressed: [0],
    });
    expect(inner).toMatchObject({
      holes: [1, 2],
      addressed: [0, 1, 2],
    });
  });

  it('marks v-for hosts as holes and analyzes the list-item template', () => {
    const { templates } = analyze(
      `<view><text v-for="i in list" :key="i">{{ i }}</text></view>`,
      { list: 'setup-ref' },
    );
    expect(templates).toHaveLength(2);
    const outer = templates.find((t) => t.templateIndex === 1)!;
    const item = templates.find((t) => t.templateIndex === 0)!;
    expect(outer).toMatchObject({ holes: [0], addressed: [0] });
    expect(item).toMatchObject({ holes: [0], addressed: [0] });
  });

  it('marks component insertion parents as holes', () => {
    const { templates } = analyze(
      `<view><Comp /><text>{{ t }}</text></view>`,
      { t: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      holes: [0, 1],
      addressed: [0, 1],
    });
  });

  // --- Offset / fold-skew cases (review ①) ---------------------------------

  it('comment siblings keep their own slots (not folded as text-like)', () => {
    const { templates } = analyze(
      `<view><text>{{ t }}</text><!--c--><image :src="url" /></view>`,
      { t: 'setup-ref', url: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      // 0=view, 1=text hole, 2=comment, 3=image hole
      slotCount: 4,
      holes: [1, 3],
      addressed: [0, 1, 2, 3],
      tags: ['view', 'text', '#comment', 'image'],
    });
  });

  it('only-child comment consumes a slot (runtime fold is #text-only)', () => {
    const { templates } = analyze(`<view><!--only--></view>`);
    expect(templates[0]).toMatchObject({
      slotCount: 2,
      holes: [],
      addressed: [0],
      tags: ['view'],
    });
  });

  it('mixed {{x}} + element siblings: text host + image in preorder', () => {
    const { templates } = analyze(
      `<view><text>{{ t }}</text><image :src="url" /></view>`,
      { t: 'setup-ref', url: 'setup-ref' },
    );
    expect(templates[0]).toMatchObject({
      slotCount: 3,
      holes: [1, 2],
      addressed: [0, 1, 2],
      tags: ['view', 'text', 'image'],
    });
  });

  it('nested v-if: outer insert host + inner branch holes', () => {
    const { templates } = analyze(
      `<view>
        <view v-if="a">
          <text v-if="b">{{ t }}</text>
        </view>
      </view>`,
      { a: 'setup-ref', b: 'setup-ref', t: 'setup-ref' },
    );
    // templates: innermost positive, middle positive, outer shell
    expect(templates.length).toBeGreaterThanOrEqual(2);
    const outer = templates[templates.length - 1]!;
    expect(outer.holes).toContain(0);
    expect(outer.tags[0]).toBe('view');
  });
});

describe('annotateVaporAddressing', () => {
  it('stamps __vlxAddressing onto each tN factory without changing call sites', () => {
    const source =
      `<view class="card"><text>{{ title }}</text><image :src="url" /></view>`;
    const result = analyze(source, {
      title: 'setup-ref',
      url: 'setup-ref',
    });
    const code = [
      'import { template as _template, child as _child } from "vue"',
      'const t0 = _template("<view class=card><text> </text><image>", 1, 1)',
      'export function render() {',
      '  const n0 = t0()',
      '  return n0',
      '}',
    ].join('\n');

    const annotated = annotateVaporAddressing(code, result);
    expect(annotated).toContain(`t0.${VAPOR_ADDRESSING_KEY} = `);
    expect(annotated).toContain('"holes":[1,2]');
    expect(annotated).toContain('"tags":');
    expect(annotated).toContain('const t0 = _template(');
    expect(annotated).toContain('const n0 = t0()');
  });

  it('annotates multiple templates by index', () => {
    const result = analyze(
      `<view><view v-if="ok"><text>{{ t }}</text></view></view>`,
      { ok: 'setup-ref', t: 'setup-ref' },
    );
    const code = [
      'const t0 = _template("<view><text> ", 0, 1)',
      'const t1 = _template("<view>", 1, 1)',
    ].join('\n');
    const annotated = annotateVaporAddressing(code, result);
    expect(annotated).toMatch(/const t0 = _template\([\s\S]*?\)\nt0\.__vlxAddressing/);
    expect(annotated).toMatch(/const t1 = _template\([\s\S]*?\)\nt1\.__vlxAddressing/);
  });
});
