
import { getFileIcon, getFolderIcon } from './icon';

export function pathNormalize(name: string) {
  return name.replace(/^\//, '').replace(/^\.\//, '').replace(/\/$/, '');
}

export interface TreeNode {
  label: string;
  key: string;
  children?: TreeNode[];
  icon: JSX.Element;
  highlight?: boolean;
}
export interface EntryFile {
  label: string;
  value: string;
}

export const doGetExpandedKeysFromSelectedKeys = (
  selectedKeys: string[],
): string[] => {
  let tmp: string[] = [];
  selectedKeys.forEach((filepath) => {
    const l: string[] = [];
    filepath.split('/').forEach((i) => {
      if (l[l.length - 1]) {
        l.push(`${l[l.length - 1]}/${i}`);
      } else {
        l.push(i);
      }
    });
    tmp = tmp.concat(l);
  });
  return tmp;
};

const sortTree = (nodes: TreeNode[]) => {
  nodes.sort((a, b) => {
    const hasChildrenA = a.children && a.children.length > 0;
    const hasChildrenB = b.children && b.children.length > 0;

    if (hasChildrenA && !hasChildrenB) {
      return -1;
    }
    if (!hasChildrenA && hasChildrenB) {
      return 1;
    }
    return a.label.localeCompare(b.label);
  });

  nodes.forEach((node) => {
    if (node.children) {
      sortTree(node.children);
    }
  });
};

const isEntry = (name: string, entry?: string | string[]) => {
  if (!entry) {
    return false;
  }
  const isPath = (name: string, item: string) => {
    return Boolean(
      item === name || name.startsWith(item?.endsWith('/') ? item : item + '/'),
    );
  };
  if (typeof entry === 'string') {
    return isPath(name, entry);
  } else if (Array.isArray(entry) && entry.length > 0) {
    return Boolean(
      entry.find((item) => {
        return isPath(name, item);
      }),
    );
  }
  return false;
};

export const doTransTreeData = (
  names: string[],
  expandedKeys: string[] = [],
  entry?: string | string[],
) => {
  const root: TreeNode[] = [];
  const entryData: EntryFile[] = [];
  for (const name of names) {
    const isEntryPath = isEntry(name, entry);
    if (isEntryPath) {
      const label = name.split('/').pop() || '';
      entryData.push({ label, value: name });
    }
    const parts = pathNormalize(name).split('/');
    let node = root;
    parts.forEach((part, i) => {
      const current = parts.slice(0, i + 1).join('/');
      let match = node.find((n) => n.key === current);
      if (!match) {
        const Icon = getFileIcon(part);

        match = {
          label: part,
          key: current,
          icon: <Icon style={{ marginRight: '6px', fontSize: '18px' }} />,
          highlight: isEntryPath,
        };

        node.push(match);
      }
      if (i < parts.length - 1) {
        if (!match.children) {
          const isExpanded = expandedKeys.includes(match.key);
          const Icon = getFolderIcon(isExpanded);
          match.children = [];
          match.icon = (
            <Icon style={{ marginRight: '6px', fontSize: '18px' }} />
          );
        }
        node = match.children;
      }
    });
  }

  sortTree(root);

  return { root, entryData };
};
