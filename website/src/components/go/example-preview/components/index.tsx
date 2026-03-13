import React, { type FC, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, useLang, withBase, NoSSR } from '@rspress/core/runtime';
import {
  Space,
  Typography,
  Switch,
  Button,
  SideSheet,
  RadioGroup,
  Radio,
  Select,
  Toast,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import { IconList, IconChevronRightStroked } from '@douyinfe/semi-icons';
import { QRCodeSVG } from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FileTree } from './file-tree';
import { CodeView } from './code-view';
import { SwitchSchema } from './switch-schema';
import { PreviewImg } from './preview-img';
import { ResizableContainer } from './resizable';
const WebIframe = React.lazy(() =>
  import('./web-iframe').then((module) => ({ default: module.WebIframe })),
);

import {
  IconGithub,
  IconCopyLink,
  IconEnterFullscreen,
  IconExitFullscreen,
} from '../utils/icon';
import { tabScrollToTop } from '../utils/tool';
import { useTreeController } from '../hooks/use-tree-controller';
import type { SchemaOptionsData } from '../hooks/use-switch-schema';

import s from './index.module.scss';

const LYNX_EXPLORER_URL =
  '/guide/quick-start#download-lynx-explorer';

const lynxExplorerText = 'Lynx Explorer';

enum PreviewType {
  Preview = 'Preview',
  QRCode = 'QRCode',
  Web = 'Web',
}

interface ExampleContentProps {
  fileNames: string[];
  previewImage: string;
  currentFileName: string;
  currentFile: string;
  updateCurrentName: (v: string) => void;
  isAssetFile: boolean;
  name: string;
  directory?: string;
  currentEntryFileUrl: string;
  currentEntry: string;
  entryFiles?: { name: string; file: string }[];
  setCurrentEntry: (v: string) => void;
  highlight?: string;
  entry?: string | string[];
  defaultWebPreviewFile?: string;
  initState: boolean;
  rightFooter?: React.ReactNode;
  schemaOptions?: SchemaOptionsData;
  exampleGitBaseUrl?: string;
  langAlias?: Record<string, string>;
}

export const ExampleContent: FC<ExampleContentProps> = ({
  fileNames,
  previewImage,
  currentFileName,
  currentFile,
  updateCurrentName,
  isAssetFile,
  name,
  directory,
  currentEntryFileUrl,
  currentEntry,
  setCurrentEntry,
  entryFiles,
  highlight,
  entry,
  defaultWebPreviewFile,
  initState,
  rightFooter,
  schemaOptions,
  exampleGitBaseUrl,
  langAlias,
}) => {
  const { treeData, doChangeExpand, selectedKeys, expandedKeys, entryData } =
    useTreeController({ fileNames, value: currentFileName, entry });
  const [showPreview, setShowPreview] = useState(true);
  const [showFileTree, setShowFileTree] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewType, setPreviewType] = useState(
    previewImage ? PreviewType.Preview : PreviewType.QRCode,
  );
  const [qrcodeUrlWithSchema, setQrcodeUrlWithSchema] = useState('');
  // Default to Web tab once web preview becomes available
  useEffect(() => {
    if (defaultWebPreviewFile) {
      setPreviewType(PreviewType.Web);
    }
  }, [defaultWebPreviewFile]);
  const { hasPreview, hasWebPreview } = useMemo(() => {
    const count =
      Number(Boolean(previewImage)) +
      Number(Boolean(currentEntry)) +
      Number(Boolean(defaultWebPreviewFile));
    return {
      hasPreview: count >= 1,
      hasWebPreview: Boolean(defaultWebPreviewFile),
    };
  }, [previewImage, currentEntry, defaultWebPreviewFile]);
  const [tmpCurrentFileName, setTmpCurrentFileName] = useState('');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const t = useI18n();
  const _lang = useLang();

  const getContainer = () => containerRef.current as HTMLDivElement;
  const onFileSelect = (v: string) => {
    setShowFileTree(false);
    updateCurrentName(v);
    if (!entryData?.find((val) => val.value === v)) {
      setTmpCurrentFileName(v);
    }
  };

  const onSwitchSchema = (schema: string) => {
    setQrcodeUrlWithSchema(schema);
  };
  const qrcodeUrl = qrcodeUrlWithSchema || currentEntryFileUrl;

  useEffect(() => {
    if (!hasPreview || !showPreview) {
      setIsPreviewFullscreen(false);
    }
  }, [hasPreview, showPreview]);

  useEffect(() => {
    if (!isPreviewFullscreen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewFullscreen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isPreviewFullscreen]);

  const showCodeTab = entryData && entryData?.length > 1;
  return (
    <div className={s.box}>
      <div className={s.container} ref={containerRef}>
        <div className={s.content}>
          <div className={s['code-wrap']}>
            <div className={s['code-tab-container']}>
              {showCodeTab && (
                <div
                  className={s['code-tab']}
                  ref={(tabsRef) => {
                    // scroll to active tab
                    tabScrollToTop(tabsRef);
                  }}
                >
                  <Tabs
                    activeKey={currentFileName}
                    onChange={(v) => updateCurrentName(v)}
                    size="small"
                    preventScroll={true}
                    onTabClose={() => {
                      updateCurrentName(entryData[entryData.length - 1].value);
                      setTmpCurrentFileName('');
                    }}
                  >
                    {entryData.map((file) => (
                      <TabPane
                        key={file.value}
                        itemKey={file.value}
                        tab={file.label}
                      />
                    ))}
                    {tmpCurrentFileName && (
                      <TabPane
                        key={tmpCurrentFileName}
                        itemKey={tmpCurrentFileName}
                        tab={tmpCurrentFileName?.split('/').pop()}
                        closable={true}
                      />
                    )}
                  </Tabs>
                </div>
              )}
              <div
                className={`${s['code-view-container']} ${showCodeTab ? s['code-view-container-tab-show'] : ''}`}
              >
                <CodeView
                  currentFileName={currentFileName}
                  currentFile={currentFile}
                  isAssetFile={isAssetFile}
                  highlight={highlight}
                  langAlias={langAlias}
                />
              </div>
            </div>
          </div>

          <ResizableContainer show={hasPreview && showPreview}>
            <div
              className={`${s['preview-wrap']} ${isPreviewFullscreen ? s.fullscreen : ''}`}
            >
              <div className={s['preview-wrap-content']}>
                <div className={s['preview-header']}>
                  <div className={s['preview-mode-group']}>
                    <RadioGroup
                      onChange={(e) => setPreviewType(e.target.value)}
                      value={previewType}
                      type="button"
                      style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      {initState ? (
                        <>
                          {previewImage && (
                            <Radio value={PreviewType.Preview}>
                              {t('go.preview')}
                            </Radio>
                          )}
                          {hasWebPreview && (
                            <Radio value={PreviewType.Web}>Web</Radio>
                          )}
                          {currentEntry && (
                            <Radio value={PreviewType.QRCode}>
                              {t('go.qrcode')}
                            </Radio>
                          )}
                        </>
                      ) : (
                        <div style={{ width: '100%', height: '32px' }}></div>
                      )}
                    </RadioGroup>
                  </div>
                  <Button
                    className={s['preview-fullscreen-button']}
                    theme="borderless"
                    type="tertiary"
                    icon={
                      isPreviewFullscreen ? (
                        <IconExitFullscreen style={{ fontSize: '16px' }} />
                      ) : (
                        <IconEnterFullscreen style={{ fontSize: '16px' }} />
                      )
                    }
                    aria-label={
                      isPreviewFullscreen
                        ? 'Exit preview fullscreen'
                        : 'Enter preview fullscreen'
                    }
                    onClick={() => setIsPreviewFullscreen((value) => !value)}
                  />
                </div>

                <div className={s['preview-stage']}>
                  {previewType === PreviewType.QRCode && currentEntry && (
                    <div className={s.qrcode}>
                      <Typography.Text
                        size="small"
                        type="tertiary"
                        style={{ margin: '28px 12px', textAlign: 'center' }}
                      >
                        {t('go.scan.message-1')}
                        <Typography.Text
                          link={{
                            href: withBase(LYNX_EXPLORER_URL),
                            target: '_blank',
                          }}
                          size="small"
                          underline
                        >
                          {lynxExplorerText}
                        </Typography.Text>{' '}
                        {t('go.scan.message-2')}
                      </Typography.Text>
                      <div className={s['qrcode-svg']}>
                        <QRCodeSVG value={qrcodeUrl} />
                      </div>
                      <div style={{ marginBottom: '32px' }}>
                        <CopyToClipboard
                          onCopy={() => {
                            Toast.success(t('go.qrcode.copied'));
                          }}
                          text={qrcodeUrl}
                        >
                          <Button
                            type="tertiary"
                            style={{ fontSize: '12px' }}
                            icon={<IconCopyLink style={{ fontSize: '16px' }} />}
                          >
                            {t('go.qrcode.copy-link')}
                          </Button>
                        </CopyToClipboard>
                      </div>
                      {schemaOptions && (
                        <SwitchSchema
                          optionsData={schemaOptions}
                          currentEntryFileUrl={currentEntryFileUrl}
                          onSwitchSchema={onSwitchSchema}
                        />
                      )}
                      <div className={s['qrcode-entry']}>
                        <Typography.Text
                          size="small"
                          type="tertiary"
                          style={{ marginRight: '12px', flexShrink: 0 }}
                        >
                          {t('go.qrcode.entry')}
                        </Typography.Text>
                        <Select
                          style={{ width: '100%', maxWidth: '200px' }}
                          value={currentEntry}
                          onChange={(v) => setCurrentEntry(v as string)}
                        >
                          {entryFiles?.map((file) => (
                            <Select.Option key={file.name} value={file.name}>
                              {file.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )}
                  {previewImage && (
                    <PreviewImg
                      show={previewType === PreviewType.Preview}
                      previewImage={previewImage}
                    />
                  )}
                  {hasWebPreview && (
                    <NoSSR>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WebIframe
                          show={previewType === PreviewType.Web}
                          src={defaultWebPreviewFile || ''}
                        />
                      </Suspense>
                    </NoSSR>
                  )}
                </div>
              </div>
            </div>
          </ResizableContainer>
        </div>
        <div className={s.footer}>
          <Space
            spacing={2}
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <Button
              theme="borderless"
              icon={<IconList style={{ color: 'var(--semi-color-text-2)' }} />}
              type="tertiary"
              size="small"
              onClick={() => setShowFileTree(true)}
            />
            <Space spacing={2} style={{ overflow: 'hidden' }}>
              <Typography.Text
                size="small"
                type="tertiary"
                ellipsis={{ showTooltip: true }}
              >
                {name}
              </Typography.Text>
              <IconChevronRightStroked
                style={{ color: 'var(--semi-color-text-2)', fontSize: '12px' }}
              />
              <Typography.Text
                size="small"
                type="tertiary"
                ellipsis={{ showTooltip: true }}
              >
                {currentFileName}
              </Typography.Text>
            </Space>
          </Space>
          <Space spacing={7}>
            {hasPreview && (
              <Space spacing={6}>
                <Typography.Text size="small" type="tertiary">
                  {t('go.preview')}
                </Typography.Text>

                <Switch
                  style={{
                    backgroundColor: showPreview
                      ? 'var(--semi-color-info)'
                      : 'var(--semi-color-fill-0)',
                    cursor: 'pointer',
                  }}
                  checked={showPreview}
                  onChange={setShowPreview}
                  size="small"
                />
              </Space>
            )}

            <Button
              theme="borderless"
              icon={
                <IconGithub style={{ color: 'var(--semi-color-text-2)' }} />
              }
              type="tertiary"
              size="small"
              onClick={() => {
                window.open(
                  `${exampleGitBaseUrl}/${directory}/${currentFileName}`,
                  '_blank',
                );
              }}
            />
            {rightFooter}
          </Space>
        </div>
        <SideSheet
          width={224}
          placement="left"
          visible={showFileTree}
          onCancel={() => setShowFileTree(false)}
          getPopupContainer={getContainer}
          closeIcon={null}
          closable={false}
          title={<Typography.Text>{t('go.files')}</Typography.Text>}
          headerStyle={{
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            fontSize: '16px',
            borderBottom: '1px solid var(--semi-color-border)',
          }}
          bodyStyle={{
            padding: '12px',
          }}
        >
          <FileTree
            onSelect={onFileSelect}
            entry={entry}
            treeData={treeData}
            doChangeExpand={doChangeExpand}
            selectedKeys={selectedKeys}
            expandedKeys={expandedKeys}
          />
        </SideSheet>
      </div>
    </div>
  );
};
