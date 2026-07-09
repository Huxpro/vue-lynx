/**
 * Unit tests for the Vapor template HTML parser.
 *
 * Every input below is real `@vue/compiler-vapor` output (see the samples in
 * plans/0709-1-vapor-mode-support.md) — the parser only needs to handle the
 * compiler-generated dialect, not arbitrary HTML.
 */

import { describe, expect, it } from 'vitest';

import { ShadowElement } from 'vue-lynx';
import {
  decodeEntities,
  parseTemplate,
} from '../../../vue-lynx/runtime/src/vapor/html-parser.js';

function tags(el: ShadowElement | null): string[] {
  const out: string[] = [];
  let child = el?.firstChild ?? null;
  while (child) {
    out.push(child.tag);
    child = child.next;
  }
  return out;
}

describe('vapor html parser', () => {
  it('parses a simple element with text', () => {
    const frag = parseTemplate('<text>hello</text>');
    expect(frag.tag).toBe('#fragment');
    const text = frag.firstChild!;
    expect(text.tag).toBe('text');
    expect(text.firstChild!.tag).toBe('#text');
    expect(text.firstChild!._text).toBe('hello');
  });

  it('parses unclosed trailing tags (auto-close at EOF)', () => {
    const frag = parseTemplate('<view><text>positive');
    const view = frag.firstChild!;
    expect(view.tag).toBe('view');
    const text = view.firstChild!;
    expect(text.tag).toBe('text');
    expect(text.firstChild!._text).toBe('positive');
  });

  it('parses unquoted attributes', () => {
    const frag = parseTemplate('<view class=container style=height:40px;color:red>');
    const view = frag.firstChild!;
    expect(view._baseClass).toBe('container');
    expect(view._style).toEqual({ height: '40px', color: 'red' });
  });

  it('parses quoted attributes and boolean attributes', () => {
    const frag = parseTemplate('<input type="text" disabled placeholder=\'hi there\'>');
    const input = frag.firstChild!;
    expect(input._attrs?.get('type')).toBe('text');
    expect(input._attrs?.get('disabled')).toBe('');
    expect(input._attrs?.get('placeholder')).toBe('hi there');
  });

  it('parses the real compiler sample with anchors and nesting', () => {
    // t2 from a real compile of the plan's sample SFC
    const frag = parseTemplate(
      '<view class=container><text class=title> </text><!><view style=height:40px;><text>+1</view><input>',
    );
    const root = frag.firstChild!;
    expect(root.tag).toBe('view');
    expect(root._baseClass).toBe('container');
    expect(tags(root)).toEqual(['text', '#comment', 'view', 'input']);

    // <text class=title> holds a single-space text placeholder
    const title = root.firstChild!;
    expect(title._baseClass).toBe('title');
    expect(title.firstChild!._text).toBe(' ');

    // `</view>` implicitly closed the unclosed inner <text>+1
    const innerView = title.next!.next!;
    expect(innerView.tag).toBe('view');
    expect(innerView._style).toEqual({ height: '40px' });
    expect(tags(innerView)).toEqual(['text']);
    expect(innerView.firstChild!.firstChild!._text).toBe('+1');

    // <input> is void — it must be a SIBLING, not a child of <input>
    expect(root.lastChild!.tag).toBe('input');
  });

  it('treats <!> as an empty comment anchor', () => {
    const frag = parseTemplate('<view><!><text>x');
    const view = frag.firstChild!;
    expect(tags(view)).toEqual(['#comment', 'text']);
    expect(view.firstChild!._text).toBe('');
    expect(view.firstChild!.nodeType).toBe(8);
  });

  it('parses full comments', () => {
    const frag = parseTemplate('<view><!--if--></view>');
    expect(frag.firstChild!.firstChild!.tag).toBe('#comment');
    expect(frag.firstChild!.firstChild!._text).toBe('if');
  });

  it('decodes entities in text and attributes', () => {
    expect(decodeEntities('a &lt; b &gt; c &amp; d &quot;e&quot; &#39;f&#39;'))
      .toBe('a < b > c & d "e" \'f\'');
    expect(decodeEntities('&#x41;&#66;')).toBe('AB');

    const frag = parseTemplate('<text data-x="a&amp;b">1 &lt; 2</text>');
    const el = frag.firstChild!;
    expect(el._attrs?.get('data-x')).toBe('a&b');
    expect(el.firstChild!._text).toBe('1 < 2');
  });

  it('records scoped-CSS data-v attributes as cssIds', () => {
    const frag = parseTemplate('<view data-v-test123><text data-v-test123> ');
    const view = frag.firstChild!;
    expect(view._scopeIds).toHaveLength(1);
    expect(view.firstChild!._scopeIds).toHaveLength(1);
  });

  it('supports multiple root nodes', () => {
    const frag = parseTemplate('<view></view><text>b</text>');
    expect(tags(frag)).toEqual(['view', 'text']);
  });

  it('produces inert nodes only (no ops)', () => {
    const frag = parseTemplate('<view class=a><text>x</text></view>');
    expect(frag._inert).toBe(true);
    expect(frag.firstChild!._inert).toBe(true);
    expect(frag.firstChild!.firstChild!._inert).toBe(true);
  });
});
