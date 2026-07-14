/**
 * Main Thread REGISTER_TEMPLATE / CLONE_TEMPLATE tests, running against the
 * real ops-apply + jsdom PAPI pipeline.
 *
 * The uid contract under test: instantiation assigns ids by pre-order
 * traversal of the registered structure starting at baseUid, matching the
 * contiguous block the BG thread reserves for its shadow clone.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
// Same-process module state as the pipeline set up by runtime-dom-setup.ts.
import { applyOps, elements } from '../../../vue-lynx/main-thread/src/ops-apply.js';

let nextId = 200000; // far above ids used by other suites in this worker

let ROOT = 0;
beforeEach(() => {
  ROOT = nextId++;
  applyOps([OP.CREATE, ROOT, 'view']);
});

// <view class=row style=…><text class=cell>(text folded: "hi")</text><!></view>
const TPL_ID_BASE = 900000;
let nextTplId = TPL_ID_BASE;

function structure() {
  return [
    'view',
    { c: 'row', s: { height: '18px' }, a: [['custom', 'x']] },
    [
      ['text', { c: 'cell', t: 'hi' }, []],
      ['#comment', 0, []],
    ],
  ];
}

describe('MT template instantiation', () => {
  it('instantiates a registered template with pre-order uids', () => {
    const tplId = nextTplId++;
    const base = nextId;
    nextId += 3;

    applyOps([
      OP.REGISTER_TEMPLATE, tplId, structure(),
      OP.CLONE_TEMPLATE, tplId, base,
      OP.INSERT, ROOT, base, -1,
    ]);

    const rootEl = elements.get(base) as Element;
    const cellEl = elements.get(base + 1) as Element;
    const anchorEl = elements.get(base + 2);
    expect(rootEl).toBeTruthy();
    expect(cellEl).toBeTruthy();
    expect(anchorEl).toBeTruthy();

    // structure applied: class, attrs, folded text, child order
    expect(rootEl.getAttribute('class')).toBe('row');
    expect(rootEl.getAttribute('custom')).toBe('x');
    expect(cellEl.getAttribute('class')).toBe('cell');
    expect(cellEl.textContent).toBe('hi');
    expect((anchorEl as HTMLElement).style.display).toBe('none');
    // instantiated subtree is attached under the root insert
    const container = elements.get(ROOT) as Element;
    expect(container.contains(rootEl)).toBe(true);
    expect(rootEl.contains(cellEl)).toBe(true);
  });

  it('keeps standalone comment anchors out of flex layout', () => {
    const anchorId = nextId++;
    applyOps([
      OP.CREATE, anchorId, '__comment',
      OP.INSERT, ROOT, anchorId, -1,
    ]);

    expect((elements.get(anchorId) as HTMLElement).style.display).toBe('none');
  });

  it('keeps empty text anchors out of flex layout', () => {
    const anchorId = nextId++;
    applyOps([
      OP.CREATE_TEXT, anchorId,
      OP.INSERT, ROOT, anchorId, -1,
    ]);

    expect((elements.get(anchorId) as HTMLElement).style.display).toBe('none');
  });

  it('clones the same template repeatedly with independent uid blocks', () => {
    const tplId = nextTplId++;
    const base1 = nextId;
    nextId += 3;
    const base2 = nextId;
    nextId += 3;

    applyOps([
      OP.REGISTER_TEMPLATE, tplId, structure(),
      OP.CLONE_TEMPLATE, tplId, base1,
      OP.INSERT, ROOT, base1, -1,
      OP.CLONE_TEMPLATE, tplId, base2,
      OP.INSERT, ROOT, base2, -1,
    ]);

    expect(elements.get(base1)).toBeTruthy();
    expect(elements.get(base2)).toBeTruthy();
    expect(elements.get(base1)).not.toBe(elements.get(base2));

    // dynamic ops target instance uids independently
    applyOps([OP.SET_TEXT, base1 + 1, 'one', OP.SET_TEXT, base2 + 1, 'two']);
    expect((elements.get(base1 + 1) as Element).textContent).toBe('one');
    expect((elements.get(base2 + 1) as Element).textContent).toBe('two');
  });

  it('releases instantiated subtrees through the registry cleanup', () => {
    const tplId = nextTplId++;
    const base = nextId;
    nextId += 3;

    applyOps([
      OP.REGISTER_TEMPLATE, tplId, structure(),
      OP.CLONE_TEMPLATE, tplId, base,
      OP.INSERT, ROOT, base, -1,
    ]);
    expect(elements.has(base + 1)).toBe(true);

    applyOps([OP.REMOVE, ROOT, base]);
    expect(elements.has(base)).toBe(false);
    expect(elements.has(base + 1)).toBe(false);
    expect(elements.has(base + 2)).toBe(false);
  });
});
