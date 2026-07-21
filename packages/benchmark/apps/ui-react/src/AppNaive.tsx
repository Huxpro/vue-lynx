// NAIVE ReactLynx variant: identical semantics to App.tsx but with NO manual
// optimization — no memo() on the row component, no useCallback, handlers and
// row elements recreated on every render. This is the baseline that manual
// hooks optimization (App.tsx) and React Compiler (built from this file with
// babel-plugin-react-compiler) are compared against.
import { useEffect, useRef, useState } from '@lynx-js/react';

import { buildData } from './data';
import type { RowData } from './data';

import './App.css';

const STORM_UPDATE_TICKS = 50;
const STORM_SELECT_TICKS = 30;

const _stormChannel = new MessageChannel();
let _stormPending: (() => void) | null = null;
_stormChannel.port1.onmessage = () => {
  const cb = _stormPending;
  _stormPending = null;
  if (cb) cb();
};
function nextMacrotask(cb: () => void) {
  _stormPending = cb;
  _stormChannel.port2.postMessage(0);
}

// Module-scope storm driver: the tick counter must not be a mutated binding
// captured by lambdas INSIDE a component — babel-plugin-react-compiler bails
// out on the whole component for that pattern ("Handle UpdateExpression to
// variables captured within lambdas"). Module functions are not compiled, and
// the per-tick callback receives t as a parameter.
function runStorm(ticks: number, step: (t: number) => void) {
  let t = 0;
  const tick = () => {
    t += 1;
    step(t);
    if (t < ticks) nextMacrotask(tick);
  };
  nextMacrotask(tick);
}

function Row({
  row,
  isSelected,
  onSelect,
  onRemove,
}: {
  row: RowData;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
}) {
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
}

export function App() {
  const [rows, setRows] = useState<RowData[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const run = () => {
    setRows(buildData());
    setSelected(undefined);
  };
  const runLots = () => {
    setRows(buildData(10000));
    setSelected(undefined);
  };
  const run3k = () => {
    setRows(buildData(3000));
    setSelected(undefined);
  };
  const run5k = () => {
    setRows(buildData(5000));
    setSelected(undefined);
  };
  const run20k = () => {
    setRows(buildData(20000));
    setSelected(undefined);
  };
  const run30k = () => {
    setRows(buildData(30000));
    setSelected(undefined);
  };
  const add = () => {
    setRows((prev) => prev.concat(buildData(1000)));
  };
  const update = () => {
    setRows((prev) => {
      const next = prev.slice();
      for (let i = 0; i < next.length; i += 10) {
        next[i] = { id: next[i].id, label: `${next[i].label} !!!` };
      }
      return next;
    });
  };
  const select = (id: number) => {
    setSelected(id);
  };
  const remove = (id: number) => {
    setRows((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      return prev.slice(0, idx).concat(prev.slice(idx + 1));
    });
  };
  const swapRows = () => {
    setRows((prev) => {
      if (prev.length <= 998) return prev;
      const next = prev.slice();
      const d1 = next[1];
      next[1] = next[998];
      next[998] = d1;
      return next;
    });
  };
  const clear = () => {
    setRows([]);
    setSelected(undefined);
  };

  const idsRef = useRef<number[]>([]);
  useEffect(() => {
    idsRef.current = rows.map((r) => r.id);
  }, [rows]);

  const stormUpdate = () => {
    runStorm(STORM_UPDATE_TICKS, (t) =>
      setRows((prev) =>
        prev.map((r, i) => (i % 10 === 0 ? { id: r.id, label: `bench ${t}` } : r)),
      ),
    );
  };

  const stormSelect = () => {
    runStorm(STORM_SELECT_TICKS, (t) => {
      const ids = idsRef.current;
      setSelected(t < STORM_SELECT_TICKS ? ids[(t * 97) % ids.length] : ids[0]);
    });
  };

  return (
    <view className="page">
      <text className="title">React (naive) UI Benchmark on Lynx · ready</text>
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
