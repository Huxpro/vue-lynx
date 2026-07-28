// Plain-DOM preact-hooks baseline — the web-reference for ReactLynx (which
// is preact-based). Same semantics/structure as apps/ui-react/src/App.tsx:
// keyed list, memo'd Row, useCallback handlers, identical storm protocol.
import { render } from 'preact';
import { memo } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import {
  STORM_SELECT_TICKS,
  STORM_UPDATE_TICKS,
  buildData,
  runStorm,
  SIZES,
} from './shared.js';

const Row = memo(function Row({ row, isSelected, onSelect, onRemove }) {
  return (
    <div class={isSelected ? 'row danger' : 'row'}>
      <span class="col-id">{row.id}</span>
      <span class="col-label" onClick={() => onSelect(row.id)}>{row.label}</span>
      <span class="col-remove" onClick={() => onRemove(row.id)}>x</span>
    </div>
  );
});

function App() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(undefined);

  // plain handlers are fine for toolbar buttons (only Row props need
  // stability for memo) — and no hooks inside loops
  const creators = SIZES.map(([label, n]) => ({
    label,
    fn: () => {
      setRows(buildData(n));
      setSelected(undefined);
    },
  }));
  const update = useCallback(() => {
    setRows((prev) => {
      const next = prev.slice();
      for (let i = 0; i < next.length; i += 10) {
        next[i] = { id: next[i].id, label: `${next[i].label} !!!` };
      }
      return next;
    });
  }, []);
  const select = useCallback((id) => setSelected(id), []);
  const remove = useCallback((id) => {
    setRows((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      return prev.slice(0, idx).concat(prev.slice(idx + 1));
    });
  }, []);
  const clear = useCallback(() => {
    setRows([]);
    setSelected(undefined);
  }, []);

  const idsRef = useRef([]);
  useEffect(() => {
    idsRef.current = rows.map((r) => r.id);
  }, [rows]);

  const stormUpdate = useCallback(() => {
    runStorm(STORM_UPDATE_TICKS, (t) =>
      setRows((prev) =>
        prev.map((r, i) => (i % 10 === 0 ? { id: r.id, label: `bench ${t}` } : r)),
      ),
    );
  }, []);
  const stormSelect = useCallback(() => {
    runStorm(STORM_SELECT_TICKS, (t) => {
      const ids = idsRef.current;
      setSelected(t < STORM_SELECT_TICKS ? ids[(t * 97) % ids.length] : ids[0]);
    });
  }, []);

  return (
    <div class="page">
      <span class="title">Preact (web DOM) UI Benchmark · ready</span>
      <div class="toolbar">
        {creators.map((c) => (
          <button class="btn" key={c.label} onClick={c.fn}>
            <span class="btn-text">{c.label}</span>
          </button>
        ))}
        <button class="btn" onClick={update}><span class="btn-text">Update every 10th row</span></button>
        <button class="btn" onClick={clear}><span class="btn-text">Clear</span></button>
        <button class="btn" onClick={stormUpdate}><span class="btn-text">Update storm</span></button>
        <button class="btn" onClick={stormSelect}><span class="btn-text">Select storm</span></button>
      </div>
      <div class="rows">
        {rows.map((row) => (
          <Row
            key={row.id}
            row={row}
            isSelected={selected === row.id}
            onSelect={select}
            onRemove={remove}
          />
        ))}
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));
