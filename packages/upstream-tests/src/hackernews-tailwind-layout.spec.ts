// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { readFileSync } from 'node:fs';

import { baseParse, NodeTypes, type RootNode } from '@vue/compiler-dom';
import { describe, expect, it } from 'vitest';

interface ElementLike {
  type: NodeTypes.ELEMENT;
  tag: string;
  props: Array<{
    type: NodeTypes;
    name?: string;
    value?: { content: string };
  }>;
  children: Array<ElementLike | { type: NodeTypes }>;
}

function findElement(root: RootNode | ElementLike, tag: string): ElementLike | undefined {
  for (const child of root.children) {
    if (child.type !== NodeTypes.ELEMENT) continue;
    const element = child as ElementLike;
    if (element.tag === tag) return element;
    const nested = findElement(element, tag);
    if (nested) return nested;
  }
  return undefined;
}

describe('Tailwind HackerNews appbar', () => {
  it('uses one explicit horizontal content view inside the scroll view', () => {
    const source = readFileSync(
      new URL('../../../examples/hackernews-tailwind/src/App.vue', import.meta.url),
      'utf8',
    );
    const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1];
    expect(template).toBeDefined();

    const ast = baseParse(template!);
    const scrollView = findElement(ast, 'scroll-view');
    expect(scrollView).toBeDefined();

    const directElements = scrollView!.children.filter(
      (child): child is ElementLike => child.type === NodeTypes.ELEMENT,
    );
    expect(directElements).toHaveLength(1);
    expect(directElements[0].tag).toBe('view');

    const classAttr = directElements[0].props.find(
      (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'class',
    );
    expect(classAttr?.value?.content.split(/\s+/)).toContain('flex-row');

    const unsupportedContentStyle = scrollView!.props.find(
      (prop) => prop.name === 'content-container-style',
    );
    expect(unsupportedContentStyle).toBeUndefined();
  });
});
