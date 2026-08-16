// Ported verbatim from vuejs/core packages-private/benchmark/client/data.ts
// (only formatting adjusted). Labels are shallowRefs so the `update`
// operation can mutate a row label without replacing the rows array.
import { shallowRef } from 'vue';
import type { ShallowRef } from 'vue';

let ID = 1;

function _random(max: number, random = Math.random): number {
  return Math.round(random() * 1000) % max;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
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

function buildDataWithRandom(count: number, random: () => number): RowData[] {
  const data: RowData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: ID++,
      label: shallowRef(
        adjectives[_random(adjectives.length, random)]
          + ' '
          + colours[_random(colours.length, random)]
          + ' '
          + nouns[_random(nouns.length, random)],
      ),
    });
  }
  return data;
}

export function buildData(count = 1000): RowData[] {
  return buildDataWithRandom(count, Math.random);
}

/** Deterministic rows for comparing pre-populated startup bundles. */
export function buildDataSeeded(count: number, seed: number): RowData[] {
  return buildDataWithRandom(count, seededRandom(seed));
}
