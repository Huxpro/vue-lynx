import { useLang } from '@rspress/core/runtime';
import type { ExamplePreviewProps } from './index';
import fs from 'node:fs';
import path from 'node:path';
import { getFileCodeLanguage } from './utils/example-data';
import { useMemo } from 'react';

const EXAMPLE_PATH = path?.join?.(__dirname, '../../docs/public/examples');

const TEXT = {
  zh: '下面是一个示例: ',
  en: 'This is an example below: ',
} as Record<string, string>;

interface ExampleMetadata {
  name: string;
  files: string[];
  templateFiles: Array<{
    name: string;
    file: string;
  }>;
  previewImage?: string;
  exampleGitBaseUrl?: string;
}

export const ExamplePreview = ({
  example,
  defaultFile = 'package.json',
  defaultEntryFile,
  defaultEntryName,
  highlight,
  entry,
  langAlias,
}: ExamplePreviewProps) => {
  const lang = useLang();
  const codeLanguage = getFileCodeLanguage(defaultFile, langAlias);

  const exampleMetadata = useMemo<ExampleMetadata | null>(() => {
    const metadataPath = path.join(
      EXAMPLE_PATH,
      example,
      'example-metadata.json',
    );
    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content) as ExampleMetadata;
  }, [example]);

  const codeContent = useMemo(() => {
    return fs.readFileSync(
      path.join(EXAMPLE_PATH, example, defaultFile),
      'utf-8',
    );
  }, [example, defaultFile]);

  const highlightMeta = useMemo(() => {
    if (typeof highlight === 'string') {
      return highlight;
    }
    if (highlight && typeof highlight === 'object') {
      return highlight[defaultFile] || '';
    }
    return '';
  }, [highlight, defaultFile]);

  const entryFileInfo = useMemo(() => {
    if (!exampleMetadata?.templateFiles) {
      return null;
    }

    let targetEntry;
    if (defaultEntryFile) {
      targetEntry =
        exampleMetadata.templateFiles.find(
          (file) => file.file === defaultEntryFile,
        ) ||
        exampleMetadata.templateFiles.find((file) =>
          file.file.startsWith(defaultEntryFile),
        );
    } else if (defaultEntryName) {
      targetEntry = exampleMetadata.templateFiles.find(
        (file) => file.name === defaultEntryName,
      );
    } else {
      targetEntry = exampleMetadata.templateFiles[0];
    }

    return targetEntry || null;
  }, [exampleMetadata, defaultEntryFile, defaultEntryName]);

  const markdownContent = useMemo(() => {
    const parts: string[] = [];

    // Title
    parts.push(`**${TEXT[lang]} ${example}**\n\n`);

    // Entry info
    if (entry) {
      const entryText = Array.isArray(entry) ? entry.join(', ') : entry;
      parts.push(`**Entry:** \`${entryText}\`\n`);
    }

    if (entryFileInfo) {
      parts.push(`**Bundle:** \`${entryFileInfo.file}\``);
      parts.push('\n\n');
    }

    // Code snippet
    if (codeContent) {
      const codeBlock = highlightMeta
        ? `\`\`\`${codeLanguage} ${highlightMeta}\n${codeContent}\n\`\`\``
        : `\`\`\`${codeLanguage}\n${codeContent}\n\`\`\``;
      parts.push(codeBlock);
      parts.push('\n');
    }
    return parts.join('');
  }, [
    lang,
    example,
    entry,
    entryFileInfo,
    codeContent,
    codeLanguage,
    highlightMeta,
    exampleMetadata,
  ]);

  return <p>{markdownContent}</p>;
};
