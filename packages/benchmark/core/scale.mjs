// Unified scale axis — N measured in ELEMENTS, not rows or cards.
//
// The bug this fixes (design doc §4): ifr-bench's "1k…30k" ladder counts
// generated content CARDS (elements = 4 + cards*8, so "1k" ≈ 1004 elements),
// while packages/benchmark's storm ladder counts table ROWS (elements ≈
// chrome + rows*4, so "1k" ≈ 4028 elements). Both label the x-axis "1k→30k"
// but measure ~4× different element counts — any cross-system α comparison is
// wrong. Here N is always elements; each workload converts to its native
// count so different workloads land on the SAME element targets.

// -- per-workload element geometry -------------------------------------------

// krausest table row: <view.row> + <text.col-id> + <text.col-label>
// + <text.col-remove> = 4 Lynx elements. Chrome (page/title/toolbar of 12
// buttons/rows container) is a fixed prefix that does not scale with N.
export const TABLE_PER_ROW = 4;
export const TABLE_CHROME = 28;

// generated content card = <view.card> + <image> + <view.card-body> + 2 <text>
// + <view.card-footer> + 2 <text> = 8 elements. Chrome (feed/header/title/list)
// = 4. Matches sfc-probe/generate.mjs `elements = 4 + nCards*8`.
export const CONTENT_PER_CARD = 8;
export const CONTENT_CHROME = 4;

export function rowsForElements(nElements) {
  return Math.max(1, Math.round((nElements - TABLE_CHROME) / TABLE_PER_ROW));
}
export function elementsForRows(rows) {
  return TABLE_CHROME + rows * TABLE_PER_ROW;
}
export function cardsForElements(nElements) {
  return Math.max(1, Math.round((nElements - CONTENT_CHROME) / CONTENT_PER_CARD));
}
export function elementsForCards(cards) {
  return CONTENT_CHROME + cards * CONTENT_PER_CARD;
}

// -- canonical ladder (elements) ---------------------------------------------

// Powers-of-ten-ish rung targets in ELEMENTS, shared by every workload/env so
// series are directly comparable. Quick ladder for smoke runs; full for AT
// SCALE re-validation.
export const LADDER = [1000, 3000, 5000, 10000, 20000, 30000];
export const LADDER_QUICK = [1000, 5000];

/**
 * Resolve a ladder of element targets into concrete per-workload plans:
 *   [{ label, nElements, rows, cards, ... }]
 * `label` is the rung id ("1k".."30k"); `nElements` is the TARGET; `rows`/
 * `cards` are the native counts that hit it (their realized element counts are
 * elementsForRows(rows)/elementsForCards(cards), within rounding).
 */
export function resolveLadder(targets = LADDER) {
  return targets.map((nElements) => {
    const rows = rowsForElements(nElements);
    const cards = cardsForElements(nElements);
    return {
      label: rungLabel(nElements),
      nElements,
      rows,
      cards,
      rowsElements: elementsForRows(rows),
      cardsElements: elementsForCards(cards),
    };
  });
}

export function rungLabel(nElements) {
  if (nElements >= 1000 && nElements % 1000 === 0) return `${nElements / 1000}k`;
  if (nElements >= 1000) return `${(nElements / 1000).toFixed(1)}k`;
  return String(nElements);
}
