import { Go as GoBase, GoConfigProvider, useGoConfig } from '@lynx-js/go-web';
import type { GoProps } from '@lynx-js/go-web';
import { rspressAdapter } from '@lynx-js/go-web/adapters/rspress';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { VaporStatus } from './VaporStatus';
import './vapor-status.scss';

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

type RenderMode = 'vdom' | 'vapor';
const ENTRY_QUERY = 'go-entry';
const MODE_QUERY = 'go-mode';

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
  const metadataUrl = `${withBase(exampleBasePath)}/${props.example}/example-metadata.json`;
  const [metadata, setMetadata] = useState<ExampleMetadata>();
  const [entryName, setEntryName] = useState(props.defaultEntryName ?? '');
  const [mode, setMode] = useState<RenderMode>('vdom');

  useEffect(() => {
    const controller = new AbortController();
    fetch(metadataUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${metadataUrl}: ${response.status}`);
        return response.json() as Promise<ExampleMetadata>;
      })
      .then((next) => {
        let nextEntry = initialEntry(next, props);
        let nextMode: RenderMode = 'vdom';
        if (typeof window !== 'undefined') {
          const query = new URLSearchParams(window.location.search);
          const requestedEntry = query.get(ENTRY_QUERY);
          const requestedMode = query.get(MODE_QUERY);
          const match = next.templateFiles.find(
            ({ name }) => `${props.example}/${name}` === requestedEntry,
          );
          if (match) {
            nextEntry = match.name;
            if (requestedMode === 'vapor' && match.vaporStatus === 'supported') {
              nextMode = 'vapor';
            }
          }
        }
        setMetadata(next);
        setEntryName(nextEntry);
        setMode(nextMode);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') console.error(error);
      });
    return () => controller.abort();
  }, [metadataUrl, props.defaultEntryFile, props.defaultEntryName]);

  const currentEntry = metadata?.templateFiles.find(({ name }) => name === entryName);
  useEffect(() => {
    if (mode === 'vapor' && currentEntry?.vaporStatus !== 'supported') setMode('vdom');
  }, [currentEntry?.vaporStatus, mode]);

  const handleEntryChange = useCallback((nextEntry: string) => {
    setEntryName(nextEntry);
    props.onEntryChange?.(nextEntry);
  }, [props.onEntryChange]);

  const handleModeChange = useCallback((nextMode: RenderMode) => {
    if (nextMode === mode) return;
    const url = new URL(window.location.href);
    url.searchParams.set(ENTRY_QUERY, `${props.example}/${entryName}`);
    url.searchParams.set(MODE_QUERY, nextMode);
    window.location.assign(url);
  }, [entryName, mode, props.example]);

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
        onModeChange={handleModeChange}
        status={currentEntry.vaporStatus ?? 'unsupported'}
        reason={currentEntry.vaporReason}
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
