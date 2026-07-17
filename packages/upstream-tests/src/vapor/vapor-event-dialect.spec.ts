/**
 * Compile-time Lynx event-dialect normalization (issue #234, Part B).
 *
 * Compiles real `<script setup vapor>` SFCs with the
 * `transformLynxEventDialect` nodeTransform (exactly how the plugin injects it
 * when `vaporNormalizeEventDialect` is on) and asserts:
 *   - codegen: `:bindtap` compiles to an `on(...)` call, never
 *     `setAttr(..., "bindtap", ...)`;
 *   - behavior: the registered events reach the Lynx pipeline as
 *     bindEvent / catchEvent and fire (same as the runtime-chokepoint path).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';

import { compileScript, parse } from '@vue/compiler-sfc';
import { nextTick, resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { transformLynxEventDialect } from '../../../vue-lynx/plugin/src/vapor/event-dialect-transform.js';
import { publishEvent } from '../../../vue-lynx/runtime/src/event-registry.js';
import { collectFlushedOps, resetCapturedOps } from '../local-test-setup.js';
import { decodeOps, expandOps, opsOf, resetTemplateExpander } from './ops-test-utils.js';
import type { DecodedOp } from './ops-test-utils.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(_dirname, '.generated');

function compileVaporSfc(filename: string, source: string): string {
  const { descriptor } = parse(source, { filename });
  const result = compileScript(descriptor, {
    id: filename.replace(/\W/g, ''),
    inlineTemplate: true,
    templateOptions: {
      compilerOptions: {
        isNativeTag: () => true,
        whitespace: 'condense',
        eventDelegation: false,
        nodeTransforms: [transformLynxEventDialect],
      },
    },
  });
  return result.content.replace(/from\s*(['"])vue\1/g, "from 'vue-lynx/vapor'");
}

let fixtureCounter = 0;
async function importCompiled(code: string): Promise<{ default: unknown }> {
  fs.mkdirSync(generatedDir, { recursive: true });
  const file = path.join(
    generatedDir,
    `dialect-${process.pid}-${fixtureCounter++}.mts`,
  );
  fs.writeFileSync(file, code);
  return (await import(/* @vite-ignore */ `${file}?t=${Date.now()}`)) as {
    default: unknown;
  };
}

async function flushedOps(): Promise<DecodedOp[]> {
  await nextTick();
  return expandOps(decodeOps(collectFlushedOps()));
}

const BINDTAP_SFC = `
<script setup vapor lang="ts">
import { ref } from 'vue'
const count = ref(0)
function inc() { count.value++ }
function noopCatch() {}
</script>
<template>
  <view>
    <text class="label">Count: {{ count }}</text>
    <view class="btn" :bindtap="inc"><text>+1</text></view>
    <view class="stopper" :catchtap="noopCatch"><text>stop</text></view>
    <view class="ts" :bindtouchstart="inc"><text>ts</text></view>
  </view>
</template>
`;

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
  resetTemplateExpander();
});

describe('vapor event-dialect normalization (#234 Part B)', () => {
  it('compiles :bindtap/:catchtap to on(...) with no setAttr', () => {
    const code = compileVaporSfc('BindTap.vue', BINDTAP_SFC);
    // Codegen assertion (acceptance criteria).
    expect(code).toMatch(/on\(\s*n\d+\s*,\s*"tap"\s*,\s*inc\s*\)/);
    expect(code).toMatch(/on\(\s*n\d+\s*,\s*"touchstart"\s*,\s*inc\s*\)/);
    expect(code).toMatch(/on\(\s*n\d+\s*,\s*"tap"\s*,\s*\w*[wW]ithModifiers\(/);
    expect(code).not.toMatch(/setAttr\([^)]*["']bindtap["']/);
    expect(code).not.toMatch(/setAttr\([^)]*["']catchtap["']/);
  });

  it('registers dialect events on the Lynx pipeline and fires them', async () => {
    const code = compileVaporSfc('BindTap.vue', BINDTAP_SFC);
    const mod = await importCompiled(code);
    const { createApp } = await import('vue-lynx/vapor');

    const app = (createApp as (c: unknown) => { mount(): void; unmount(): void })(
      mod.default,
    );
    app.mount();

    let decoded = await flushedOps();
    const events = opsOf(decoded, OP.SET_EVENT);
    expect(events.some((e) => e.args[1] === 'bindEvent' && e.args[2] === 'tap')).toBe(true);
    expect(events.some((e) => e.args[1] === 'catchEvent' && e.args[2] === 'tap')).toBe(true);
    expect(events.some((e) => e.args[1] === 'bindEvent' && e.args[2] === 'touchstart')).toBe(true);
    // The handler must not leak into the ops stream as a serialized prop.
    expect(opsOf(decoded, OP.SET_PROP).some((p) => p.args[1] === 'bindtap')).toBe(false);

    // Fire the bindtap handler through the Lynx event pipeline.
    const bind = events.find((e) => e.args[1] === 'bindEvent' && e.args[2] === 'tap')!;
    publishEvent(bind.args[3] as string, {});
    decoded = await flushedOps();
    expect(opsOf(decoded, OP.SET_TEXT).map((t) => t.args[1])).toContain('Count: 1');

    app.unmount();
  });
});
