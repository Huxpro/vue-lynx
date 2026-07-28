import { InfoPopover } from './InfoPopover';

/** Short production path that redirects to the `vapor` branch preview build. */
export const VAPOR_SITE_HREF = '/vapor';

interface VaporModeNavLinkProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    label: 'Switch to Vapor mode — opens the Vapor preview site',
    description: 'Vapor mode lives on a separate preview build',
    off: 'VDOM',
    on: 'Vapor preview',
    infoLabel: 'About Vapor mode',
    infoBefore: 'Vapor mode is under active exploration on the ',
    infoAfter:
      ' branch. Its docs and live examples ship as a separate preview build — this site always renders with the VDOM runtime.',
    infoLink: 'Open the Vapor preview',
  },
  zh: {
    label: '切换到 Vapor mode —— 打开 Vapor 预览站点',
    description: 'Vapor mode 位于独立的预览构建中',
    off: 'VDOM',
    on: 'Vapor 预览',
    infoLabel: '关于 Vapor mode',
    infoBefore: 'Vapor mode 正在 ',
    infoAfter:
      ' 分支上探索中，其文档与可运行示例发布在独立的预览构建里 —— 本站始终使用 VDOM 运行时渲染。',
    infoLink: '打开 Vapor 预览站点',
  },
} as const;

/**
 * Nav-bar teaser for Vapor mode: the same petite switch the Vapor preview
 * site carries in its nav, rendered permanently "off" (VDOM). It is a link,
 * not a toggle — flipping it takes you to the Vapor build of this site,
 * where the real switch lives — so the flipped label reads "Vapor preview",
 * not just "Vapor". The ⓘ chip spells out where Vapor actually lives before
 * anyone leaves the page.
 */
export function VaporModeNavLink({ locale = 'en' }: VaporModeNavLinkProps) {
  const labels = copy[locale];

  return (
    <div className="vapor-nav-link" title={labels.description}>
      <a
        className="vapor-nav-link__switch"
        href={VAPOR_SITE_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.label}
      >
        <span className="vapor-nav-link__track" aria-hidden="true">
          <span className="vapor-nav-link__mode vapor-nav-link__mode--off">
            {labels.off}
          </span>
          <span className="vapor-nav-link__mode vapor-nav-link__mode--on">
            {labels.on}
          </span>
          <span className="vapor-nav-link__knob" />
        </span>
      </a>
      <InfoPopover label={labels.infoLabel} direction="down">
        <p>
          {labels.infoBefore}
          <code className="vapor-nav-link__branch">vapor</code>
          {labels.infoAfter}
        </p>
        <a href={VAPOR_SITE_HREF} target="_blank" rel="noreferrer">
          {labels.infoLink} →
        </a>
      </InfoPopover>
    </div>
  );
}

export default VaporModeNavLink;
