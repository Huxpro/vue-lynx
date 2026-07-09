/**
 * Vapor runtime tests — exercise @vue/runtime-vapor running against the
 * ShadowElement tree + ops pipeline through the vue-lynx DOM-compat layer.
 *
 * The component bodies below are written in compiled-output style: they call
 * the same helpers (`template`, `child`, `txt`, `renderEffect`, `setText`,
 * `on`, `createIf`, `createFor`, `createComponent`, …) with the same shapes
 * that `@vue/compiler-vapor` emits for the equivalent SFC templates.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { nextTick, ref, resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import {
  applyTextModel,
  child,
  createComponent,
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
  withVaporModifiers,
} from 'vue-lynx/vapor';
import { publishEvent } from '../../../vue-lynx/runtime/src/event-registry.js';
import { collectFlushedOps, resetCapturedOps } from '../local-test-setup.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Arity (argument count) of each op code in the flat ops buffer. */
const OP_ARITY: Record<number, number> = {
  [OP.CREATE]: 2,
  [OP.CREATE_TEXT]: 1,
  [OP.INSERT]: 3,
  [OP.REMOVE]: 2,
  [OP.SET_PROP]: 3,
  [OP.SET_TEXT]: 2,
  [OP.SET_EVENT]: 4,
  [OP.REMOVE_EVENT]: 3,
  [OP.SET_STYLE]: 2,
  [OP.SET_CLASS]: 2,
  [OP.SET_ID]: 2,
  [OP.SET_WORKLET_EVENT]: 4,
  [OP.SET_MT_REF]: 2,
  [OP.INIT_MT_REF]: 2,
  [OP.SET_SCOPE_ID]: 2,
};

interface DecodedOp {
  op: number;
  args: unknown[];
}

/** Decode the flat ops buffer into { op, args } records. */
function decodeOps(ops: unknown[]): DecodedOp[] {
  const out: DecodedOp[] = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i] as number;
    const arity = OP_ARITY[op];
    if (arity === undefined) {
      throw new Error(`Unknown op code ${String(ops[i])} at index ${i}`);
    }
    out.push({ op, args: ops.slice(i + 1, i + 1 + arity) });
    i += 1 + arity;
  }
  return out;
}

function opsOf(decoded: DecodedOp[], op: number): DecodedOp[] {
  return decoded.filter((entry) => entry.op === op);
}

async function flushedOps(): Promise<DecodedOp[]> {
  await nextTick();
  return decodeOps(collectFlushedOps());
}

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = any;

// ---------------------------------------------------------------------------
// Mount + text interpolation + events (counter)
// ---------------------------------------------------------------------------

describe('vapor: counter (mount, interpolation, events)', () => {
  function mountCounter() {
    const count = ref(0);
    // <view class=container><text> </text></view> with @tap on <text>
    const t0 = template('<view class=container><text> ', 1);

    const App = defineVaporComponent(() => {
      const n2: El = t0();
      const n1: El = child(n2);
      const x1: El = txt(n1);
      renderEffect(() => setText(x1, `Count: ${count.value}`));
      on(n1, 'tap', () => count.value++);
      return n2;
    });

    const app = createVaporApp(App);
    app.mount();
    return { app, count };
  }

  it('mounts and emits CREATE/SET/INSERT/SET_EVENT ops', async () => {
    mountCounter();
    const decoded = await flushedOps();

    const creates = opsOf(decoded, OP.CREATE);
    expect(creates.map((c) => c.args[1])).toContain('view');
    expect(creates.map((c) => c.args[1])).toContain('text');

    // class=container from the template survived cloning
    const classes = opsOf(decoded, OP.SET_CLASS);
    expect(classes.some((c) => c.args[1] === 'container')).toBe(true);

    // interpolated text
    const texts = opsOf(decoded, OP.SET_TEXT);
    expect(texts.some((t) => t.args[1] === 'Count: 0')).toBe(true);

    // @tap registered as bindEvent
    const events = opsOf(decoded, OP.SET_EVENT);
    expect(events).toHaveLength(1);
    expect(events[0]!.args[1]).toBe('bindEvent');
    expect(events[0]!.args[2]).toBe('tap');

    // mounted onto the page root (uid 1)
    const inserts = opsOf(decoded, OP.INSERT);
    expect(inserts.some((i) => i.args[0] === 1)).toBe(true);
  });

  it('updates text reactively', async () => {
    const { count } = mountCounter();
    await flushedOps(); // drain mount ops

    count.value = 5;
    const decoded = await flushedOps();
    const texts = opsOf(decoded, OP.SET_TEXT);
    expect(texts.some((t) => t.args[1] === 'Count: 5')).toBe(true);
  });

  it('dispatches Lynx events to the handler through the sign registry', async () => {
    const { count } = mountCounter();
    const decoded = await flushedOps();
    const sign = opsOf(decoded, OP.SET_EVENT)[0]!.args[3] as string;

    publishEvent(sign, {});
    expect(count.value).toBe(1);

    const updates = await flushedOps();
    expect(opsOf(updates, OP.SET_TEXT).some((t) => t.args[1] === 'Count: 1'))
      .toBe(true);
  });

  it('registers .stop handlers as catchEvent', async () => {
    const t0 = template('<view>', 1);
    const spy = vi.fn();
    const App = defineVaporComponent(() => {
      const n0: El = t0();
      on(n0, 'tap', withVaporModifiers(spy, ['stop'])!);
      return n0;
    });
    createVaporApp(App).mount();

    const decoded = await flushedOps();
    const events = opsOf(decoded, OP.SET_EVENT);
    expect(events).toHaveLength(1);
    expect(events[0]!.args[1]).toBe('catchEvent');

    publishEvent(events[0]!.args[3] as string, {});
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// v-if (createIf + DynamicFragment)
// ---------------------------------------------------------------------------

describe('vapor: v-if', () => {
  it('mounts, toggles, and removes branches', async () => {
    const show = ref(false);
    const tIf = template('<text>shown', 2, 1);
    const tRoot = template('<view><!></view>', 1);

    const App = defineVaporComponent(() => {
      const n2: El = tRoot();
      const anchor: El = child(n2);
      setInsertionState(n2, anchor, 1);
      createIf(() => show.value, () => tIf(), null, 33);
      return n2;
    });
    createVaporApp(App).mount();

    let decoded = await flushedOps();
    // branch is off: no <text> created yet
    expect(
      opsOf(decoded, OP.CREATE).some((c) => c.args[1] === 'text'),
    ).toBe(false);

    show.value = true;
    decoded = await flushedOps();
    const created = opsOf(decoded, OP.CREATE).filter((c) => c.args[1] === 'text');
    expect(created).toHaveLength(1);
    const textUid = created[0]!.args[0];
    // The text content lives in the cloned #text child node.
    expect(
      opsOf(decoded, OP.SET_TEXT).some((t) => t.args[1] === 'shown'),
    ).toBe(true);
    expect(
      opsOf(decoded, OP.INSERT).some((i) => i.args[1] === textUid),
    ).toBe(true);

    show.value = false;
    decoded = await flushedOps();
    expect(
      opsOf(decoded, OP.REMOVE).some((r) => r.args[1] === textUid),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// v-for (createFor)
// ---------------------------------------------------------------------------

describe('vapor: v-for', () => {
  it('renders, appends, and removes keyed items', async () => {
    const items = ref(['a', 'b']);
    const tItem = template('<text> ', 0, 1);
    const tRoot = template('<view>', 1);

    const App = defineVaporComponent(() => {
      const n1: El = tRoot();
      setInsertionState(n1, null, 0);
      createFor(
        () => items.value,
        (item: { value: unknown }) => {
          const n0: El = tItem();
          const x0: El = txt(n0);
          renderEffect(() => setText(x0, String(item.value)));
          return n0;
        },
        (item: unknown) => item,
        8, /* IS_SINGLE_NODE */
      );
      return n1;
    });
    createVaporApp(App).mount();

    let decoded = await flushedOps();
    let setTexts = opsOf(decoded, OP.SET_TEXT).map((t) => t.args[1]);
    expect(setTexts).toContain('a');
    expect(setTexts).toContain('b');

    items.value = [...items.value, 'c'];
    decoded = await flushedOps();
    setTexts = opsOf(decoded, OP.SET_TEXT).map((t) => t.args[1]);
    expect(setTexts).toContain('c');

    items.value = items.value.filter((i) => i !== 'b');
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.REMOVE).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Components (createComponent, props, slots)
// ---------------------------------------------------------------------------

describe('vapor: components', () => {
  it('mounts child components with reactive props', async () => {
    const msg = ref('hello');
    const tChild = template('<text> ', 1);
    const tRoot = template('<view>', 1);

    const Child = defineVaporComponent({
      props: { msg: { type: String, required: true } },
      setup(props: { msg: string }) {
        const n0: El = tChild();
        const x0: El = txt(n0);
        renderEffect(() => setText(x0, props.msg));
        return n0;
      },
    });

    const App = defineVaporComponent(() => {
      const n1: El = tRoot();
      setInsertionState(n1, null, 0);
      createComponent(Child as El, { msg: () => msg.value }, null, true);
      return n1;
    });
    createVaporApp(App).mount();

    let decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_TEXT).some((t) => t.args[1] === 'hello'))
      .toBe(true);

    msg.value = 'world';
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_TEXT).some((t) => t.args[1] === 'world'))
      .toBe(true);
  });

  it('applies fallthrough class attrs onto the child root', async () => {
    const tChild = template('<view class=inner>', 1);
    const tRoot = template('<view>', 1);

    const Child = defineVaporComponent(() => tChild() as El);

    const App = defineVaporComponent(() => {
      const n1: El = tRoot();
      setInsertionState(n1, null, 0);
      createComponent(Child as El, { class: () => 'outer' }, null, true);
      return n1;
    });
    createVaporApp(App).mount();

    const decoded = await flushedOps();
    const classes = opsOf(decoded, OP.SET_CLASS).map((c) => c.args[1]);
    // fallthrough merges the template class and the parent-provided class
    expect(classes.some((c) => String(c).includes('inner') && String(c).includes('outer')))
      .toBe(true);
  });
});

// ---------------------------------------------------------------------------
// v-model (applyTextModel)
// ---------------------------------------------------------------------------

describe('vapor: v-model', () => {
  it('wires input events and pushes programmatic updates', async () => {
    const text = ref('start');
    const tRoot = template('<view><input></view>', 1);

    const App = defineVaporComponent(() => {
      const n1: El = tRoot();
      const input: El = child(n1);
      applyTextModel(
        input,
        () => text.value,
        (v: unknown) => {
          text.value = v as string;
        },
      );
      return n1;
    });
    createVaporApp(App).mount();

    let decoded = await flushedOps();
    const events = opsOf(decoded, OP.SET_EVENT);
    expect(events.some((e) => e.args[2] === 'input')).toBe(true);
    // initial value pushed to MT
    expect(
      opsOf(decoded, OP.SET_PROP).some(
        (p) => p.args[1] === 'value' && p.args[2] === 'start',
      ),
    ).toBe(true);

    // simulate typing on the Lynx side
    const sign = events.find((e) => e.args[2] === 'input')!.args[3] as string;
    publishEvent(sign, { detail: { value: 'typed' } });
    expect(text.value).toBe('typed');

    // the on-screen value is already 'typed' — no SET_PROP echo
    decoded = await flushedOps();
    expect(
      opsOf(decoded, OP.SET_PROP).some((p) => p.args[1] === 'value'),
    ).toBe(false);

    // programmatic change → SET_PROP
    text.value = 'reset';
    decoded = await flushedOps();
    expect(
      opsOf(decoded, OP.SET_PROP).some(
        (p) => p.args[1] === 'value' && p.args[2] === 'reset',
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Dynamic attributes / styles / sibling traversal
// ---------------------------------------------------------------------------

describe('vapor: attributes and traversal', () => {
  it('handles static template attrs, styles and next() traversal', async () => {
    const t0 = template(
      '<view class=a style=height:40px;><text>x</text><text>y</view>',
      1,
    );
    const App = defineVaporComponent(() => {
      const n2: El = t0();
      const first: El = child(n2);
      const second: El = next(first, 1);
      const xy: El = txt(second);
      renderEffect(() => setText(xy, 'Y!'));
      return n2;
    });
    createVaporApp(App).mount();

    const decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_CLASS).some((c) => c.args[1] === 'a')).toBe(true);
    expect(
      opsOf(decoded, OP.SET_STYLE).some(
        (s) => (s.args[1] as Record<string, unknown>).height === '40px',
      ),
    ).toBe(true);
    const texts = opsOf(decoded, OP.SET_TEXT).map((t) => t.args[1]);
    expect(texts).toContain('x');
    expect(texts).toContain('Y!');
  });

  it('unmounts cleanly', async () => {
    const t0 = template('<view><text>bye', 1);
    const App = defineVaporComponent(() => t0() as El);
    const app = createVaporApp(App);
    app.mount();
    const mountOps = await flushedOps();
    const viewUid = opsOf(mountOps, OP.CREATE)
      .find((c) => c.args[1] === 'view')!.args[0];

    app.unmount();
    const decoded = await flushedOps();
    expect(
      opsOf(decoded, OP.REMOVE).some((r) => r.args[1] === viewUid),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Template-clone text aliasing (creation-path ops optimization)
// ---------------------------------------------------------------------------

describe('vapor: only-child text aliasing', () => {
  it('does not materialize only-child #text nodes on the Main Thread', async () => {
    const t0 = template('<view class=a><text>hello </text><text> ', 1);
    const count = ref(1);
    const App = defineVaporComponent(() => {
      const n2: El = t0();
      const n0: El = child(n2);
      const n1: El = next(n0, 1);
      const x1: El = txt(n1);
      renderEffect(() => setText(x1, String(count.value)));
      return n2;
    });
    createVaporApp(App).mount();

    const decoded = await flushedOps();
    // No standalone text elements — text lives on the <text> hosts.
    expect(opsOf(decoded, OP.CREATE_TEXT)).toHaveLength(0);
    const textEls = opsOf(decoded, OP.CREATE)
      .filter((c) => c.args[1] === 'text')
      .map((c) => c.args[0]);
    expect(textEls).toHaveLength(2);
    const setTexts = opsOf(decoded, OP.SET_TEXT);
    // static text emitted on the host; dynamic placeholder skipped, then the
    // renderEffect writes the interpolated value onto the host uid
    expect(
      setTexts.some((t) => t.args[1] === 'hello ' && textEls.includes(t.args[0])),
    ).toBe(true);
    expect(
      setTexts.some((t) => t.args[1] === '1' && textEls.includes(t.args[0])),
    ).toBe(true);

    // updates keep routing to the host element
    count.value = 2;
    const updates = await flushedOps();
    expect(
      opsOf(updates, OP.SET_TEXT).some(
        (t) => t.args[1] === '2' && textEls.includes(t.args[0]),
      ),
    ).toBe(true);
  });

  it('lazily materializes the aliased text node on structural change', async () => {
    const t0 = template('<view><text>abc', 1);
    let host: El;
    const App = defineVaporComponent(() => {
      const n1: El = t0();
      host = child(n1);
      return n1;
    });
    createVaporApp(App).mount();
    const mountOps = await flushedOps();
    expect(opsOf(mountOps, OP.CREATE_TEXT)).toHaveLength(0);
    const hostUid = host!.uid;

    // Appending a sibling into the host forces materialization: the aliased
    // #text becomes a real MT text node and the host text is cleared.
    const extra: El = (globalThis as El).document.createTextNode('!');
    host!.appendChild(extra);
    const decoded = await flushedOps();
    const createTexts = opsOf(decoded, OP.CREATE_TEXT).map((c) => c.args[0]);
    expect(createTexts).toHaveLength(2); // materialized 'abc' + new '!'
    expect(
      opsOf(decoded, OP.SET_TEXT).some(
        (t) => t.args[0] === hostUid && t.args[1] === '',
      ),
    ).toBe(true);
    expect(
      opsOf(decoded, OP.SET_TEXT).some((t) => t.args[1] === 'abc'),
    ).toBe(true);
    const inserts = opsOf(decoded, OP.INSERT);
    expect(inserts.filter((i) => i.args[0] === hostUid)).toHaveLength(2);
  });
});
