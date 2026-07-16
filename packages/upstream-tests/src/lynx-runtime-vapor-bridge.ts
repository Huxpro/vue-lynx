export * from 'vue-lynx/vapor';
export { default as _Fragment } from '@vue/runtime-dom';

interface FragmentLike { nodes?: unknown[]; anchor?: Node | null; }
type Block = Node | FragmentLike | Array<Block>;

export function normalizeBlock(block: Block | Block[]): Node[] {
  const out: Node[] = [];
  const walk = (item: Block): void => {
    if (Array.isArray(item)) {
      for (const child of item) walk(child);
    } else if (item && typeof item === 'object' && 'anchor' in item) {
      const frag = item as FragmentLike;
      if (Array.isArray(frag.nodes)) for (const node of frag.nodes) walk(node as Block);
      else if (frag.nodes) walk(frag.nodes as Block);
      else if ((item as { el?: Node }).el) out.push((item as { el: Node }).el);
      if (frag.anchor) out.push(frag.anchor);
    } else {
      out.push(item as Node);
    }
  };
  walk(block as Block);
  return out;
}

export function insertNode(node: Node, parent: Node, anchor?: Node | null): void {
  parent.insertBefore(node, anchor ?? null);
}

export function removeNode(node: Node, parent?: Node): void {
  (parent ?? node.parentNode)?.removeChild(node);
}

export function insertFragment(fragment: FragmentLike, parent: Node, anchor?: Node | null): void {
  insert(normalizeBlock(fragment as Block), parent, anchor);
}

export function removeFragment(fragment: FragmentLike, parent?: Node): void {
  remove(normalizeBlock(fragment as Block), parent);
}

export function insert(block: Block | Block[], parent: Node, anchor?: Node | null): void {
  for (const node of normalizeBlock(block)) insertNode(node, parent, anchor ?? null);
}

export function prepend(block: Block | Block[], parent: Node): void {
  insert(block, parent, parent.firstChild);
}

export function remove(block: Block | Block[], parent?: Node): void {
  for (const node of normalizeBlock(block)) removeNode(node, parent);
}
