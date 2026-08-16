// Cross-framework benchmark UI — ReactLynx variant. Native-only timing is
// capability-gated so Lynx for Web keeps its black-box measurement behavior.
// Mirrors apps/ui-vdom/src/App.vue operation-for-operation, implemented as
// the idiomatic keyed react-hooks version from js-framework-benchmark:
// immutable state updates + memoized row component.
import { memo, useCallback, useEffect, useRef, useState } from '@lynx-js/react';

import { createNativeBench } from '../../../shared/native-bench';
import { buildData, buildDataSeeded } from './data';
import type { RowData } from './data';

import './App.css';

const {
  runStorm: runNativeBenchStorm,
  startMeasure: startNativeMeasure,
} = createNativeBench();

// -- storms: N sequential state→render→DOM ticks from one click --------------
// Each tick runs in its own task so every mutation goes through a full render
// cycle instead of batching. Lynx for Web keeps MessageChannel; Native uses
// its timer task queue. Mirrors apps/ui-vdom/src/App.vue.
const STORM_UPDATE_TICKS = 50;
const STORM_SELECT_TICKS = 30;

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
  const [rows, setRows] = useState<RowData[]>(() =>
    buildDataSeeded(__BENCH_AUTOROWS__, 42)
  );
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const run = useCallback(() => {
    const finish = startNativeMeasure('create');
    setRows(buildData());
    setSelected(undefined);
    finish();
  }, []);
  const runLots = useCallback(() => {
    const finish = startNativeMeasure('create');
    setRows(buildData(10000));
    setSelected(undefined);
    finish();
  }, []);
  const run3k = useCallback(() => {
    const finish = startNativeMeasure('create');
    setRows(buildData(3000));
    setSelected(undefined);
    finish();
  }, []);
  const run5k = useCallback(() => {
    const finish = startNativeMeasure('create');
    setRows(buildData(5000));
    setSelected(undefined);
    finish();
  }, []);
  const run20k = useCallback(() => {
    const finish = startNativeMeasure('create');
    setRows(buildData(20000));
    setSelected(undefined);
    finish();
  }, []);
  const run30k = useCallback(() => {
    const finish = startNativeMeasure('create');
    setRows(buildData(30000));
    setSelected(undefined);
    finish();
  }, []);
  const add = useCallback(() => {
    const finish = startNativeMeasure('append1k');
    setRows((prev) => prev.concat(buildData(1000)));
    finish();
  }, []);
  const update = useCallback(() => {
    const finish = startNativeMeasure('update10th');
    setRows((prev) => {
      const next = prev.slice();
      for (let i = 0; i < next.length; i += 10) {
        next[i] = { id: next[i].id, label: `${next[i].label} !!!` };
      }
      return next;
    });
    finish();
  }, []);
  const select = useCallback((id: number) => {
    const finish = startNativeMeasure('select');
    setSelected(id);
    finish();
  }, []);
  const remove = useCallback((id: number) => {
    const finish = startNativeMeasure('remove');
    setRows((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      return prev.slice(0, idx).concat(prev.slice(idx + 1));
    });
    finish();
  }, []);
  const swapRows = useCallback(() => {
    const finish = startNativeMeasure('swap');
    setRows((prev) => {
      if (prev.length <= 998) return prev;
      const next = prev.slice();
      const d1 = next[1];
      next[1] = next[998];
      next[998] = d1;
      return next;
    });
    finish();
  }, []);
  const clear = useCallback(() => {
    const finish = startNativeMeasure('clear');
    setRows([]);
    setSelected(undefined);
    finish();
  }, []);

  const idsRef = useRef<number[]>([]);
  useEffect(() => {
    idsRef.current = rows.map((r) => r.id);
  }, [rows]);

  const stormUpdate = useCallback(() => {
    runNativeBenchStorm('updateStorm', STORM_UPDATE_TICKS, (t) =>
      setRows((prev) =>
        prev.map((r, i) => (i % 10 === 0 ? { id: r.id, label: `bench ${t}` } : r)),
      ),
    );
  }, []);

  const stormSelect = useCallback(() => {
    runNativeBenchStorm('selectStorm', STORM_SELECT_TICKS, (t) => {
      const ids = idsRef.current;
      setSelected(t < STORM_SELECT_TICKS ? ids[(t * 97) % ids.length] : ids[0]);
    });
  }, []);

  return (
    <view className="page">
      <text className="title">React UI Benchmark on Lynx · ready</text>
      <view className="toolbar">
        <view className="btn" bindtap={run}>
          <text className="btn-text">Create 1,000 rows</text>
        </view>
        <view className="btn" bindtap={run3k}>
          <text className="btn-text">Create 3,000 rows</text>
        </view>
        <view className="btn" bindtap={run5k}>
          <text className="btn-text">Create 5,000 rows</text>
        </view>
        <view className="btn" bindtap={runLots}>
          <text className="btn-text">Create 10,000 rows</text>
        </view>
        <view className="btn" bindtap={run20k}>
          <text className="btn-text">Create 20,000 rows</text>
        </view>
        <view className="btn" bindtap={run30k}>
          <text className="btn-text">Create 30,000 rows</text>
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
        <view className="btn" bindtap={stormUpdate}>
          <text className="btn-text">Update storm</text>
        </view>
        <view className="btn" bindtap={stormSelect}>
          <text className="btn-text">Select storm</text>
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
