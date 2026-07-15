import { useSyncExternalStore } from 'react';

import { InfoPopover } from './InfoPopover';
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
    infoLabel: 'About this switch',
    coverage: (supported: number, total: number) =>
      `${supported} of ${total} examples on this page run Vapor; the rest fall back to VDOM.`,
    infoBody:
      'Switches the renderer for every supported live example and VDOM/Vapor code tab across this site. Prose never changes. Vapor is experimental.',
    infoLink: 'Learn about Vapor mode',
    infoHref: '/guide/vapor-mode',
  },
  zh: {
    label: '以 Vapor 渲染示例',
    description: '切换本页所有支持的示例与代码示例',
    dormant: '本页没有可切换的内容——偏好仍会应用于全站',
    infoLabel: '关于此开关',
    coverage: (supported: number, total: number) =>
      `本页 ${supported}/${total} 个示例支持 Vapor，其余回退到 VDOM。`,
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
 * instead of popping in and out.
 *
 * The ⓘ chip explains exactly what the switch does and does not change;
 * when Vapor is on and some examples on the page fall back, the chip also
 * carries the coverage count ("2/3 ⓘ") and its popover explains the number.
 */
export function GoModeNavControl({ mode, census, locale, onSelect }: GoModeNavControlProps) {
  const labels = copy[locale];

  const on = mode === 'vapor';
  const dormant = census.total === 0 && census.tabGroups === 0;
  const partial = on && !dormant && census.total > 0 && census.vaporSupported < census.total;
  const coverageText = labels.coverage(census.vaporSupported, census.total);

  return (
    <div
      className="go-mode-nav-control"
      data-mode={mode}
      data-dormant={dormant || undefined}
      title={dormant ? labels.dormant : labels.description}
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
      <InfoPopover
        label={partial ? `${coverageText} ${labels.infoLabel}` : labels.infoLabel}
        direction="down"
        className={partial ? 'go-mode-nav-control__coverage' : undefined}
        trigger={partial
          ? (
            <span className="info-popover__count">
              {census.vaporSupported}/{census.total}
            </span>
          )
          : undefined}
      >
        {partial && <p>{coverageText}</p>}
        <p>{labels.infoBody}</p>
        <a href={labels.infoHref}>{labels.infoLink} →</a>
      </InfoPopover>
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
