import { Go as GoBase, GoConfigProvider, useGoConfig } from '@lynx-js/go-web';
import type { GoProps } from '@lynx-js/go-web';
import { rspressAdapter } from '@lynx-js/go-web/adapters/rspress';
import { useLang } from '@rspress/core/runtime';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import {
  renderModeStore,
  resolveRenderMode,
  type RenderMode,
} from './render-mode-store';
import { VaporStatus } from './VaporStatus';

const config = {
  exampleBasePath: '/examples',
  defaultTab: 'web' as const,
  ...rspressAdapter,
};

interface TemplateFile {
  name: string;
  file: string;
  webFile?: string;
  vaporFile?: string;
  vaporWebFile?: string;
  vaporStatus?: 'supported' | 'unsupported';
  vaporReason?: string;
}

interface ExampleMetadata {
  name: string;
  files: string[];
  templateFiles: TemplateFile[];
  previewImage?: string;
  exampleGitBaseUrl?: string;
}

const ENTRY_QUERY = 'go-entry';

function initialEntry(metadata: ExampleMetadata, props: GoProps): string {
  if (props.defaultEntryName) return props.defaultEntryName;
  if (props.defaultEntryFile) {
    const match = metadata.templateFiles.find(
      ({ file }) => file === props.defaultEntryFile || file.startsWith(props.defaultEntryFile!),
    );
    if (match) return match.name;
  }
  return metadata.templateFiles[0]?.name ?? '';
}

function metadataForMode(metadata: ExampleMetadata, mode: RenderMode): ExampleMetadata {
  if (mode === 'vdom') return metadata;
  return {
    ...metadata,
    templateFiles: metadata.templateFiles.map((entry) =>
      entry.vaporStatus === 'supported' && entry.vaporFile && entry.vaporWebFile
        ? { ...entry, file: entry.vaporFile, webFile: entry.vaporWebFile }
        : entry,
    ),
  };
}

function VaporAwareGo(props: GoProps) {
  const { exampleBasePath, withBase = (path: string) => path } = useGoConfig();
  const locale = useLang().startsWith('zh') ? 'zh' : 'en';
  const metadataUrl = `${withBase(exampleBasePath)}/${props.example}/example-metadata.json`;
  const [metadata, setMetadata] = useState<ExampleMetadata>();
  const [entryName, setEntryName] = useState(props.defaultEntryName ?? '');
  const requestedMode = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getSnapshot,
    renderModeStore.getServerSnapshot,
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(metadataUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${metadataUrl}: ${response.status}`);
        return response.json() as Promise<ExampleMetadata>;
      })
      .then((next) => {
        let nextEntry = initialEntry(next, props);
        if (typeof window !== 'undefined') {
          const query = new URLSearchParams(window.location.search);
          const requestedEntry = query.get(ENTRY_QUERY);
          const match = next.templateFiles.find(
            ({ name }) => `${props.example}/${name}` === requestedEntry,
          );
          if (match) nextEntry = match.name;
        }
        setMetadata(next);
        setEntryName(nextEntry);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') console.error(error);
      });
    return () => controller.abort();
  }, [metadataUrl, props.defaultEntryFile, props.defaultEntryName]);

  const currentEntry = metadata?.templateFiles.find(({ name }) => name === entryName);
  const mode = resolveRenderMode(requestedMode, currentEntry);

  const handleEntryChange = useCallback((nextEntry: string) => {
    setEntryName(nextEntry);
    props.onEntryChange?.(nextEntry);
  }, [props.onEntryChange]);

  const renderedMetadata = useMemo(
    () => metadata && metadataForMode(metadata, mode),
    [metadata, mode],
  );

  if (!metadata || !renderedMetadata || !currentEntry) {
    return <div className="vue-lynx-go" aria-busy="true" />;
  }

  return (
    <div className="vue-lynx-go">
      <VaporStatus
        entry={`${props.example}/${entryName}`}
        mode={mode}
        status={currentEntry.vaporStatus ?? 'unsupported'}
        reason={currentEntry.vaporReason}
        locale={locale}
      />
      <GoBase
        {...props}
        defaultEntryFile={undefined}
        defaultEntryName={entryName}
        exampleMetadata={renderedMetadata}
        onEntryChange={handleEntryChange}
      />
    </div>
  );
}

export function Go(props: GoProps) {
  return (
    <GoConfigProvider config={config}>
      <VaporAwareGo {...props} />
    </GoConfigProvider>
  );
}

export type { GoProps };
export default Go;
