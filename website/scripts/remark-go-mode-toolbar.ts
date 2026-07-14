interface MdxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: string;
}

interface MdxNode {
  type: string;
  name?: string;
  attributes?: MdxAttribute[];
  children?: MdxNode[];
}

interface MdxRoot {
  type: 'root';
  children: MdxNode[];
}

interface VFileLike {
  path?: string;
}

export function remarkGoModeToolbar() {
  return (tree: MdxRoot, file: VFileLike) => {
    const firstGo = tree.children.findIndex(
      (node) => node.type === 'mdxJsxFlowElement' && node.name === 'Go',
    );
    if (firstGo === -1) return;

    const isChinese = file.path?.includes('/docs/zh/') ?? false;
    tree.children.splice(firstGo, 0, {
      type: 'mdxJsxFlowElement',
      name: 'GoModeToolbar',
      attributes: isChinese
        ? [{ type: 'mdxJsxAttribute', name: 'locale', value: 'zh' }]
        : [],
      children: [],
    });
  };
}
