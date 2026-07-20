/**
 * Compile-time Vapor addressing analysis (#297).
 *
 * Locks the hole set + addressed-node set (REGISTER_TREE preorder slots)
 * derived from vapor IR — the metadata #298 will consume for sparse naming.
 */

import { describe, expect, it } from 'vitest';

import {
  VAPOR_ADDRESSING_KEY,
  analyzeVaporAddressing,
  annotateVaporAddressing,
} from '../../../vue-lynx/plugin/src/compiler/vapor-addressing.js';

function analyze(
  source: string,
  bindingMetadata: Record<string, string> = {},
) {
  return analyzeVaporAddressing(source, {
    bindingMetadata,
    isNativeTag: () => true,
  });
}

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
      // slots: 0=view, 1=text hole, 2=static text, 3=image hole
      holes: [1, 3],
      // prefix sibling 2 kept so _nthChild(root, 2) reaches the image
      addressed: [0, 1, 2, 3],
    });
    expect(templates[0]!.content).toContain('class=card');
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
      // 0=root, 1=wrap ancestor, 2=text hole — static sibling 3 not needed
      addressed: [0, 1, 2],
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
    // Outer shell: parent of the v-if insert is a hole
    expect(outer).toMatchObject({
      holes: [0],
      addressed: [0],
    });
    // Positive branch: text + image holes
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
      // 0 = view (component insert host), 1 = text hole
      holes: [0, 1],
      addressed: [0, 1],
    });
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
    expect(annotated).toContain('const t0 = _template(');
    // Call site unchanged
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
