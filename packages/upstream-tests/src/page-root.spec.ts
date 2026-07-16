import { compile } from '@vue/compiler-dom';
import {
  createApp,
  defineComponent,
  h,
  nextTick,
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

    const scopeOps = findOps(collectFlushedOps(), OP.SET_SCOPE_ID, 3);
    expect(scopeOps.some(op => op[1] === 1)).toBe(true);

    app.unmount();
  });

  it('forwards a component ref to the page root', async () => {
    const pageRef = ref<{ id: number }>();
    const App = defineComponent({
      setup() {
        return () => h('page', { ref: pageRef }, [h('view')]);
      },
    });

    const app = createApp(App);
    app.mount();
    await nextTick();

    expect(pageRef.value?.id).toBe(1);
    app.unmount();
  });
});
