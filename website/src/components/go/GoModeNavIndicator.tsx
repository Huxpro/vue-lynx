import { useSyncExternalStore } from 'react';

import { renderModeStore } from './render-mode-store';

interface GoModeNavIndicatorProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    context: 'Examples',
    description: 'Requested renderer for supported examples',
  },
  zh: {
    context: '示例',
    description: '支持的示例所使用的渲染器偏好',
  },
} as const;

export function GoModeNavIndicator({ locale = 'en' }: GoModeNavIndicatorProps) {
  const mode = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getSnapshot,
    renderModeStore.getServerSnapshot,
  );
  const labels = copy[locale];
  const modeLabel = mode === 'vapor' ? 'Vapor' : 'VDOM';

  return (
    <span
      className="go-mode-nav-indicator"
      data-mode={mode}
      aria-label={`${labels.description}: ${modeLabel}`}
      aria-live="polite"
    >
      <span className="go-mode-nav-indicator__dot" aria-hidden="true" />
      <span className="go-mode-nav-indicator__context">{labels.context}</span>
      <span className="go-mode-nav-indicator__separator" aria-hidden="true">·</span>
      <strong>{modeLabel}</strong>
    </span>
  );
}

export default GoModeNavIndicator;
