import { useState } from 'react';
import { Typography } from '@douyinfe/semi-ui';

import { Code } from './code';
import { getFileCodeLanguage, isImgType } from '../utils/example-data';
import s from './index.module.scss';

interface CodeViewProps {
  currentFileName: string;
  currentFile: string;
  isAssetFile: boolean;
  highlight?: string;
  langAlias?: Record<string, string>;
}

export const CodeView = ({
  currentFileName,
  currentFile,
  isAssetFile,
  highlight,
  langAlias,
}: CodeViewProps) => {
  const [isFirstShowCode, setIsFirstShowCode] = useState(true);
  if (isAssetFile) {
    if (isImgType(currentFileName)) {
      return (
        <div className={s['code-view-comp']}>
          <img src={currentFile} alt="" />
        </div>
      );
    }
    return (
      <div className={s['code-view-comp']}>
        <Typography.Text type="secondary">{currentFileName}</Typography.Text>
      </div>
    );
  }
  const language = getFileCodeLanguage(currentFileName, langAlias);

  return (
    <Code
      highlight={highlight}
      val={currentFile}
      language={language}
      isFirstShowCode={isFirstShowCode}
      setIsFirstShowCode={setIsFirstShowCode}
    />
  );
};
