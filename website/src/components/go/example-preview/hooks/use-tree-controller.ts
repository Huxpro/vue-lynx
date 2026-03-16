import { useEffect, useState } from 'react';

import {
  doGetExpandedKeysFromSelectedKeys,
  doTransTreeData,
  type EntryFile,
  pathNormalize,
  type TreeNode,
} from '../utils/transform';

export interface ITreeProps {
  fileNames: string[];
  value: string;
  entry?: string | string[];
}

const useTreeController = ({ fileNames, value, entry }: ITreeProps) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [entryData, setEntryData] = useState<EntryFile[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const [selectedKeys, setSelectKeys] = useState<string[]>([
    pathNormalize(value),
  ]);

  useEffect(() => {
    const { root, entryData } = doTransTreeData(fileNames, [], entry);
    setTreeData(root);
    setEntryData(entryData);

    const expandKeys = expandedKeys?.concat(
      doGetExpandedKeysFromSelectedKeys(selectedKeys),
    );

    setExpandedKeys(expandKeys);
  }, [fileNames]);

  useEffect(() => {
    const updateTmp = [pathNormalize(value)];

    const expandKeys = expandedKeys?.concat(
      doGetExpandedKeysFromSelectedKeys(updateTmp),
    );

    setSelectKeys(updateTmp);

    setExpandedKeys(expandKeys);
  }, [value]);

  return {
    expandedKeys,
    selectedKeys,
    treeData,
    entryData,
    doChangeExpand: setExpandedKeys,
  };
};

export { useTreeController };
