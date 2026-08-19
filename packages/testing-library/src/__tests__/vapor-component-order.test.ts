/**
 * Vapor component insertion ordering.
 *
 * A leading component is not part of the static template clone. The Vapor
 * compiler represents its insertion point with anchor `0`, meaning "before
 * the template parent's original first child". Sparse clones must therefore
 * retain the later static sibling that resolves that placeholder.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { analyzeVaporAddressing } from '../../../vue-lynx/plugin/src/compiler/vapor-addressing.js';
import {
  applyOps,
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';
import { nodeOps } from '../../../vue-lynx/runtime/src/node-ops.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { parseTemplate } from '../../../vue-lynx/runtime/src/vapor/html-parser.js';

afterEach(() => {
  resetTemplateState();
  resetMainThreadState();
  takeOps();
  ShadowElement.nextUid = 2;
});

describe('Vapor component insertion order', () => {
  it('keeps a component root before a later static sibling', () => {
    const [meta] = analyzeVaporAddressing(
      '<view><Child /><text class=static>static</text></view>',
      {
        bindingMetadata: { Child: 'setup-const' },
        isNativeTag: (tag) => tag !== 'Child',
      },
    ).templates;
    expect(meta).toBeDefined();

    const proto = parseTemplate(meta!.content).firstChild!;
    ShadowElement.nextUid = 2;
    takeOps();
    setPendingVaporAddressing(meta);
    const parent = proto.cloneNode(true) as ShadowElement;

    const componentRoot = nodeOps.createElement('view');
    nodeOps.patchProp(componentRoot, 'class', null, 'component');
    // runtime-vapor resolves its leading-component `0` placeholder to the
    // cloned parent's original first child.
    parent.insertBefore(componentRoot, parent.firstChild);

    applyOps(takeOps());

    const parentElement = elements.get(parent.uid) as unknown as Element;
    const classes = [...parentElement.children].map((child) =>
      child.getAttribute('class')
    );
    expect(classes).toEqual(['component', 'static']);
  });
});
