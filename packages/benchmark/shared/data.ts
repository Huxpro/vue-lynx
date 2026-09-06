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

// Deterministic mount data is evaluated independently by Lynx's main and
// background runtimes, so both first renders must receive byte-identical rows.
export function buildDataSeeded(count: number): RowData[] {
  let seed = 42 >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (max: number) => Math.round(random() * 1000) % max;
  const data: RowData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: ID++,
      label: shallowRef(
        adjectives[pick(adjectives.length)]
          + ' '
          + colours[pick(colours.length)]
          + ' '
          + nouns[pick(nouns.length)],
      ),
    });
  }
  return data;
}
