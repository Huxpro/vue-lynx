import { beforeEach, describe, expect, it } from 'vitest';

import { nextTick, ref, resetForTesting } from 'vue-lynx';
import { OP, OP_ARITY } from 'vue-lynx/internal/ops';
import {
  child,
  createFor,
  createIf,
  createVaporApp,
  defineVaporComponent,
  next,
  on,
  renderEffect,
  setInsertionState,
  setText,
  template,
  txt,
  useMainThreadRef,
} from 'vue-lynx/vapor';
import { collectFlushedOps, resetCapturedOps } from '../local-test-setup.js';
import { decodeOps, opsOf } from './ops-test-utils.js';
import type { DecodedOp } from './ops-test-utils.js';

type El = any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface LynxStub {
  getCoreContext?: () => {
    addEventListener: (name: string, listener: (event: unknown) => void) => void;
  };
}

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();

  // Main-thread props register their worklet context on BG. The local Vapor
  // fixture only needs the registration surface; dispatch is covered by the
  // dedicated worklet tests.
  (globalThis as { lynx: LynxStub }).lynx.getCoreContext = () => ({
    addEventListener: () => {},
  });
});

async function renderRepresentativeApp(): Promise<DecodedOp[]> {
  resetForTesting();
  resetCapturedOps();

  // Compiled-output style: a static root with two block anchors and a folded
  // only-child text placeholder, plus one reused branch/item template.
  const tRoot = template('<view><text> </text><!><!></view>', 1);
  const tItem = template('<text> ', 0, 1);
  const show = ref(true);
  const items = ref(['a', 'b']);

  const App = defineVaporComponent(() => {
    const mtRef = useMainThreadRef(null);
    const root: El = tRoot();
    const label: El = child(root);
    const labelText: El = txt(label);
    const ifAnchor: El = next(label, 1);
    const forAnchor: El = next(ifAnchor, 1);

    renderEffect(() => setText(labelText, 'ready'));
    on(root, 'tap', () => {});
    root.setAttribute('main-thread-ref', mtRef);
    root.setAttribute('main-thread-bindtap', {
      _wkltId: 'vapor-ifr-determinism',
    });

    setInsertionState(root, ifAnchor, 1);
    createIf(
      () => show.value,
      () => {
        const branch: El = tItem();
        setText(txt(branch), 'shown');
        return branch;
      },
      null,
      33,
    );

    setInsertionState(root, forAnchor, 1);
    createFor(
      () => items.value,
      (item: { value: unknown }) => {
        const row: El = tItem();
        renderEffect(() => setText(txt(row), String(item.value)));
        return row;
      },
      (item: unknown) => item,
      8,
    );

    return root;
  });

  createVaporApp(App).mount();
  await nextTick();
  return decodeOps(collectFlushedOps());
}

describe('Vapor IFR deterministic replay invariant', () => {
  it('defines a wire arity for every active opcode', () => {
    expect(Object.values(OP).map((op) => OP_ARITY[op])).not.toContain(
      undefined,
    );
  });

  it('emits byte-for-byte identical initial frames from fresh realms', async () => {
    const first = await renderRepresentativeApp();
    const second = await renderRepresentativeApp();

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));

    const registrations = opsOf(first, OP.REGISTER_TREE);
    expect(registrations.map((entry) => entry.args[0])).toEqual([1, 2]);

    const rootStructure = registrations[0]!.args[1] as [
      string,
      unknown,
      Array<[string, unknown, unknown[]]>,
    ];
    expect(rootStructure[2].map((node) => node[0])).toEqual([
      'text',
      '#comment',
      '#comment',
    ]);
    expect(rootStructure[2][0]![2]).toEqual([]);

    const clones = opsOf(first, OP.CLONE_TREE);
    expect(clones.map((entry) => entry.args[0])).toEqual([1, 2, 2, 2]);
    expect(clones.map((entry) => entry.args[1])).toEqual(
      [...clones.map((entry) => entry.args[1])].sort((a, b) =>
        Number(a) - Number(b)
      ),
    );

    expect(opsOf(first, OP.SET_EVENT)[0]?.args[3]).toBe('vue:0');
    expect(opsOf(first, OP.INIT_MT_REF)[0]?.args).toEqual([1, null]);
    expect(opsOf(first, OP.SET_MT_REF)[0]?.args[1]).toMatchObject({
      _wvid: 1,
      _initValue: null,
    });
    expect(opsOf(first, OP.SET_WORKLET_EVENT)[0]?.args[3]).toMatchObject({
      _wkltId: 'vapor-ifr-determinism',
      _execId: 1,
    });
  });
});
