/**
 * Benchmark scenes. Each is parameterized by a size factor and provides
 * `makeData(n)` producing the dynamic values both threads would render from.
 *
 * Shapes are chosen to span the static/dynamic spectrum:
 *  - static-heavy: landing/skeleton screen, ~90% static nodes — route (a)'s
 *    best case
 *  - content: card feed with a dynamic title/class per card — the
 *    "skeleton + interleaved holes" shape where island hoisting is weak but
 *    block templates shine
 *  - item list: v-for-driven screen — per-item block instantiation
 */

import { el, list } from './scene.mjs';

function staticRow(i) {
  return el('view', { sprops: { class: `row row-${i % 4}` } }, [
    el('image', { sprops: { class: 'row-icon', src: 'asset://icon.png' } }),
    el('view', { sprops: { class: 'row-body' } }, [
      el('text', { sprops: { class: 'row-title' } }, [`Row title ${i % 7}`]),
      el('text', { sprops: { class: 'row-sub' } }, ['A static subtitle line']),
    ]),
    el('view', { sprops: { class: 'row-trailing' } }, [
      el('text', {}, ['›']),
    ]),
  ]);
}

export function staticHeavyScene(nRows) {
  const rows = [];
  for (let i = 0; i < nRows; i++) rows.push(staticRow(i));
  return {
    name: 'static-heavy',
    scene: el('view', { sprops: { class: 'page' } }, [
      el('view', { sprops: { class: 'hero' } }, [
        el('image', { sprops: { class: 'hero-img', src: 'asset://hero.png' } }),
        el('text', { sprops: { class: 'hero-title' } }, [{ bind: 'title' }]),
        el('text', { sprops: { class: 'hero-sub' } }, ['Welcome back']),
      ]),
      el('view', { sprops: { class: 'rows' }, on: { tap: 'onTap' } }, rows),
    ]),
    makeData: () => ({
      title: 'Instant First Frame',
      onTap: () => {},
    }),
  };
}

function card(i) {
  // Note: class is either fully static or fully dynamic per node — mixing
  // `class` + `:class` triggers Vue's class *merging*, which the lowered
  // variants would have to replicate; scenes avoid it for clean comparison.
  return el('view', { dprops: { class: `cardCls${i % 3}` } }, [
    el('image', { sprops: { class: 'card-icon', src: 'asset://c.png' } }),
    el('view', { sprops: { class: 'card-body' } }, [
      el('text', { sprops: { class: 'card-title' } }, [{ bind: `title${i % 5}` }]),
      el('text', { sprops: { class: 'card-desc' } }, ['Static description text for the card body']),
    ]),
    el('view', { sprops: { class: 'card-footer' } }, [
      el('text', { sprops: { class: 'card-meta' } }, [{ bind: `meta${i % 5}` }]),
      el('text', { sprops: { class: 'card-cta' } }, ['Open']),
    ]),
  ]);
}

export function contentScene(nCards) {
  const cards = [];
  for (let i = 0; i < nCards; i++) cards.push(card(i));
  return {
    name: 'content',
    scene: el('view', { sprops: { class: 'feed' }, on: { tap: 'onTap' } }, [
      el('view', { sprops: { class: 'feed-header' } }, [
        el('text', { sprops: { class: 'feed-title' } }, [{ bind: 'feedTitle' }]),
      ]),
      el('view', { sprops: { class: 'feed-list' } }, cards),
    ]),
    makeData: () => {
      const d = { feedTitle: 'Today', onTap: () => {} };
      for (let k = 0; k < 5; k++) {
        d[`title${k}`] = `Card title ${k}`;
        d[`meta${k}`] = `meta-${k}`;
      }
      for (let k = 0; k < 3; k++) d[`cardCls${k}`] = `card variant-${k}`;
      return d;
    },
  };
}

export function listScene(nItems) {
  return {
    name: 'list',
    scene: el('view', { sprops: { class: 'screen' } }, [
      el('view', { sprops: { class: 'list-header' } }, [
        el('text', { sprops: { class: 'list-title' } }, [{ bind: 'heading' }]),
      ]),
      el('view', { sprops: { class: 'list-body' } }, [
        list('items', 'id', el('view', { dpropsItem: { class: 'cls' } }, [
          el('image', { sprops: { class: 'item-icon', src: 'asset://i.png' } }),
          el('text', { sprops: { class: 'item-label' } }, [{ item: 'label' }]),
          el('text', { sprops: { class: 'item-badge' } }, [{ item: 'badge' }]),
        ])),
      ]),
    ]),
    makeData: (n) => ({
      heading: `Inbox (${n})`,
      items: Array.from({ length: n }, (_, i) => ({
        id: i,
        label: `Item ${i}`,
        badge: i % 3 === 0 ? 'new' : '',
        cls: `item item-${i % 4}`,
      })),
    }),
  };
}

/** scene set used by harness + correctness */
export function allScenes(size) {
  return [
    { ...staticHeavyScene(size.rows), sizeArg: size.rows },
    { ...contentScene(size.cards), sizeArg: size.cards },
    { ...listScene(size.items), sizeArg: size.items },
  ];
}

export const SIZES = {
  small: { rows: 40, cards: 25, items: 40 },
  large: { rows: 200, cards: 125, items: 200 },
};
