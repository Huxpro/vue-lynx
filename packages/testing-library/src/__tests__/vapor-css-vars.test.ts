import { beforeEach, describe, expect, it } from 'vitest';

import { ShadowElement } from '../../../vue-lynx/runtime/src/shadow-element.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import { applyVaporCssVarsToBlock } from '../../../vue-lynx/runtime/src/vapor/css-vars.js';

describe('Vapor CSS variables', () => {
  beforeEach(() => {
    takeOps();
  });

  it('applies compiler-generated CSS variables to each root block', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');

    applyVaporCssVarsToBlock([first, second], { color: 'purple' });

    expect(first._style.color).toBeUndefined();
    expect(first._style['--color']).toBe('purple');
    expect(second._style['--color']).toBe('purple');
    expect(takeOps()).not.toHaveLength(0);
  });
});
