import { type FC, useEffect } from 'react';

import type { RenderFullLabelProps } from '@douyinfe/semi-ui/lib/es/tree';
import { Tree, Typography } from '@douyinfe/semi-ui';

import { getFolderIcon } from '../utils/icon';
import type { TreeNode } from '../utils/transform';

interface FileTreeProps {
  onSelect?: (value: string) => void;
  entry?: string | string[];
  treeData: TreeNode[];
  doChangeExpand: (keys: string[]) => void;
  selectedKeys: string[];
  expandedKeys: string[];
}

export const FileTree: FC<FileTreeProps> = ({
  onSelect,
  entry,
  treeData,
  doChangeExpand,
  selectedKeys,
  expandedKeys,
}) => {
  const doRenderLabel = ({
    className,
    data,
    onClick,
    onExpand,
    expandIcon,
  }: RenderFullLabelProps) => {
    const { label, icon, key, children, highlight } = data;
    const isLeaf = children?.length === 0;
    const ExpandIcon = getFolderIcon(!0);

    const renderIcon =
      !isLeaf && expandedKeys.includes(key ?? '') ? (
        <ExpandIcon style={{ marginRight: '6px', fontSize: '18px' }} />
      ) : (
        icon
      );
    const highStyle = entry
      ? {
          opacity: highlight ? 1 : 0.3,
        }
      : {};

    return (
      <li
        className={className}
        style={{
          height: '32px',
          borderRadius: '8px',
          ...highStyle,
        }}
        id={selectedKeys[0] === key ? key : undefined}
        role="treeitem"
        onClick={isLeaf ? onClick : onExpand}
      >
        {isLeaf ? (
          <span style={{ width: '24px', flexShrink: 0 }} />
        ) : (
          expandIcon
        )}
        <span style={{ flexShrink: 0 }}>{renderIcon}</span>
        <Typography.Text ellipsis={{ showTooltip: true }}>
          {label}
        </Typography.Text>
      </li>
    );
  };
  useEffect(() => {
    requestAnimationFrame(() => {
      const selectedNode = document.getElementById(selectedKeys[0]);
      if (selectedNode) {
        selectedNode.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    });
  }, []);

  return (
    <Tree
      defaultExpandAll
      defaultValue={selectedKeys}
      defaultExpandedKeys={selectedKeys}
      expandedKeys={expandedKeys}
      onExpand={doChangeExpand}
      renderFullLabel={doRenderLabel}
      onSelect={(selectedKey, selected, selectedNode) => {
        if (
          selected &&
          !selectedKeys.includes(selectedKey) &&selectedNode?.children?.length === 0
        ) {
          onSelect?.(selectedKey);
        }
      }}
      treeData={treeData}
    />
  );
};
