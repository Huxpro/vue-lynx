interface VaporStatusProps {
  entry: string;
  mode: 'vdom' | 'vapor';
  status: 'supported' | 'unsupported';
  reason?: string;
  onModeChange: (mode: 'vdom' | 'vapor') => void;
}

export function VaporStatus({
  entry,
  mode,
  status,
  reason,
  onModeChange,
}: VaporStatusProps) {
  return (
    <div className="vapor-status" data-entry={entry} data-vapor-status={status}>
      <span className="vapor-status__entry">{entry}</span>
      {status === 'supported' ? (
        <div className="vapor-status__modes" aria-label="Rendering mode">
          {(['vdom', 'vapor'] as const).map((candidate) => (
            <button
              type="button"
              key={candidate}
              aria-pressed={mode === candidate}
              onClick={() => onModeChange(candidate)}
            >
              {candidate === 'vdom' ? 'VDOM' : 'Vapor'}
            </button>
          ))}
        </div>
      ) : (
        <span className="vapor-status__unsupported" title={reason}>
          Vapor unsupported{reason ? ` · ${reason}` : ''}
        </span>
      )}
    </div>
  );
}
