// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * CSS-tree plugin that strips Vue scoped `[data-v-xxx]` attribute selectors
 * from the serialized CSS AST.
 *
 * Vue's `<style scoped>` adds `[data-v-{hash}]` to every selector.
 * Lynx's CSS engine doesn't support attribute selectors, and scoping is
 * handled by the native `cssId` mechanism instead.  This plugin removes
 * the attribute selectors during template encoding (via `cssPlugins`
 * on LynxTemplatePlugin / CssExtractPlugin).
 *
 * Plugin format: `{ phaseStandard(ast, ctx) }` — invoked by
 * `@lynx-js/css-serializer`'s `parse()` on the css-tree AST.
 */

// css-tree linked-list node handle
interface ListItem {
  data: ASTNode;
  next: ListItem | null;
  prev: ListItem | null;
}

// css-tree linked-list
interface List {
  head: ListItem | null;
  remove(item: ListItem): void;
}

interface ASTNode {
  type: string;
  name?: { name?: string } | string;
  matcher?: unknown;
  value?: unknown;
  flags?: unknown;
  children?: List;
  prelude?: ASTNode;
  block?: ASTNode;
  [key: string]: unknown;
}

export function rewriteVueScopeAttribute(
  node: Record<string, unknown>,
): boolean {
  if (node.type !== 'AttributeSelector') return false;
  const identifier = node.name;
  const name = typeof identifier === 'object' && identifier !== null
    ? (identifier as { name?: unknown }).name
    : undefined;
  if (typeof name !== 'string' || !name.startsWith('data-v-')) return false;

  node.type = 'ClassSelector';
  node.name = name;
  delete node.matcher;
  delete node.value;
  delete node.flags;
  return true;
}

function rewriteVueScopesInAST(node: ASTNode): void {
  // Walk children (css-tree uses linked lists)
  if (node.children) {
    let item = node.children.head;
    while (item) {
      const next = item.next;
      if (!rewriteVueScopeAttribute(item.data)) {
        rewriteVueScopesInAST(item.data);
      }
      item = next;
    }
  }
  // Walk named sub-trees (Rule.prelude = SelectorList, Rule.block = Block)
  if (node.prelude) rewriteVueScopesInAST(node.prelude);
  if (node.block) rewriteVueScopesInAST(node.block);
}

export const vueScopeStripCSSPlugin = {
  name: 'vue-scope-strip',
  phaseStandard(ast: ASTNode): void {
    rewriteVueScopesInAST(ast);
  },
};
