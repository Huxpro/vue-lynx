// Black-box cross-framework benchmark UI — ReactLynx variant.
// Mirrors apps/ui-vdom/src/App.vue operation-for-operation, implemented as
// the idiomatic keyed react-hooks version from js-framework-benchmark:
// immutable state updates + memoized row component.
import { memo, useCallback, useState } from '@lynx-js/react';

import { buildData } from './data';
import type { RowData } from './data';

import './App.css';

interface RowProps {
  row: RowData;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
}

const Row = memo(function Row({ row, isSelected, onSelect, onRemove }: RowProps) {
  return (
    <view className={isSelected ? 'row danger' : 'row'}>
      <text className="col-id">{row.id}</text>
      <text className="col-label" bindtap={() => onSelect(row.id)}>
        {row.label}
      </text>
      <text className="col-remove" bindtap={() => onRemove(row.id)}>
        x
      </text>
    </view>
  );
});

export function App() {
  const [rows, setRows] = useState<RowData[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const run = useCallback(() => {
    setRows(buildData());
    setSelected(undefined);
  }, []);
  const runLots = useCallback(() => {
    setRows(buildData(10000));
    setSelected(undefined);
  }, []);
  const add = useCallback(() => {
    setRows((prev) => prev.concat(buildData(1000)));
  }, []);
  const update = useCallback(() => {
    setRows((prev) => {
      const next = prev.slice();
      for (let i = 0; i < next.length; i += 10) {
        next[i] = { id: next[i].id, label: `${next[i].label} !!!` };
      }
      return next;
    });
  }, []);
  const select = useCallback((id: number) => {
    setSelected(id);
  }, []);
  const remove = useCallback((id: number) => {
    setRows((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      return prev.slice(0, idx).concat(prev.slice(idx + 1));
    });
  }, []);
  const swapRows = useCallback(() => {
    setRows((prev) => {
      if (prev.length <= 998) return prev;
      const next = prev.slice();
      const d1 = next[1];
      next[1] = next[998];
      next[998] = d1;
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    setRows([]);
    setSelected(undefined);
  }, []);

  return (
    <view className="page">
      <text className="title">React UI Benchmark on Lynx · ready</text>
      <view className="toolbar">
        <view className="btn" bindtap={run}>
          <text className="btn-text">Create 1,000 rows</text>
        </view>
        <view className="btn" bindtap={runLots}>
          <text className="btn-text">Create 10,000 rows</text>
        </view>
        <view className="btn" bindtap={add}>
          <text className="btn-text">Append 1,000 rows</text>
        </view>
        <view className="btn" bindtap={update}>
          <text className="btn-text">Update every 10th row</text>
        </view>
        <view className="btn" bindtap={swapRows}>
          <text className="btn-text">Swap Rows</text>
        </view>
        <view className="btn" bindtap={clear}>
          <text className="btn-text">Clear</text>
        </view>
      </view>
      <view className="rows">
        {rows.map((row) => (
          <Row
            key={row.id}
            row={row}
            isSelected={selected === row.id}
            onSelect={select}
            onRemove={remove}
          />
        ))}
      </view>
    </view>
  );
}
