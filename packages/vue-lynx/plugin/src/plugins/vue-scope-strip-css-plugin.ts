// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * CSS-tree plugin that adapts Vue scoped `[data-v-xxx]` attribute selectors
 * for Lynx's hybrid scoped-CSS model.
 *
 * Vue's `<style scoped>` adds `[data-v-{hash}]` to every selector.
 * Lynx's CSS engine doesn't support attribute selectors, and scoping is
 * handled by the native `cssId` mechanism for ordinary scoped rules. Deep
 * and slotted selectors cannot be expressed by one cssId per element, so
 * those rules are moved to common CSS and their scope attributes become
 * matching classes supplied by the runtime.
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
  name?: string | { name?: string };
  children?: List;
  prelude?: ASTNode;
  block?: ASTNode;
  [key: string]: unknown;
}

function nodeName(node: ASTNode): string | undefined {
  return typeof node.name === 'string' ? node.name : node.name?.name;
}

function scopeIdToClass(scopeId: string): string {
  return scopeId.slice('data-'.length);
}

function isVueScopeSelector(node: ASTNode): boolean {
  return node.type === 'AttributeSelector'
    && nodeName(node)?.startsWith('data-v-') === true;
}

function ruleNeedsCommonCSS(node: ASTNode): boolean {
  if (node.type === 'Selector' && node.children) {
    let item = node.children.head;
    let lastOrdinaryScope: ListItem | null = null;
    while (item) {
      if (isVueScopeSelector(item.data)) {
        const scopeId = nodeName(item.data)!;
        if (scopeId.endsWith('-s')) return true;
        lastOrdinaryScope = item;
      }
      item = item.next;
    }

    // Ordinary descendant selectors have another scope marker on their final
    // compound (`.parent[data-v-x] .child[data-v-x]`). A Vue-compiled deep
    // selector ends with an unscoped compound instead, so only a combinator
    // after the LAST scope marker requires the common-CSS fallback.
    let rest = lastOrdinaryScope?.next ?? null;
    while (rest) {
      if (rest.data.type === 'Combinator') return true;
      rest = rest.next;
    }
  }

  if (node.children) {
    let item = node.children.head;
    while (item) {
      if (ruleNeedsCommonCSS(item.data)) return true;
      item = item.next;
    }
  }
  if (node.prelude && ruleNeedsCommonCSS(node.prelude)) return true;
  return node.block ? ruleNeedsCommonCSS(node.block) : false;
}

function adaptVueScopeSelectors(node: ASTNode, useClasses: boolean): void {
  // Walk children (css-tree uses linked lists)
  if (node.children) {
    let item = node.children.head;
    while (item) {
      const next = item.next;
      if (isVueScopeSelector(item.data)) {
        if (useClasses) {
          item.data = {
            type: 'ClassSelector',
            name: scopeIdToClass(nodeName(item.data)!),
          };
        } else {
          node.children.remove(item);
        }
      } else {
        adaptVueScopeSelectors(item.data, useClasses);
      }
      item = next;
    }
  }
  // Walk named sub-trees (Rule.prelude = SelectorList, Rule.block = Block)
  if (node.prelude) adaptVueScopeSelectors(node.prelude, useClasses);
  if (node.block) adaptVueScopeSelectors(node.block, useClasses);
}

function adaptStyleSheet(ast: ASTNode): void {
  if (ast.type === 'Rule') {
    adaptVueScopeSelectors(ast, ruleNeedsCommonCSS(ast));
    return;
  }

  if (ast.children) {
    let item = ast.children.head;
    while (item) {
      adaptStyleSheet(item.data);
      item = item.next;
    }
  }
  if (ast.prelude) adaptStyleSheet(ast.prelude);
  if (ast.block) adaptStyleSheet(ast.block);
}

export const vueScopeStripCSSPlugin = {
  name: 'vue-scope-strip',
  phaseStandard(ast: ASTNode): void {
    adaptStyleSheet(ast);
  },
};
