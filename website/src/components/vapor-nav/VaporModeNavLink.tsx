import { useCallback, useEffect, useRef, useState } from 'react';

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
 * is a link to the Vapor build, and flipping it means "this is where you're
 * going".
 *
 * The flip is driven per input type, because each one answers "am I about to
 * leave?" at a different moment:
 *
 * - mouse: on hover, so the destination is previewed before committing;
 * - keyboard: on focus-visible, the hover equivalent;
 * - touch: on press, since there is no hover — the knob travels as the tap
 *   opens the preview site, then settles back on its own.
 *
 * The touch flip un-flips on a timer rather than on the tab backgrounding:
 * opening a link may or may not background this page, and either way you
 * should never come back to a switch stuck on Vapor while you're still
 * looking at the VDOM site.
 */
export function VaporModeNavLink({ locale = 'en' }: VaporModeNavLinkProps) {
  const labels = copy[locale];
  const [on, setOn] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettle = useCallback(() => {
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  /** Flip, then let it settle back once the knob has finished travelling. */
  const flipAndSettle = useCallback(() => {
    setOn(true);
    clearSettle();
    settleTimer.current = setTimeout(() => setOn(false), 600);
  }, [clearSettle]);

  useEffect(() => clearSettle, [clearSettle]);

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
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            clearSettle();
            setOn(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setOn(false);
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') flipAndSettle();
        }}
        onPointerCancel={() => {
          clearSettle();
          setOn(false);
        }}
        onFocus={(event) => {
          // Only keyboard focus previews — a tap also focuses the anchor, and
          // that used to leave the switch flipped until something else stole
          // focus.
          if (event.currentTarget.matches(':focus-visible')) {
            clearSettle();
            setOn(true);
          }
        }}
        onBlur={() => {
          clearSettle();
          setOn(false);
        }}
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
