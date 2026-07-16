/**
 * Regression coverage for dynamic Vapor event names with `.stop`.
 *
 * The real Vapor compiler emits `onBinding()` inside a render effect for
 * `@[event].stop`. The runtime must preserve the Lynx `_lynxCatch` marker
 * through its invoker and through effect cleanup/rebinding.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { compileScript, parse } from '@vue/compiler-sfc';
import { nextTick, ref, resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import {
  createVaporApp,
  defineVaporComponent,
  onBinding,
  renderEffect,
  template,
  withVaporModifiers,
} from 'vue-lynx/vapor';
import { publishEvent } from '../../../vue-lynx/runtime/src/event-registry.js';
import { collectFlushedOps, resetCapturedOps } from '../local-test-setup.js';
import {
  decodeOps,
  expandOps,
  opsOf,
  resetTemplateExpander,
} from './ops-test-utils.js';
import type { DecodedOp } from './ops-test-utils.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(_dirname, '.generated');
const generatedFiles: string[] = [];
const mountedApps: Array<ReturnType<typeof createVaporApp>> = [];
let fixtureCounter = 0;

async function compileAndImport(source: string): Promise<{
  code: string;
  component: unknown;
}> {
  const { descriptor, errors } = parse(source, {
    filename: 'DynamicEventStop.vue',
  });
  expect(errors).toEqual([]);
  expect(descriptor.vapor).toBe(true);

  const result = compileScript(descriptor, {
    id: 'dynamic-event-stop',
    inlineTemplate: true,
    templateOptions: {
      compilerOptions: {
        isNativeTag: () => true,
        whitespace: 'condense',
        eventDelegation: false,
      },
    },
  });
  const code = result.content.replace(
    /from\s*(['"])vue\1/g,
    "from 'vue-lynx/vapor'",
  );

  fs.mkdirSync(generatedDir, { recursive: true });
  const file = path.join(
    generatedDir,
    `dynamic-event-stop-${process.pid}-${fixtureCounter++}.mts`,
  );
  fs.writeFileSync(file, code);
  generatedFiles.push(file);
  const mod = (await import(
    /* @vite-ignore */ `${file}?t=${Date.now()}`
  )) as { default: unknown };
  return { code, component: mod.default };
}

async function flushedOps(): Promise<DecodedOp[]> {
  await nextTick();
  return expandOps(decodeOps(collectFlushedOps()));
}

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
  resetTemplateExpander();
});

afterEach(() => {
  for (const app of mountedApps.splice(0)) app.unmount();
});

afterAll(() => {
  for (const file of generatedFiles) fs.rmSync(file, { force: true });
});

describe('Vapor dynamic event names with .stop', () => {
  it('compiles to onBinding and rebinds as native catchEvent', async () => {
    const { code, component } = await compileAndImport(`
      <script setup vapor>
      import { ref } from 'vue'
      const event = ref('tap')
      const count = ref(0)
      function handle() { count.value++ }
      function switchEvent() { event.value = 'longpress' }
      </script>
      <template>
        <view>
          <text>{{ count }}</text>
          <view @[event].stop="handle" />
          <view @switch="switchEvent" />
        </view>
      </template>
    `);

    expect(code).toContain('onBinding');
    expect(code).toContain('withModifiers');

    const app = createVaporApp(component as never);
    mountedApps.push(app);
    app.mount();

    let decoded = await flushedOps();
    const initialEvent = opsOf(decoded, OP.SET_EVENT).find(
      (operation) => operation.args[2] === 'tap',
    );
    const switchEvent = opsOf(decoded, OP.SET_EVENT).find(
      (operation) => operation.args[2] === 'switch',
    );
    expect(initialEvent?.args[1]).toBe('catchEvent');
    expect(switchEvent?.args[1]).toBe('bindEvent');

    const initialSign = initialEvent!.args[3] as string;
    publishEvent(initialSign, {});
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_TEXT).map((operation) => operation.args[1]))
      .toContain('1');

    publishEvent(switchEvent!.args[3] as string, {});
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.REMOVE_EVENT)).toContainEqual({
      op: OP.REMOVE_EVENT,
      args: [initialEvent!.args[0], 'catchEvent', 'tap'],
    });
    const reboundEvent = opsOf(decoded, OP.SET_EVENT).find(
      (operation) => operation.args[2] === 'longpress',
    );
    expect(reboundEvent?.args[1]).toBe('catchEvent');

    publishEvent(initialSign, {});
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_TEXT)).toHaveLength(0);

    publishEvent(reboundEvent!.args[3] as string, {});
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_TEXT).map((operation) => operation.args[1]))
      .toContain('2');
  });

  it('uses catchEvent when a later handler in an array has .stop', async () => {
    const event = ref('tap');
    const first = vi.fn();
    const second = vi.fn();
    const handlers = [
      first,
      withVaporModifiers(second, ['stop'])!,
    ];
    const createRoot = template('<view>', 1);

    const App = defineVaporComponent(() => {
      const root = createRoot();
      renderEffect(() => onBinding(root, event.value, handlers));
      return root;
    });
    const app = createVaporApp(App);
    mountedApps.push(app);
    app.mount();

    let decoded = await flushedOps();
    const initialEvent = opsOf(decoded, OP.SET_EVENT)[0]!;
    expect(initialEvent.args[1]).toBe('catchEvent');

    const initialSign = initialEvent.args[3] as string;
    publishEvent(initialSign, {});
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    event.value = 'longpress';
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.REMOVE_EVENT)[0]?.args).toEqual([
      initialEvent.args[0],
      'catchEvent',
      'tap',
    ]);
    const reboundEvent = opsOf(decoded, OP.SET_EVENT)[0]!;
    expect(reboundEvent.args[1]).toBe('catchEvent');
    expect(reboundEvent.args[2]).toBe('longpress');

    publishEvent(initialSign, {});
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    publishEvent(reboundEvent.args[3] as string, {});
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
  });
});
