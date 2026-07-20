/**
 * htmlToTemplateNode + structured-template rewrite.
 */

import { describe, expect, it } from 'vitest';

import { rewriteVaporTemplateCalls } from '../../../vue-lynx/plugin/src/compiler/vapor-structured-template.js';
import {
  htmlToTemplateNode,
  inferHoleSlots,
} from 'vue-lynx/internal/html-to-template-node';

describe('htmlToTemplateNode', () => {
  it('matches REGISTER_TREE shape for a card with a text hole', () => {
    const { structure, slotCount } = htmlToTemplateNode(
      '<view class=card><text> </text><text class=sub>hi',
    );
    expect(slotCount).toBe(3);
    expect(structure[0]).toBe('view');
    expect(structure[1]).toEqual({ c: 'card' });
    const kids = structure[2] as unknown[];
    // First text: folded interpolation placeholder → no props.t
    expect(kids[0]).toEqual(['text', 0, []]);
    // Second text: folded static "hi"
    expect(kids[1]).toEqual(['text', { c: 'sub', t: 'hi' }, []]);
  });

  it('infers the folded text host as a hole slot', () => {
    const { structure } = htmlToTemplateNode(
      '<view class=card><text> </text><text class=sub>hi',
    );
    expect(inferHoleSlots(structure)).toEqual([1]);
  });
});

describe('rewriteVaporTemplateCalls', () => {
  it('rewrites a compiler-vapor template() call to a TemplateNode literal', () => {
    const src =
      'const t0 = _template("<view class=card><text> </text>", 1, 1)\n';
    const { code, replacements } = rewriteVaporTemplateCalls(src);
    expect(replacements).toBe(1);
    expect(code).not.toContain('"<view class=card>');
    expect(code).toContain('_template([');
    expect(code).toContain('"view"');
    expect(code).toContain(', 1, 1)');
  });

  it('leaves plain-text template roots untouched', () => {
    const src = 'const t0 = template("hello", 2)\n';
    const { code, replacements } = rewriteVaporTemplateCalls(src);
    expect(replacements).toBe(0);
    expect(code).toBe(src);
  });
});
