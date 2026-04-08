import { useState } from '@lynx-js/react';
import './styles.css';

const COLORS = ['#c62828', '#1565c0', '#2e7d32'] as const;
// Border colors to confirm state updates independently of CSS var inheritance
const BORDERS = ['#ef9a9a', '#90caf9', '#a5d6a7'] as const;

export default function CSSInheritanceTest() {
  const [idx, setIdx] = useState(0);
  const color = COLORS[idx]!;
  const border = BORDERS[idx]!;

  return (
    <view style={{ backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
      <text style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px', color: '#333' }}>
        enableCSSInheritance — CSS var propagation (React)
      </text>
      <text style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>
        Parent sets --test-color via style. Children consume via var() in class rules.
        Border changes = state works. Text color changing = CSS inheritance works.
      </text>

      {/* Parent sets the CSS var via style only. Border is a direct style to confirm state updates. */}
      <view style={{ ['--test-color' as string]: color, padding: '10px', borderRadius: '6px', backgroundColor: '#fff', borderWidth: '2px', borderStyle: 'solid', borderColor: border }}>
        <text style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>
          {`Parent border = ${border} (direct style — proves state works)`}
        </text>

        {/* Same element as the var setter — no inheritance needed. If this fails, the var isn't being set. */}
        <text style={{ ['color' as string]: 'var(--test-color)', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
          Same element inline var() — should work if var is set (no inheritance)
        </text>

        {/* Depth 1 child */}
        <view style={{ marginBottom: '4px' }}>
          <text className="inherited-color" style={{ fontWeight: 'bold' }}>
            Depth 1 — color: var(--test-color)
          </text>
        </view>

        {/* Depth 2 child */}
        <view>
          <view>
            <text className="inherited-color" style={{ fontWeight: 'bold' }}>
              Depth 2 — color: var(--test-color)
            </text>
          </view>
        </view>
      </view>

      <text
        style={{
          marginTop: '10px',
          backgroundColor: '#1565c0',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '11px',
        }}
        bindtap={() => setIdx((idx + 1) % COLORS.length)}
      >
        {`Cycle color (currently: ${color})`}
      </text>
    </view>
  );
}
