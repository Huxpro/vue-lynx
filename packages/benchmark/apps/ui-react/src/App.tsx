// Black-box cross-framework benchmark UI — ReactLynx variant.
// Mirrors apps/ui-vdom/src/App.vue operation-for-operation, implemented as
// the idiomatic keyed react-hooks version from js-framework-benchmark:
// immutable state updates + memoized row component.
import { memo, useCallback, useEffect, useRef, useState } from '@lynx-js/react';

import { buildData, buildDataSeeded } from './data';
import type { RowData } from './data';
import {
  NATIVE_STARTUP_TIMING_FLAG,
  nativeBenchmark,
} from '../../../shared/native-protocol';

import './App.css';

// Startup scale is a build-time cell. A deterministic initializer keeps the
// main/background first render identical while exercising the real mount path.
declare const __BENCH_AUTOROWS__: number;
const INITIAL_ROWS = __BENCH_AUTOROWS__ > 0
  ? buildDataSeeded(__BENCH_AUTOROWS__)
  : [];

// -- storms: N sequential state→render→tree ticks from one click -------------
// Each tick runs in its own macrotask so every mutation goes through a full
// render cycle instead of batching. Browsers use MessageChannel to avoid the
// nested setTimeout 4ms clamp; native Lynx has no MessageChannel and uses its
// native timer queue. Mirrors apps/ui-vdom/src/App.vue.
const STORM_UPDATE_TICKS = 50;
const STORM_SELECT_TICKS = 30;

const _stormChannel = typeof MessageChannel === 'function'
  ? new MessageChannel()
  : null;
let _stormPending: (() => void) | null = null;
function flushMacrotask() {
  const cb = _stormPending;
  _stormPending = null;
  if (cb) cb();
}
if (_stormChannel) _stormChannel.port1.onmessage = flushMacrotask;
function nextMacrotask(cb: () => void) {
  _stormPending = cb;
  if (_stormChannel) _stormChannel.port2.postMessage(0);
  else lynx.setTimeout(flushMacrotask, 0);
}

// Module-scope storm driver — mirrors AppNaive.tsx (the tick counter must not
// be a mutated binding captured inside the component; see note there).
function runStorm(ticks: number, step: (t: number) => void) {
  if (nativeBenchmark.isNative) return nativeBenchmark.runStorm(ticks, step);
  let t = 0;
  const tick = () => {
    t += 1;
    step(t);
    if (t < ticks) nextMacrotask(tick);
  };
  nextMacrotask(tick);
}

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
  const [rows, setRows] = useState<RowData[]>(INITIAL_ROWS);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const run = useCallback(() => {
    nativeBenchmark.measure('create', () => {
      setRows(buildData());
      setSelected(undefined);
    });
  }, []);
  const runLots = useCallback(() => {
    nativeBenchmark.measure('create', () => {
      setRows(buildData(10000));
      setSelected(undefined);
    });
  }, []);
  const run3k = useCallback(() => {
    nativeBenchmark.measure('create', () => {
      setRows(buildData(3000));
      setSelected(undefined);
    });
  }, []);
  const run5k = useCallback(() => {
    nativeBenchmark.measure('create', () => {
      setRows(buildData(5000));
      setSelected(undefined);
    });
  }, []);
  const run20k = useCallback(() => {
    nativeBenchmark.measure('create', () => {
      setRows(buildData(20000));
      setSelected(undefined);
    });
  }, []);
  const run30k = useCallback(() => {
    nativeBenchmark.measure('create', () => {
      setRows(buildData(30000));
      setSelected(undefined);
    });
  }, []);
  const add = useCallback(() => {
    nativeBenchmark.measure('append1k', () => {
      setRows((prev) => prev.concat(buildData(1000)));
    });
  }, []);
  const update = useCallback(() => {
    nativeBenchmark.measure('update10th', () => {
      setRows((prev) => {
        const next = prev.slice();
        for (let i = 0; i < next.length; i += 10) {
          next[i] = { id: next[i].id, label: `${next[i].label} !!!` };
        }
        return next;
      });
    });
  }, []);
  const select = useCallback((id: number) => {
    nativeBenchmark.measure('select', () => setSelected(id));
  }, []);
  const remove = useCallback((id: number) => {
    nativeBenchmark.measure('remove', () => {
      setRows((prev) => {
        const idx = prev.findIndex((d) => d.id === id);
        return prev.slice(0, idx).concat(prev.slice(idx + 1));
      });
    });
  }, []);
  const swapRows = useCallback(() => {
    nativeBenchmark.measure('swap', () => {
      setRows((prev) => {
        if (prev.length <= 998) return prev;
        const next = prev.slice();
        const d1 = next[1];
        next[1] = next[998];
        next[998] = d1;
        return next;
      });
    });
  }, []);
  const clear = useCallback(() => {
    nativeBenchmark.measure('clear', () => {
      setRows([]);
      setSelected(undefined);
    });
  }, []);

  const idsRef = useRef<number[]>([]);
  useEffect(() => {
    idsRef.current = rows.map((r) => r.id);
  }, [rows]);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const snapshotGetterRef = useRef(() => {
    const current = rowsRef.current;
    return {
      rowCount: current.length,
      firstId: current[0]?.id ?? null,
      secondId: current[1]?.id ?? null,
      thirdId: current[2]?.id ?? null,
      row998Id: current[998]?.id ?? null,
      firstLabel: current[0]?.label ?? null,
      selectedId: selectedRef.current ?? null,
    };
  });
  const snapshotCleanupRef = useRef<(() => void) | null>(null);
  if (snapshotCleanupRef.current === null) {
    // Startup schedules its frame receipt immediately after root.render(), so
    // the getter must exist during the synchronous mount rather than in a
    // passive effect.
    snapshotCleanupRef.current = nativeBenchmark.installSnapshot(snapshotGetterRef.current);
  }
  useEffect(() => () => snapshotCleanupRef.current?.(), []);

  const stormUpdate = useCallback(() => {
    nativeBenchmark.measure('updateStorm', () => runStorm(STORM_UPDATE_TICKS, (t) =>
      setRows((prev) =>
        prev.map((r, i) => (i % 10 === 0 ? { id: r.id, label: `bench ${t}` } : r)),
      ),
    ));
  }, []);

  const stormSelect = useCallback(() => {
    nativeBenchmark.measure('selectStorm', () => runStorm(STORM_SELECT_TICKS, (t) => {
      const ids = idsRef.current;
      setSelected(t < STORM_SELECT_TICKS ? ids[(t * 97) % ids.length] : ids[0]);
    }));
  }, []);

  return (
    <view className="page" __lynx_timing_flag={NATIVE_STARTUP_TIMING_FLAG}>
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
