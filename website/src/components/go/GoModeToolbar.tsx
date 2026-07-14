import { useId, useSyncExternalStore } from 'react';

import { renderModeStore } from './render-mode-store';

interface GoModeToolbarProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    title: 'Preview renderer',
    description: 'All supported examples · resets preview state',
  },
  zh: {
    title: '预览渲染器',
    description: '所有支持的示例 · 切换会重置状态',
  },
} as const;

function RendererIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m10 2 7 4-7 4-7-4 7-4Z" />
      <path d="m3 10 7 4 7-4" />
      <path d="m3 14 7 4 7-4" />
    </svg>
  );
}

export function GoModeToolbar({ locale = 'en' }: GoModeToolbarProps) {
  const mode = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getSnapshot,
    renderModeStore.getServerSnapshot,
  );
  const descriptionId = useId();
  const labels = copy[locale];

  return (
    <section className="go-mode-toolbar" aria-describedby={descriptionId}>
      <span className="go-mode-toolbar__icon">
        <RendererIcon />
      </span>
      <span className="go-mode-toolbar__copy">
        <strong>{labels.title}</strong>
        <span id={descriptionId}>{labels.description}</span>
      </span>
      <div
        className="go-mode-toolbar__modes"
        role="group"
        aria-label={labels.title}
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
    </section>
  );
}

export default GoModeToolbar;
