interface VaporStatusProps {
  entry: string;
  mode: 'vdom' | 'vapor';
  status: 'supported' | 'unsupported';
  reason?: string;
  locale?: 'en' | 'zh';
}

const statusCopy = {
  en: {
    active: 'Vapor active',
    ready: 'Vapor ready',
    fallback: 'VDOM only',
    reasons: {
      'render-function': 'Uses a render function',
      'vue-router-and-transitions': 'Uses Vue Router and transitions',
      'keep-alive': 'Uses KeepAlive',
      'options-api': 'Uses the Options API',
      suspense: 'Uses Suspense',
      'vue-router': 'Uses Vue Router',
      transition: 'Uses Transition',
    },
  },
  zh: {
    active: 'Vapor 已启用',
    ready: 'Vapor 可用',
    fallback: '仅 VDOM',
    reasons: {
      'render-function': '使用渲染函数',
      'vue-router-and-transitions': '使用 Vue Router 和 Transition',
      'keep-alive': '使用 KeepAlive',
      'options-api': '使用 Options API',
      suspense: '使用 Suspense',
      'vue-router': '使用 Vue Router',
      transition: '使用 Transition',
    },
  },
} as const;

export function VaporStatus({
  entry,
  mode,
  status,
  reason,
  locale = 'en',
}: VaporStatusProps) {
  const copy = statusCopy[locale];
  const label = status === 'supported'
    ? mode === 'vapor' ? copy.active : copy.ready
    : copy.fallback;
  const formattedReason = reason
    ? copy.reasons[reason as keyof typeof copy.reasons] ?? reason
    : '';
  const description = status === 'unsupported' && formattedReason
    ? ` · ${formattedReason}`
    : '';

  return (
    <div
      className="vapor-status"
      data-entry={entry}
      data-vapor-status={status}
      aria-label={`${entry}: ${label}${description}`}
      title={formattedReason}
    >
      <span className="vapor-status__dot" aria-hidden="true" />
      <span className="vapor-status__label">{label}</span>
      {description && <span className="vapor-status__reason">{description}</span>}
    </div>
  );
}
