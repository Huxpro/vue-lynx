import { describe, expect, it, beforeEach } from 'vitest';

import {
  nodeOps,
  patchProp,
  resetOps,
} from './lynx-runtime-test.js';

describe('lynx-runtime-test id registry', () => {
  beforeEach(() => {
    resetOps();
  });

  it('cleans descendant ids when removing a subtree', () => {
    const root = nodeOps.createElement('view');
    const outer = nodeOps.createElement('view');
    const inner = nodeOps.createElement('view');

    nodeOps.insert(outer, root);
    nodeOps.insert(inner, outer);
    patchProp(inner, 'id', null, 'target');

    expect(nodeOps.querySelector('#target')).toBe(inner);

    nodeOps.remove(outer);

    expect(nodeOps.querySelector('#target')).toBeNull();
  });

  it('cleans descendant ids when replacing children with text', () => {
    const root = nodeOps.createElement('view');
    const inner = nodeOps.createElement('view');

    nodeOps.insert(inner, root);
    patchProp(inner, 'id', null, 'target');

    expect(nodeOps.querySelector('#target')).toBe(inner);

    nodeOps.setElementText(root, 'replacement');

    expect(nodeOps.querySelector('#target')).toBeNull();
  });
});
