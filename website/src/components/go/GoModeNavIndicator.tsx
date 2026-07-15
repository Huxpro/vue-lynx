import { useSyncExternalStore } from 'react';

import { renderModeStore } from './render-mode-store';

interface GoModeNavIndicatorProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    context: 'Examples',
    label: 'Example renderer',
    description: 'Switches all supported examples and resets preview state',
  },
  zh: {
    context: '示例',
    label: '示例渲染器',
    description: '切换所有支持的示例，并重置预览状态',
  },
} as const;

export function GoModeNavIndicator({ locale = 'en' }: GoModeNavIndicatorProps) {
  const mode = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getSnapshot,
    renderModeStore.getServerSnapshot,
  );
  const labels = copy[locale];

  return (
    <div
      className="go-mode-nav-control"
      data-mode={mode}
      title={labels.description}
    >
      <span className="go-mode-nav-control__context">{labels.context}</span>
      <div
        className="go-mode-nav-control__modes"
        role="group"
        aria-label={labels.label}
      >
        {(['vdom', 'vapor'] as const).map((candidate) => (
          <button
            type="button"
            key={candidate}
            aria-pressed={mode === candidate}
            onClick={() => renderModeStore.setMode(candidate)}
          >
            {candidate === 'vdom' ? 'VDOM' : 'Vapor'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GoModeNavIndicator;
