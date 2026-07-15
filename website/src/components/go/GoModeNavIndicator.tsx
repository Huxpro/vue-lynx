import { useSyncExternalStore } from 'react';

import { renderModeStore, type ExampleCensus, type RenderMode } from './render-mode-store';

interface GoModeNavIndicatorProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    label: 'Render examples with Vapor',
    description: 'Switches every supported example on this page',
    coverage: (supported: number, total: number) =>
      `${supported} of ${total} examples on this page run Vapor; the rest fall back to VDOM`,
  },
  zh: {
    label: '以 Vapor 渲染示例',
    description: '切换本页所有支持的示例',
    coverage: (supported: number, total: number) =>
      `本页 ${supported}/${total} 个示例支持 Vapor，其余回退到 VDOM`,
  },
} as const;

interface GoModeNavControlProps {
  mode: RenderMode;
  census: ExampleCensus;
  locale: 'en' | 'zh';
  onSelect(mode: RenderMode): void;
}

/**
 * Presentational Vapor on/off switch: VDOM is simply "off", so the control
 * is a single labeled switch instead of a two-segment pill. When on, the
 * track fills with the homepage's moving brand gradient and the label
 * picks up the hero's gradient text. Renders nothing when the page has no
 * examples; shows a coverage chip ("2/3") when Vapor is on but some
 * examples on the page fall back.
 */
export function GoModeNavControl({ mode, census, locale, onSelect }: GoModeNavControlProps) {
  const labels = copy[locale];

  if (census.total === 0) return null;

  const on = mode === 'vapor';
  const partial = on && census.vaporSupported < census.total;
  const coverageText = labels.coverage(census.vaporSupported, census.total);

  return (
    <div
      className="go-mode-nav-control"
      data-mode={mode}
      title={partial ? coverageText : labels.description}
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
    </div>
  );
}

/**
 * Store-wired control for the site nav. Appears only while at least one
 * <Go> example on the current page is registered with the store, so
 * API/reference pages never show a dead toggle.
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
