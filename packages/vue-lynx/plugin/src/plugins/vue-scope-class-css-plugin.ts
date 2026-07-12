// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * CSS-tree plugin that rewrites Vue scoped `[data-v-xxx]` attribute selectors
 * as `.data-v-xxx` class selectors in the serialized Lynx CSS AST.
 *
 * Vue component roots can carry multiple scope tokens (their own scope plus
 * parent/slot scopes), while native Lynx stores only one numeric CSS ID per
 * element. Hash classes preserve Vue's composable selector semantics without
 * relying on that single-valued native slot.
 *
 * Plugin format: `{ phaseStandard(ast, ctx) }` — invoked by
 * `@lynx-js/css-serializer`'s `parse()` on the css-tree AST.
 */

interface ListItem {
  data: ASTNode;
  next: ListItem | null;
}

interface List {
  head: ListItem | null;
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
  if (node.prelude) rewriteVueScopesInAST(node.prelude);
  if (node.block) rewriteVueScopesInAST(node.block);
}

export const vueScopeClassCSSPlugin = {
  name: 'vue-scope-class',
  phaseStandard(ast: ASTNode): void {
    rewriteVueScopesInAST(ast);
  },
};
