import { InfoPopover } from './InfoPopover';

/** Short production path that redirects to the `vapor` branch preview build. */
export const VAPOR_SITE_HREF = '/vapor';

interface VaporModeNavLinkProps {
  locale?: 'en' | 'zh';
}

const copy = {
  en: {
    label: 'Vapor mode',
    /** Sits under the label inside the pill — the "this is elsewhere" cue. */
    tag: 'preview site',
    title: 'Opens the Vapor preview site in a new tab',
    infoLabel: 'About Vapor mode',
    infoBefore: 'Vapor mode is under active exploration on the ',
    infoAfter:
      ' branch. Its docs and live examples ship as a separate preview build — this site always renders with the VDOM runtime, and nothing here changes when you open it.',
    infoLink: 'Open the Vapor preview site',
  },
  zh: {
    label: 'Vapor mode',
    tag: '预览站点',
    title: '在新标签页打开 Vapor 预览站点',
    infoLabel: '关于 Vapor mode',
    infoBefore: 'Vapor mode 正在 ',
    infoAfter:
      ' 分支上探索中，其文档与可运行示例发布在独立的预览构建里 —— 本站始终使用 VDOM 运行时渲染，打开预览站点不会改变本站的任何内容。',
    infoLink: '打开 Vapor 预览站点',
  },
} as const;

const ExternalArrow = () => (
  <svg
    className="vapor-nav-link__arrow"
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 11L11 5M11 5H6M11 5V10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Nav-bar pointer to the Vapor preview build. Deliberately *not* shaped like
 * a switch: Vapor is a separate deployment of this site, not a mode you can
 * flip in place, so the control is a gradient-outlined pill that reads
 * "Vapor mode · preview site ↗" and opens in a new tab. The ⓘ chip spells
 * out that nothing on this page changes.
 */
export function VaporModeNavLink({ locale = 'en' }: VaporModeNavLinkProps) {
  const labels = copy[locale];

  return (
    <div className="vapor-nav-link">
      <a
        className="vapor-nav-link__pill"
        href={VAPOR_SITE_HREF}
        target="_blank"
        rel="noopener noreferrer"
        title={labels.title}
      >
        <span className="vapor-nav-link__text">
          <span className="vapor-nav-link__label">{labels.label}</span>
          <span className="vapor-nav-link__tag">{labels.tag}</span>
        </span>
        <ExternalArrow />
      </a>
      <InfoPopover label={labels.infoLabel} direction="down">
        <p>
          {labels.infoBefore}
          <code className="vapor-nav-link__branch">vapor</code>
          {labels.infoAfter}
        </p>
        <a href={VAPOR_SITE_HREF} target="_blank" rel="noopener noreferrer">
          {labels.infoLink} →
        </a>
      </InfoPopover>
    </div>
  );
}

export default VaporModeNavLink;
