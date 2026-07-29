import { useState } from 'react';

import { InfoPopover } from './InfoPopover';

/** Short production path that redirects to the `vapor` branch preview build. */
export const VAPOR_SITE_HREF = '/vapor';

interface VaporModeNavLinkProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    label: 'Open the Vapor preview site',
    description: 'Vapor mode lives on a separate preview build',
    infoLabel: 'About Vapor mode',
    infoBody:
      'Vapor mode is under active exploration on the vapor branch. Its docs and live examples ship as a separate preview build — this site always renders with the VDOM runtime.',
    infoLink: 'Open the Vapor preview',
  },
  zh: {
    label: '打开 Vapor 预览站点',
    description: 'Vapor mode 位于独立的预览构建中',
    infoLabel: '关于 Vapor mode',
    infoBody:
      'Vapor mode 正在 vapor 分支上探索中，其文档与可运行示例发布在独立的预览构建里 —— 本站始终使用 VDOM 运行时渲染。',
    infoLink: '打开 Vapor 预览站点',
  },
} as const;

/**
 * The `vapor` branch site's nav switch, markup and styles taken as-is. The
 * only change is what it does: there is nothing to toggle here, so the switch
 * is a link to the Vapor build. Pointer hover / keyboard focus previews the
 * flip; activating it opens the preview site in a new tab.
 */
export function VaporModeNavLink({ locale = 'en' }: VaporModeNavLinkProps) {
  const labels = copy[locale];
  // Preview the flip on mouse/keyboard only — a tap on touch would leave the
  // switch stuck in the Vapor state with nothing to flip it back.
  const [on, setOn] = useState(false);

  return (
    <div
      className="go-mode-nav-control"
      data-mode={on ? 'vapor' : 'vdom'}
      title={labels.description}
    >
      <a
        className="go-mode-nav-control__switch"
        href={VAPOR_SITE_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.label}
        onMouseEnter={() => setOn(true)}
        onMouseLeave={() => setOn(false)}
        onFocus={() => setOn(true)}
        onBlur={() => setOn(false)}
      >
        <span className="go-mode-nav-control__track" aria-hidden="true">
          <span className="go-mode-nav-control__mode">
            {on ? 'Vapor' : 'VDOM'}
          </span>
          <span className="go-mode-nav-control__knob" />
        </span>
      </a>
      <InfoPopover label={labels.infoLabel} direction="down">
        <p>{labels.infoBody}</p>
        <a href={VAPOR_SITE_HREF} target="_blank" rel="noopener noreferrer">
          {labels.infoLink} →
        </a>
      </InfoPopover>
    </div>
  );
}

export default VaporModeNavLink;
