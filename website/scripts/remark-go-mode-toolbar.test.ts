import assert from 'node:assert/strict';
import { test } from 'node:test';

interface MdxNode {
  type: string;
  name?: string;
  attributes?: Array<{ type: string; name: string; value: string }>;
  children?: MdxNode[];
}

interface MdxRoot {
  type: 'root';
  children: MdxNode[];
}

async function loadPlugin() {
  try {
    return (await import('./remark-go-mode-toolbar')).remarkGoModeToolbar;
  } catch {
    return undefined;
  }
}

test('inserts one page-level mode toolbar before the first Go preview', async () => {
  const remarkGoModeToolbar = await loadPlugin();
  assert.equal(typeof remarkGoModeToolbar, 'function');

  const tree: MdxRoot = {
    type: 'root',
    children: [
      { type: 'heading' },
      { type: 'mdxJsxFlowElement', name: 'Go', children: [] },
      { type: 'paragraph' },
      { type: 'mdxJsxFlowElement', name: 'Go', children: [] },
    ],
  };

  remarkGoModeToolbar!()(tree, { path: '/repo/website/docs/guide/7guis.mdx' });

  assert.deepEqual(
    tree.children.map((node) => node.name ?? node.type),
    ['heading', 'GoModeToolbar', 'Go', 'paragraph', 'Go'],
  );
});

test('marks the injected toolbar as Chinese on zh documentation pages', async () => {
  const remarkGoModeToolbar = await loadPlugin();
  assert.equal(typeof remarkGoModeToolbar, 'function');

  const tree: MdxRoot = {
    type: 'root',
    children: [{ type: 'mdxJsxFlowElement', name: 'Go', children: [] }],
  };

  remarkGoModeToolbar!()(tree, {
    path: '/repo/website/docs/zh/guide/7guis.mdx',
  });

  assert.deepEqual(tree.children[0], {
    type: 'mdxJsxFlowElement',
    name: 'GoModeToolbar',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'locale',
        value: 'zh',
      },
    ],
    children: [],
  });
});
