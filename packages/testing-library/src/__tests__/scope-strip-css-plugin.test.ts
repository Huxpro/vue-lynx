import { describe, expect, it } from 'vitest';

import { vueScopeStripCSSPlugin } from '../../../vue-lynx/plugin/src/plugins/vue-scope-strip-css-plugin.js';
import { routeVueScopedCSS } from '../../../vue-lynx/plugin/src/plugins/vue-scoped-cssid-plugin.js';

interface TestNode {
  type: string;
  name?: string | { name?: string };
  children?: TestList;
  prelude?: TestNode;
  block?: TestNode;
}

interface TestItem {
  data: TestNode;
  next: TestItem | null;
  prev: TestItem | null;
}

class TestList {
  head: TestItem | null = null;
  tail: TestItem | null = null;

  constructor(nodes: TestNode[] = []) {
    for (const node of nodes) this.appendData(node);
  }

  appendData(data: TestNode): void {
    const item: TestItem = { data, next: null, prev: this.tail };
    if (this.tail) this.tail.next = item;
    else this.head = item;
    this.tail = item;
  }

  remove(item: TestItem): void {
    if (item.prev) item.prev.next = item.next;
    else this.head = item.next;
    if (item.next) item.next.prev = item.prev;
    else this.tail = item.prev;
    item.next = null;
    item.prev = null;
  }

  toArray(): TestNode[] {
    const nodes: TestNode[] = [];
    let item = this.head;
    while (item) {
      nodes.push(item.data);
      item = item.next;
    }
    return nodes;
  }
}

const classSelector = (name: string): TestNode => ({
  type: 'ClassSelector',
  name,
});

const scopeSelector = (name: string): TestNode => ({
  type: 'AttributeSelector',
  name: { name },
});

const combinator = (): TestNode => ({ type: 'Combinator', name: ' ' });

function rule(...selectorNodes: TestNode[]): TestNode {
  return {
    type: 'Rule',
    prelude: {
      type: 'SelectorList',
      children: new TestList([
        { type: 'Selector', children: new TestList(selectorNodes) },
      ]),
    },
    block: { type: 'Block', children: new TestList() },
  };
}

function selectorKinds(ruleNode: TestNode): string[] {
  const selector = ruleNode.prelude?.children?.head?.data;
  return selector?.children?.toArray().map((node) => {
    const name = typeof node.name === 'string' ? node.name : node.name?.name;
    return `${node.type}:${name ?? ''}`;
  }) ?? [];
}

describe('vueScopeStripCSSPlugin', () => {
  it('routes only deep and slotted rules out of the cssId block', () => {
    const extracted = `@cssId "123" "Component.vue" {
      .box[data-v-hash] { color: blue; }
      .outer[data-v-hash] .inner[data-v-hash] { color: purple; }
      .parent[data-v-hash] .child { color: red; }
      .item[data-v-hash-s] { color: green; }
    }`;

    const routed = routeVueScopedCSS(extracted);

    expect(routed).toContain(
      '@cssId "123" "Component.vue" {\n      .box[data-v-hash] { color: blue; }',
    );
    expect(routed).toContain(
      '.outer[data-v-hash] .inner[data-v-hash] { color: purple; }',
    );
    expect(routed).not.toContain(
      '@cssId "123" "Component.vue" {\n      .parent[data-v-hash] .child',
    );
    expect(routed).toContain(
      '.parent[data-v-hash] .child { color: red; }',
    );
    expect(routed).toContain(
      '.item[data-v-hash-s] { color: green; }',
    );
  });

  it('moves deep and slotted rules to common CSS as scope-class selectors', () => {
    const ordinary = rule(classSelector('box'), scopeSelector('data-v-hash'));
    const ordinaryDescendant = rule(
      classSelector('outer'),
      scopeSelector('data-v-hash'),
      combinator(),
      classSelector('inner'),
      scopeSelector('data-v-hash'),
    );
    const deep = rule(
      classSelector('parent'),
      scopeSelector('data-v-hash'),
      combinator(),
      classSelector('child'),
    );
    const slotted = rule(
      classSelector('item'),
      scopeSelector('data-v-hash-s'),
    );
    const cssIdBlock: TestNode = {
      type: 'Block',
      children: new TestList([ordinary, ordinaryDescendant, deep, slotted]),
    };
    const ast: TestNode = {
      type: 'StyleSheet',
      children: cssIdBlock.children,
    };

    vueScopeStripCSSPlugin.phaseStandard(ast as never);

    expect(cssIdBlock.children?.toArray()).toEqual([
      ordinary,
      ordinaryDescendant,
      deep,
      slotted,
    ]);
    expect(selectorKinds(ordinary)).toEqual(['ClassSelector:box']);
    expect(selectorKinds(ordinaryDescendant)).toEqual([
      'ClassSelector:outer',
      'Combinator: ',
      'ClassSelector:inner',
    ]);
    expect(selectorKinds(deep)).toEqual([
      'ClassSelector:parent',
      'ClassSelector:v-hash',
      'Combinator: ',
      'ClassSelector:child',
    ]);
    expect(selectorKinds(slotted)).toEqual([
      'ClassSelector:item',
      'ClassSelector:v-hash-s',
    ]);
  });
});
