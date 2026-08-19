import { compile } from '@vue/compiler-dom';
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  nodeOps,
  popScopeId,
  pushScopeId,
  ref,
  resetForTesting,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';

import { collectFlushedOps, resetCapturedOps } from './local-test-setup.js';
import { vueLynxCompilerOptions } from '../../vue-lynx/plugin/src/compiler-options.js';

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

function findOps(
  ops: unknown[],
  code: (typeof OP)[keyof typeof OP],
  width: number,
): unknown[][] {
  const matches: unknown[][] = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === code) {
      matches.push(ops.slice(i, i + width));
      i += width - 1;
    }
  }
  return matches;
}

describe('explicit <page> root', () => {
  it('reuses root id=1 instead of creating a second native page', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const App = defineComponent({
      setup() {
        return () =>
          h(
            'page',
            {
              class: 'app-root',
              style: { backgroundColor: 'white' },
            },
            [h('view', { id: 'content' })],
          );
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    const ops = collectFlushedOps();
    const createOps = findOps(ops, OP.CREATE, 3);

    expect(createOps).not.toContainEqual([OP.CREATE, expect.any(Number), 'page']);
    expect(findOps(ops, OP.SET_CLASS, 3)).toContainEqual([
      OP.SET_CLASS,
      1,
      'app-root',
    ]);
    expect(findOps(ops, OP.SET_STYLE, 3)).toContainEqual([
      OP.SET_STYLE,
      1,
      { backgroundColor: 'white' },
    ]);

    const viewCreate = createOps.find(op => op[2] === 'view');
    expect(viewCreate).toBeDefined();
    expect(findOps(ops, OP.INSERT, 4)).toContainEqual([
      OP.INSERT,
      1,
      viewCreate![1],
      -1,
    ]);
    expect(warn).not.toHaveBeenCalled();

    app.unmount();
    warn.mockRestore();
  });

  it('compiles <page> to the internal page component', () => {
    const result = compile(
      '<page class="app-root"><view /></page>',
      {
        mode: 'module',
        ...vueLynxCompilerOptions,
      },
    );

    expect(result.code).toContain('_resolveComponent("VueLynxPage")');
    expect(result.code).not.toContain('_createElementBlock("page"');
  });

  it('clears root attributes and events when the wrapper unmounts', async () => {
    const handler = () => {};
    const App = defineComponent({
      setup() {
        return () =>
          h('page', { class: 'mounted', onTap: handler }, [h('view')]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();
    collectFlushedOps();

    app.unmount();
    await nextTick();

    const ops = collectFlushedOps();
    expect(findOps(ops, OP.SET_CLASS, 3)).toContainEqual([
      OP.SET_CLASS,
      1,
      '',
    ]);
    expect(findOps(ops, OP.REMOVE_EVENT, 4)).toContainEqual([
      OP.REMOVE_EVENT,
      1,
      'bindEvent',
      'tap',
    ]);
  });

  it('updates and removes reactive root attributes', async () => {
    const rootClass = ref<string | undefined>('light');
    const rootStyle = ref<Record<string, unknown>>({
      backgroundColor: 'white',
    });
    const handler = ref<(() => void) | undefined>(() => {});
    const App = defineComponent({
      setup() {
        return () =>
          h('page', {
            class: rootClass.value,
            style: rootStyle.value,
            onTap: handler.value,
          }, [h('view')]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();
    collectFlushedOps();

    rootClass.value = undefined;
    rootStyle.value = { backgroundColor: 'black' };
    handler.value = undefined;
    await nextTick();

    const ops = collectFlushedOps();
    expect(findOps(ops, OP.SET_CLASS, 3)).toContainEqual([
      OP.SET_CLASS,
      1,
      '',
    ]);
    expect(findOps(ops, OP.SET_STYLE, 3)).toContainEqual([
      OP.SET_STYLE,
      1,
      { backgroundColor: 'black' },
    ]);
    expect(findOps(ops, OP.REMOVE_EVENT, 4)).toContainEqual([
      OP.REMOVE_EVENT,
      1,
      'bindEvent',
      'tap',
    ]);

    app.unmount();
  });

  it('reports multiple page wrappers without creating native pages', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const App = defineComponent({
      setup() {
        return () =>
          h('view', null, [
            h('page', null, [h('text', null, 'first')]),
            h('page', null, [h('text', null, 'second')]),
          ]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    const ops = collectFlushedOps();
    expect(findOps(ops, OP.CREATE, 3)).not.toContainEqual([
      OP.CREATE,
      expect.any(Number),
      'page',
    ]);
    expect(report).toHaveBeenCalledWith(
      expect.stringContaining('more than one <page>'),
    );

    app.unmount();
    report.mockRestore();
  });

  it('applies the SFC scope id to the existing page root', async () => {
    const App = defineComponent({
      setup() {
        return () => {
          pushScopeId('data-v-page-root');
          const vnode = h('page', { class: 'scoped-root' }, [h('view')]);
          popScopeId();
          return vnode;
        };
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    // Scope ids are composable scope classes on this branch (see 0715-1):
    // applying the SFC scope to the root surfaces as a SET_CLASS on uid 1
    // carrying the data-v token.
    const classOps = findOps(collectFlushedOps(), OP.SET_CLASS, 3);
    expect(
      classOps.some(op =>
        op[1] === 1 && String(op[2]).includes('data-v-page-root')
      ),
    ).toBe(true);

    app.unmount();
  });

  it('forwards a component ref to the page root', async () => {
    const pageRef = ref<{ uid: number }>();
    const App = defineComponent({
      setup() {
        return () => h('page', { ref: pageRef }, [h('view')]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    expect(pageRef.value?.uid).toBe(1);
    app.unmount();
  });

  it('rejects <page> nested inside a native element at compile time', () => {
    expect(() =>
      compile('<view><page class="inner" /></view>', {
        mode: 'module',
        ...vueLynxCompilerOptions,
      })
    ).toThrow(/outermost/);
  });

  it('re-claims the root when a <page> remounts after unmounting', async () => {
    const show = ref(true);
    const App = defineComponent({
      setup() {
        return () =>
          show.value
            ? h('page', { class: 'first-life' }, [h('view')])
            : h('view', { id: 'other-root' });
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();
    collectFlushedOps();

    show.value = false;
    await nextTick();
    expect(findOps(collectFlushedOps(), OP.SET_CLASS, 3)).toContainEqual([
      OP.SET_CLASS,
      1,
      '',
    ]);

    show.value = true;
    await nextTick();
    expect(findOps(collectFlushedOps(), OP.SET_CLASS, 3)).toContainEqual([
      OP.SET_CLASS,
      1,
      'first-life',
    ]);

    app.unmount();
  });

  it('hands ownership to a concurrent <page> when the owner unmounts', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const showA = ref(true);
    const showB = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h('view', null, [
            showA.value
              ? h('page', { key: 'a', class: 'page-a' }, [h('text', null, 'a')])
              : null,
            showB.value
              ? h('page', { key: 'b', class: 'page-b' }, [h('text', null, 'b')])
              : null,
          ]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();
    collectFlushedOps();

    // B mounts while A still owns the root — reported, attrs deferred.
    showB.value = true;
    await nextTick();
    expect(report).toHaveBeenCalledWith(
      expect.stringContaining('more than one <page>'),
    );
    expect(findOps(collectFlushedOps(), OP.SET_CLASS, 3)).not.toContainEqual([
      OP.SET_CLASS,
      1,
      'page-b',
    ]);

    // A unmounts — B takes over and applies its attributes to the root.
    showA.value = false;
    await nextTick();
    expect(findOps(collectFlushedOps(), OP.SET_CLASS, 3)).toContainEqual([
      OP.SET_CLASS,
      1,
      'page-b',
    ]);

    app.unmount();
    report.mockRestore();
  });

  it('clears the scope id from the root when the wrapper unmounts', async () => {
    const show = ref(true);
    const App = defineComponent({
      setup() {
        return () => {
          if (!show.value) return h('view');
          pushScopeId('data-v-1a2b3c4d');
          const vnode = h('page', { class: 'scoped' }, [h('view')]);
          popScopeId();
          return vnode;
        };
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();
    expect(
      findOps(collectFlushedOps(), OP.SET_CLASS, 3).some(op =>
        op[1] === 1 && String(op[2]).includes('data-v-1a2b3c4d')
      ),
    ).toBe(true);

    show.value = false;
    await nextTick();
    // Releasing the root removes the scope token: the final SET_CLASS on
    // uid 1 no longer carries it.
    const rootClassOps = findOps(collectFlushedOps(), OP.SET_CLASS, 3)
      .filter(op => op[1] === 1);
    const lastRootClass = rootClassOps[rootClassOps.length - 1];
    expect(lastRootClass).toBeDefined();
    expect(String(lastRootClass?.[2])).not.toContain('data-v-1a2b3c4d');

    app.unmount();
  });

  it('does not re-emit SET_STYLE for an identical rebuilt style object', async () => {
    const label = ref('one');
    const App = defineComponent({
      setup() {
        return () =>
          h('page', { style: { backgroundColor: 'white' } }, [
            h('text', null, label.value),
          ]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();
    collectFlushedOps();

    label.value = 'two';
    await nextTick();

    const styleOps = findOps(collectFlushedOps(), OP.SET_STYLE, 3)
      .filter(op => op[1] === 1);
    expect(styleOps).toHaveLength(0);

    app.unmount();
  });

  it('forwards main-thread worklet props to the page root', async () => {
    const lynxStub = (globalThis as Record<string, unknown>)['lynx'] as Record<
      string,
      unknown
    >;
    lynxStub['getCoreContext'] ??= () => ({
      addEventListener() {},
      removeEventListener() {},
    });

    const worklet = { _wkltId: 'wklt-page-tap' };
    const mtRef = {
      _wvid: 7,
      toJSON: () => ({ _wvid: 7 }),
    };
    const App = defineComponent({
      setup() {
        return () =>
          h('page', {
            'main-thread-bindtap': worklet,
            'main-thread-ref': mtRef,
          }, [h('view')]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    const ops = collectFlushedOps();
    const workletOps = findOps(ops, OP.SET_WORKLET_EVENT, 5);
    expect(
      workletOps.some(op => op[1] === 1 && op[3] === 'tap'),
    ).toBe(true);
    expect(findOps(ops, OP.SET_MT_REF, 3)).toContainEqual([
      OP.SET_MT_REF,
      1,
      { _wvid: 7 },
    ]);

    app.unmount();
  });

  it('registers an id on the page root for Teleport target resolution', async () => {
    const App = defineComponent({
      setup() {
        return () => h('page', { id: 'root-target' }, [h('view')]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    expect(findOps(collectFlushedOps(), OP.SET_ID, 3)).toContainEqual([
      OP.SET_ID,
      1,
      'root-target',
    ]);
    expect(nodeOps.querySelector?.('#root-target')?.uid).toBe(1);

    app.unmount();
  });
});
