/**
 * Main Thread REGISTER_TREE / CLONE_TREE tests, running against the
 * real ops-apply + jsdom PAPI pipeline.
 *
 * The uid contract under test: instantiation assigns ids by pre-order
 * traversal of the registered structure starting at baseUid, matching the
 * contiguous block the BG thread reserves for its shadow clone.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
// Same-process module state as the pipeline set up by runtime-dom-setup.ts.
import { bakeSparseTreeCreate } from '../../../vue-lynx/main-thread/src/bake-tree-create.js';
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
      OP.REGISTER_TREE, tplId, structure(),
      OP.CLONE_TREE, tplId, base,
      OP.INSERT, ROOT, base, -1,
    ]);

    const rootEl = elements.get(base) as Element;
    const cellEl = elements.get(base + 1) as Element;
    expect(rootEl).toBeTruthy();
    expect(cellEl).toBeTruthy();

    // Comment anchors are BG-only: the uid is consumed by the pre-order
    // walk but no Main Thread element is created for it.
    expect(elements.has(base + 2)).toBe(false);

    // structure applied: class, attrs, folded text, child order
    expect(rootEl.getAttribute('class')).toBe('row');
    expect(rootEl.getAttribute('custom')).toBe('x');
    expect(cellEl.getAttribute('class')).toBe('cell');
    expect(cellEl.textContent).toBe('hi');
    // instantiated subtree is attached under the root insert
    const container = elements.get(ROOT) as Element;
    expect(container.contains(rootEl)).toBe(true);
    expect(rootEl.contains(cellEl)).toBe(true);
    // no hidden anchor element pads the child list
    expect(rootEl.childNodes).toHaveLength(1);
  });

  it('keeps template #text/#comment anchors off the Main Thread', () => {
    const tplId = nextTplId++;
    const base = nextId;
    nextId += 4;

    // <view><!>(empty #text)<text …>hi</text></view> — anchors first, so the
    // materialized child would misplace if their uids were not consumed.
    applyOps([
      OP.REGISTER_TREE, tplId, [
        'view',
        0,
        [
          ['#comment', 0, []],
          ['#text', 0, []],
          ['text', { t: 'hi' }, []],
        ],
      ],
      OP.CLONE_TREE, tplId, base,
      OP.INSERT, ROOT, base, -1,
    ]);

    expect(elements.has(base + 1)).toBe(false); // comment anchor
    expect(elements.has(base + 2)).toBe(false); // empty text anchor
    const textEl = elements.get(base + 3) as Element;
    expect(textEl).toBeTruthy();
    expect(textEl.textContent).toBe('hi');
    expect((elements.get(base) as Element).childNodes).toHaveLength(1);
  });

  it('clones the same template repeatedly with independent uid blocks', () => {
    const tplId = nextTplId++;
    const base1 = nextId;
    nextId += 3;
    const base2 = nextId;
    nextId += 3;

    applyOps([
      OP.REGISTER_TREE, tplId, structure(),
      OP.CLONE_TREE, tplId, base1,
      OP.INSERT, ROOT, base1, -1,
      OP.CLONE_TREE, tplId, base2,
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
      OP.REGISTER_TREE, tplId, structure(),
      OP.CLONE_TREE, tplId, base,
      OP.INSERT, ROOT, base, -1,
    ]);
    expect(elements.has(base + 1)).toBe(true);

    applyOps([OP.REMOVE, ROOT, base]);
    expect(elements.has(base)).toBe(false);
    expect(elements.has(base + 1)).toBe(false);
  });
});

describe('sparse bake (IFR-discard hole naming)', () => {
  it('names only root + holes; interiors stay write-only', () => {
    // Preorder: 0 view.card, 1 text.title (hole), 2 view.badge (static), 3 text.badge-label (hole)
    const structure = [
      'view',
      { c: 'card' },
      [
        ['text', { c: 'title', t: ' ' }, []],
        [
          'view',
          { c: 'badge' },
          [['text', { t: ' ' }, []]],
        ],
      ],
    ] as const;

    const create = bakeSparseTreeCreate(structure as never, [1, 3]);
    const scratch = new Map<number, LynxElement>();
    const baseUid = 5000;
    const { handles, namedSlots, stack } = create(1, baseUid, {
      elements: scratch,
      installSelectorAttribute() {},
    });

    expect(namedSlots).toEqual([0, 1, 3]);
    expect(handles).toHaveLength(3);
    expect(stack).toHaveLength(4);
    // Only named slots landed in the map — slot 2 (static badge view) did not.
    expect(scratch.has(baseUid + 0)).toBe(true);
    expect(scratch.has(baseUid + 1)).toBe(true);
    expect(scratch.has(baseUid + 2)).toBe(false);
    expect(scratch.has(baseUid + 3)).toBe(true);
    // Full stack retained for densify remapping (including unnamed interior).
    expect(stack[2]).toBeTruthy();

    const [root, title, badgeLabel] = handles as Element[];
    expect(root.getAttribute('class')).toBe('card');
    // Static interior still exists in the native tree (append happened) even
    // though it has no protocol name — the IFR-discard model.
    expect(root.childNodes.length).toBeGreaterThanOrEqual(1);
    expect(title).toBeTruthy();
    expect(badgeLabel).toBeTruthy();

    // Write-only hole updates — no dense uid arithmetic required.
    __SetAttribute(title, 'text', 'Hello');
    __SetAttribute(badgeLabel, 'text', 'NEW');
    expect(title.textContent).toBe('Hello');
    expect(badgeLabel.textContent).toBe('NEW');
  });

  it('rejects hole slots outside the preorder range', () => {
    expect(() => bakeSparseTreeCreate(['view', 0, []] as never, [1])).toThrow(
      /out of range/,
    );
  });
});
