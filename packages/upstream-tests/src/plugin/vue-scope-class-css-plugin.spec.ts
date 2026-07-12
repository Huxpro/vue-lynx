import { describe, expect, it } from 'vitest';

import { rewriteVueScopeAttribute } from '../../../vue-lynx/plugin/src/plugins/vue-scope-class-css-plugin.js';

function attribute(name: string): Record<string, unknown> {
  return {
    type: 'AttributeSelector',
    name: { type: 'Identifier', name },
    matcher: null,
    value: null,
    flags: null,
  };
}

describe('Vue scope CSS class conversion', () => {
  it('rewrites Vue scope attributes as class selectors', () => {
    const node = attribute('data-v-a1b2c3d4');

    expect(rewriteVueScopeAttribute(node)).toBe(true);
    expect(node).toEqual({
      type: 'ClassSelector',
      name: 'data-v-a1b2c3d4',
    });
  });

  it('leaves user-authored attribute selectors unchanged', () => {
    const node = attribute('aria-label');
    const original = structuredClone(node);

    expect(rewriteVueScopeAttribute(node)).toBe(false);
    expect(node).toEqual(original);
  });
});
