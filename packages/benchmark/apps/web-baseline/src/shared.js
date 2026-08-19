// Shared data + storm driver for the plain-DOM baseline apps.
// Mirrors packages/benchmark/apps/ui-react/src/data.ts and the Lynx apps'
// storm semantics exactly.
let ID = 1;

function _random(max) {
  return Math.round(Math.random() * 1000) % max;
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

export function buildData(count = 1000) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: ID++,
      label: adjectives[_random(adjectives.length)]
        + ' '
        + colours[_random(colours.length)]
        + ' '
        + nouns[_random(nouns.length)],
    });
  }
  return data;
}

// Vue-style rows (labels as refs) for the vdom/vapor apps — built lazily so
// preact bundles don't pull vue.
export function makeVueBuildData(shallowRef) {
  return function buildDataVue(count = 1000) {
    const data = [];
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
  };
}

export const STORM_UPDATE_TICKS = 50;
export const STORM_SELECT_TICKS = 30;

const _stormChannel = new MessageChannel();
let _stormPending = null;
_stormChannel.port1.onmessage = () => {
  const cb = _stormPending;
  _stormPending = null;
  if (cb) cb();
};
export function nextMacrotask(cb) {
  _stormPending = cb;
  _stormChannel.port2.postMessage(0);
}

export function runStorm(ticks, step) {
  let t = 0;
  const tick = () => {
    t += 1;
    step(t);
    if (t < ticks) nextMacrotask(tick);
  };
  nextMacrotask(tick);
}

export const SIZES = [
  ['Create 1,000 rows', 1000],
  ['Create 3,000 rows', 3000],
  ['Create 5,000 rows', 5000],
  ['Create 10,000 rows', 10000],
  ['Create 20,000 rows', 20000],
  ['Create 30,000 rows', 30000],
];
