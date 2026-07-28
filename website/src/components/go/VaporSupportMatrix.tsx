import { useLang } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';

import { vaporReasonCopy } from './VaporStatus';

interface MatrixEntry {
  id: string;
  vapor: {
    disposition: 'supported' | 'unsupported';
    strategy?: string;
    reasonCode?: string;
  };
}

interface MatrixData {
  entries: MatrixEntry[];
}

type Filter = 'all' | 'supported' | 'unsupported';

const copy = {
  en: {
    summary: (s: number, u: number) =>
      `${s} entries run Vapor · ${u} stay VDOM-only`,
    filters: { all: 'All', supported: 'Vapor', unsupported: 'VDOM only' } as Record<Filter, string>,
    columns: { entry: 'Entry', vapor: 'Vapor', notes: 'Strategy / reason' },
    supported: 'Supported',
    unsupported: 'VDOM only',
    strategies: {
      direct: 'runs as-is',
      adapter: 'entry bootstrap adapted',
    } as Record<string, string>,
    legend:
      'Every entry is built and driven in Chromium through Lynx for Web; supported rows pass the same scenario in both modes. “Entry bootstrap adapted” means only the app-creation shim differs — the feature component and behavior are identical.',
    loadError: 'Could not load the support matrix.',
  },
  zh: {
    summary: (s: number, u: number) =>
      `${s} 个 entry 支持 Vapor · ${u} 个仅 VDOM`,
    filters: { all: '全部', supported: 'Vapor', unsupported: '仅 VDOM' } as Record<Filter, string>,
    columns: { entry: 'Entry', vapor: 'Vapor', notes: '策略 / 原因' },
    supported: '支持',
    unsupported: '仅 VDOM',
    strategies: {
      direct: '源码原样运行',
      adapter: '仅入口引导适配',
    } as Record<string, string>,
    legend:
      '每个 entry 都会构建并在 Chromium 中通过 Lynx for Web 实测；支持项必须在两种模式下通过同一场景。“仅入口引导适配”指只有创建应用的 shim 不同——功能组件和行为完全一致。',
    loadError: '支持矩阵加载失败。',
  },
} as const;

/**
 * Live "verified example matrix" for the Vapor Mode guide, generated from
 * the machine-readable verification output (examples/vapor-support.json,
 * copied into the site by prepare-examples) instead of a hand-maintained
 * table that drifts from it.
 */
export function VaporSupportMatrix() {
  const locale = useLang().startsWith('zh') ? 'zh' : 'en';
  const t = copy[locale];
  const reasons = vaporReasonCopy[locale];
  const [data, setData] = useState<MatrixData>();
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/examples/vapor-support.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<MatrixData>;
      })
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);

  if (error) return <p className="vapor-matrix__error">{t.loadError}</p>;
  if (!data) return <div className="vapor-matrix" aria-busy="true" />;

  const entries = [...data.entries].sort((a, b) => a.id.localeCompare(b.id));
  const supported = entries.filter((e) => e.vapor.disposition === 'supported');
  const shown = filter === 'all'
    ? entries
    : entries.filter((e) => e.vapor.disposition === (filter === 'supported' ? 'supported' : 'unsupported'));

  return (
    <div className="vapor-matrix">
      <div className="vapor-matrix__bar">
        <span className="vapor-matrix__summary">
          {t.summary(supported.length, entries.length - supported.length)}
        </span>
        <div className="vapor-matrix__filters" role="group">
          {(['all', 'supported', 'unsupported'] as const).map((candidate) => (
            <button
              type="button"
              key={candidate}
              aria-pressed={filter === candidate}
              onClick={() => setFilter(candidate)}
            >
              {t.filters[candidate]}
            </button>
          ))}
        </div>
      </div>
      <div className="vapor-matrix__scroll">
        <table>
          <thead>
            <tr>
              <th>{t.columns.entry}</th>
              <th>{t.columns.vapor}</th>
              <th>{t.columns.notes}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ id, vapor }) => {
              const isSupported = vapor.disposition === 'supported';
              return (
                <tr key={id}>
                  <td><code>{id}</code></td>
                  <td>
                    <span
                      className="vapor-status"
                      data-render-mode={isSupported ? 'vapor' : 'vdom'}
                      data-vapor-status={vapor.disposition}
                    >
                      <span className="vapor-status__label">
                        {isSupported ? t.supported : t.unsupported}
                      </span>
                    </span>
                  </td>
                  <td className="vapor-matrix__notes">
                    {isSupported
                      ? t.strategies[vapor.strategy ?? 'direct'] ?? vapor.strategy
                      : reasons[vapor.reasonCode as keyof typeof reasons] ?? vapor.reasonCode}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="vapor-matrix__legend">{t.legend}</p>
    </div>
  );
}

export default VaporSupportMatrix;
