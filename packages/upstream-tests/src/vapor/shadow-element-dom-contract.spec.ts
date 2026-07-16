import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { nextTick, resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import {
  createVaporApp,
  defineVaporComponent,
  isProxy,
  reactive,
  ref,
  ShadowElement,
  template,
} from 'vue-lynx/vapor';
import { collectFlushedOps, resetCapturedOps } from '../local-test-setup.js';
import { decodeOps, opsOf } from './ops-test-utils.js';

let mountedApp: ReturnType<typeof createVaporApp> | undefined;

async function flushedOps() {
  await nextTick();
  return decodeOps(collectFlushedOps());
}

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

afterEach(() => {
  mountedApp?.unmount();
  mountedApp = undefined;
});

describe('ShadowElement DOM contracts', () => {
  it('retains its identity through deep reactive and ref conversion', () => {
    const element = new ShadowElement('view');

    const fromReactive = reactive({ element }).element;
    const fromRef = ref(element).value;

    expect(fromReactive).toBe(element);
    expect(fromRef).toBe(element);
    expect(isProxy(fromReactive)).toBe(false);
    expect(isProxy(fromRef)).toBe(false);
  });

  it('coerces CharacterData nodeValue and data writes to strings', async () => {
    const text = new ShadowElement('#text');
    const comment = new ShadowElement('#comment');

    (text as unknown as { nodeValue: unknown }).nodeValue = 42;
    (comment as unknown as { data: unknown }).data = false;

    expect(text.nodeValue).toBe('42');
    expect(comment.data).toBe('false');
    expect(opsOf(await flushedOps(), OP.SET_TEXT)).toContainEqual({
      op: OP.SET_TEXT,
      args: [text.uid, '42'],
    });
  });

  it('coerces aliased CharacterData before emitting its host text op', async () => {
    const create = template('<text>seed', 1);
    const host = create() as ShadowElement;
    const aliasedText = host.firstChild!;
    await flushedOps();

    (aliasedText as unknown as { data: unknown }).data = 7;

    expect(aliasedText.data).toBe('7');
    expect(opsOf(await flushedOps(), OP.SET_TEXT)).toEqual([
      { op: OP.SET_TEXT, args: [host.uid, '7'] },
    ]);
  });

  it('does not emit the raw Vapor mount marker on the page root', async () => {
    const create = template('<view>', 1);
    const App = defineVaporComponent(() => create());

    mountedApp = createVaporApp(App);
    mountedApp.mount();

    const pageRootOps = (await flushedOps()).filter(
      ({ op, args }) =>
        args[0] === 1 && (op === OP.SET_CLASS || op === OP.SET_PROP),
    );
    expect(pageRootOps).toEqual([]);
  });

  it('still turns scoped SFC data-v attributes into scope classes', async () => {
    const element = new ShadowElement('view');

    element.setAttribute('data-v-a1b2c3d4', '');

    expect(element._scopeClasses).toEqual(new Set(['data-v-a1b2c3d4']));
    expect(opsOf(await flushedOps(), OP.SET_CLASS)).toEqual([
      { op: OP.SET_CLASS, args: [element.uid, 'data-v-a1b2c3d4'] },
    ]);
  });
});
