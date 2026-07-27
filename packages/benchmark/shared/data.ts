// Ported verbatim from vuejs/core packages-private/benchmark/client/data.ts
// (only formatting adjusted). Labels are shallowRefs so the `update`
// operation can mutate a row label without replacing the rows array.
import { shallowRef } from 'vue';
import type { ShallowRef } from 'vue';

let ID = 1;

function _random(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

export interface RowData {
  id: number;
  label: ShallowRef<string>;
}

const adjectives = [
  'pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome',
  'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful',
  'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive',
  'cheap', 'expensive', 'fancy',
];
const colours = [
  'red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown',
  'white', 'black', 'orange',
];
const nouns = [
  'table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie',
  'sandwich', 'burger', 'pizza', 'mouse', 'keyboard',
];

/**
 * Deterministic variant used by the mount-create ladder (`BENCH_AUTOROWS`).
 * That workload renders rows during the FIRST screen, which under IFR means
 * the main thread and the background thread each build the data themselves —
 * `Math.random()` would hand them different labels and turn every row into a
 * hydration mismatch. Index-derived labels keep both threads in agreement
 * while preserving the label length distribution.
 */
export function buildDataSeeded(count = 1000): RowData[] {
  const data: RowData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: ID++,
      label: shallowRef(
        adjectives[i % adjectives.length]
          + ' '
          + colours[(i * 7) % colours.length]
          + ' '
          + nouns[(i * 13) % nouns.length],
      ),
    });
  }
  return data;
}

export function buildData(count = 1000): RowData[] {
  const data: RowData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: ID++,
      label: shallowRef(
        adjectives[_random(adjectives.length)]
          + ' '
          + colours[_random(colours.length)]
          + ' '
          + nouns[_random(nouns.length)],
      ),
    });
  }
  return data;
}
