import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { renderModeStore, type ExampleCensus, type RenderMode } from './render-mode-store';

interface GoModeNavIndicatorProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    label: 'Render examples with Vapor',
    description: 'Switches every supported example and code tab on this page',
    dormant:
      'No mode-aware content on this page — the preference still applies site-wide',
    coverage: (supported: number, total: number) =>
      `${supported} of ${total} examples on this page run Vapor; the rest fall back to VDOM`,
    infoLabel: 'About this switch',
    infoBody:
      'Switches the renderer for every supported live example and VDOM/Vapor code tab across this site. Prose never changes. Vapor is experimental.',
    infoLink: 'Learn about Vapor mode',
    infoHref: '/guide/vapor-mode',
  },
  zh: {
    label: '以 Vapor 渲染示例',
    description: '切换本页所有支持的示例与代码示例',
    dormant: '本页没有可切换的内容——偏好仍会应用于全站',
    coverage: (supported: number, total: number) =>
      `本页 ${supported}/${total} 个示例支持 Vapor，其余回退到 VDOM`,
    infoLabel: '关于此开关',
    infoBody:
      '切换全站所有支持的可运行示例与 VDOM/Vapor 代码块的渲染器。正文内容不区分模式。Vapor 为实验特性。',
    infoLink: '了解 Vapor mode',
    infoHref: '/zh/guide/vapor-mode',
  },
} as const;

interface GoModeNavControlProps {
  mode: RenderMode;
  census: ExampleCensus;
  locale: 'en' | 'zh';
  onSelect(mode: RenderMode): void;
}

/**
 * Presentational Vapor on/off switch: VDOM is simply "off"; the active mode
 * name lives in the track's free space. Always rendered on doc pages —
 * pages with no mode-aware content show it dormant (dimmed, still working)
 * instead of popping in and out. The ⓘ popover explains exactly what the
 * switch does and does not change.
 */
export function GoModeNavControl({ mode, census, locale, onSelect }: GoModeNavControlProps) {
  const labels = copy[locale];
  const [infoOpen, setInfoOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const close = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setInfoOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInfoOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [infoOpen]);

  const on = mode === 'vapor';
  const dormant = census.total === 0 && census.tabGroups === 0;
  const partial = on && !dormant && census.total > 0 && census.vaporSupported < census.total;
  const coverageText = labels.coverage(census.vaporSupported, census.total);

  return (
    <div
      ref={rootRef}
      className="go-mode-nav-control"
      data-mode={mode}
      data-dormant={dormant || undefined}
      title={dormant ? labels.dormant : partial ? coverageText : labels.description}
    >
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={labels.label}
        className="go-mode-nav-control__switch"
        onClick={() => onSelect(on ? 'vdom' : 'vapor')}
      >
        <span className="go-mode-nav-control__track" aria-hidden="true">
          <span className="go-mode-nav-control__mode">{on ? 'Vapor' : 'VDOM'}</span>
          <span className="go-mode-nav-control__knob" />
        </span>
      </button>
      {partial && (
        <span
          className="go-mode-nav-control__coverage"
          role="status"
          aria-label={coverageText}
        >
          {census.vaporSupported}/{census.total}
        </span>
      )}
      <button
        type="button"
        className="go-mode-nav-control__info"
        aria-label={labels.infoLabel}
        aria-expanded={infoOpen}
        onClick={() => setInfoOpen((open) => !open)}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
          <rect x="7.25" y="6.8" width="1.5" height="5" rx="0.75" fill="currentColor" />
        </svg>
      </button>
      {infoOpen && (
        <div className="go-mode-nav-control__popover" role="note">
          <p>{labels.infoBody}</p>
          <a href={labels.infoHref}>{labels.infoLink} →</a>
        </div>
      )}
    </div>
  );
}

/**
 * Store-wired control for the site nav.
 */
export function GoModeNavIndicator({ locale = 'en' }: GoModeNavIndicatorProps) {
  const mode = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getSnapshot,
    renderModeStore.getServerSnapshot,
  );
  const census = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getExampleCensus,
    renderModeStore.getServerExampleCensus,
  );

  return (
    <GoModeNavControl
      mode={mode}
      census={census}
      locale={locale}
      onSelect={(next) => renderModeStore.setMode(next)}
    />
  );
}

export default GoModeNavIndicator;
