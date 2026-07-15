import type { RenderMode } from './render-mode-store';

interface VaporStatusProps {
  entry: string;
  /** Mode the visitor asked for (nav toggle). */
  requested: RenderMode;
  /** Mode this example actually renders with. */
  mode: RenderMode;
  status: 'supported' | 'unsupported';
  reason?: string;
  locale?: 'en' | 'zh';
  /** When set, the badge is a button that switches the global mode. */
  onToggle?: () => void;
}

export const vaporReasonCopy = {
  en: {
    'render-function': 'Uses a render function',
    'vue-router-and-transitions': 'Uses Vue Router and transitions',
    'keep-alive': 'Uses KeepAlive',
    'options-api': 'Uses the Options API',
    suspense: 'Uses Suspense',
    'vue-router': 'Uses Vue Router',
    transition: 'Uses Transition',
  },
  zh: {
    'render-function': '使用渲染函数',
    'vue-router-and-transitions': '使用 Vue Router 和 Transition',
    'keep-alive': '使用 KeepAlive',
    'options-api': '使用 Options API',
    suspense: '使用 Suspense',
    'vue-router': '使用 Vue Router',
    transition: '使用 Transition',
  },
} as const;

const statusCopy = {
  en: {
    vapor: 'Vapor',
    vdom: 'VDOM',
    fallback: 'VDOM only',
    bundleUnavailable: 'Vapor bundle not built',
    toVdom: 'Running Vue Vapor — click to switch every example to VDOM',
    toVapor: 'Running Vue VDOM — click to switch every example to Vapor',
  },
  zh: {
    vapor: 'Vapor',
    vdom: 'VDOM',
    fallback: '仅 VDOM',
    bundleUnavailable: 'Vapor 包未构建',
    toVdom: '正在以 Vapor 运行——点按将所有示例切换为 VDOM',
    toVapor: '正在以 VDOM 运行——点按将所有示例切换为 Vapor',
  },
} as const;

/**
 * Per-example renderer badge, designed to sit in the <Go> card footer
 * (via go-web's `rightFooter` slot) with the same visual language as the
 * nav toggle. States:
 *
 * - effective Vapor → tinted "Vapor" pill (click switches back to VDOM)
 * - effective VDOM, entry supported → neutral "VDOM" pill (click switches
 *   to Vapor — a per-example affordance for the global preference)
 * - entry can't run Vapor → static "VDOM only" pill; the reason shows
 *   inline while Vapor is requested, and in the tooltip otherwise
 */
export function VaporStatus({
  entry,
  requested,
  mode,
  status,
  reason,
  locale = 'en',
  onToggle,
}: VaporStatusProps) {
  const copy = statusCopy[locale];
  const reasons = vaporReasonCopy[locale];
  const fellBack = requested === 'vapor' && mode === 'vdom';
  const canRunVapor = Boolean(onToggle);

  const label = mode === 'vapor'
    ? copy.vapor
    : canRunVapor && !fellBack
      ? copy.vdom
      : copy.fallback;
  const formattedReason = !canRunVapor || fellBack
    ? reason
      ? reasons[reason as keyof typeof reasons] ?? reason
      : status === 'supported'
        ? copy.bundleUnavailable
        : ''
    : '';
  // Reason inline only while it explains a live fallback; tooltip otherwise.
  const description = fellBack && formattedReason ? ` · ${formattedReason}` : '';
  const title = canRunVapor
    ? mode === 'vapor' ? copy.toVdom : copy.toVapor
    : formattedReason;

  const Tag = canRunVapor ? 'button' : 'div';

  return (
    <Tag
      {...(canRunVapor ? { type: 'button' as const, onClick: onToggle } : {})}
      className="vapor-status"
      data-entry={entry}
      data-vapor-status={status}
      data-render-mode={mode}
      data-interactive={canRunVapor || undefined}
      aria-label={`${entry}: ${label}${description}`}
      title={title}
    >
      <span className="vapor-status__dot" aria-hidden="true" />
      <span className="vapor-status__label">{label}</span>
      {description && <span className="vapor-status__reason">{description}</span>}
    </Tag>
  );
}
