/**
 * Build-time structured templates (issue #234, Part A).
 *
 * Verifies the equivalence at the heart of the feature: compiling a
 * `<script setup vapor>` SFC and then running the plugin's
 * structured-template-loader over the output must produce the EXACT same
 * Main-Thread op stream as the untransformed (runtime HTML-parsing) path —
 * same REGISTER_TEMPLATE payloads, same pre-order uids, same dynamic ops.
 *
 * The string path parses `template("<html>")` on the Background Thread; the
 * structured path parses at build time and emits `template([<IR>])`. If the
 * two op streams match op-for-op, the deterministic uid contract is preserved.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';

import { compileScript, parse } from '@vue/compiler-sfc';
import { nextTick, resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import structuredTemplateLoader from '../../../vue-lynx/plugin/src/loaders/structured-template-loader.js';
import { collectFlushedOps, resetCapturedOps } from '../local-test-setup.js';
import { decodeOps, expandOps, resetTemplateExpander } from './ops-test-utils.js';
import type { DecodedOp } from './ops-test-utils.js';

// Which argument indices of each (post-expand, granular) op carry element
// uids. Absolute uid values differ by a constant between the string and
// structured paths — the string path's `ns` handling wraps templates in a
// throwaway <svg> that burns one inert uid per registration. Canonicalizing
// uids by first-appearance order proves structural/contract equivalence
// without depending on those absolute values.
const UID_ARG_POSITIONS: Record<number, number[]> = {
  [OP.CREATE]: [0],
  [OP.CREATE_TEXT]: [0],
  [OP.INSERT]: [0, 1, 2], // arg2 = anchor uid, or -1 (append)
  [OP.REMOVE]: [0, 1],
  [OP.SET_PROP]: [0],
  [OP.SET_TEXT]: [0],
  [OP.SET_EVENT]: [0],
  [OP.REMOVE_EVENT]: [0],
  [OP.SET_STYLE]: [0],
  [OP.SET_CLASS]: [0],
  [OP.SET_ID]: [0],
  [OP.SET_WORKLET_EVENT]: [0],
  [OP.SET_MT_REF]: [0],
};

function canonicalizeUids(ops: DecodedOp[]): DecodedOp[] {
  const map = new Map<number, number>();
  let next = 1000;
  const remap = (u: number): number => {
    if (u === 1) return 1; // PAGE_ROOT_ID is fixed
    if (u < 0) return u; // -1 anchor / sentinels
    let mapped = map.get(u);
    if (mapped === undefined) {
      mapped = next++;
      map.set(u, mapped);
    }
    return mapped;
  };
  return ops.map((entry) => {
    const positions = UID_ARG_POSITIONS[entry.op];
    if (!positions) return entry;
    const args = entry.args.slice();
    for (const pos of positions) {
      if (typeof args[pos] === 'number') args[pos] = remap(args[pos] as number);
    }
    return { op: entry.op, args };
  });
}

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(_dirname, '.generated');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function compileVaporSfc(filename: string, source: string): string {
  const { descriptor } = parse(source, { filename });
  const result = compileScript(descriptor, {
    id: filename.replace(/\W/g, ''),
    inlineTemplate: true,
    templateOptions: {
      scoped: descriptor.styles.some((s) => s.scoped),
      compilerOptions: {
        isNativeTag: () => true,
        whitespace: 'condense',
        eventDelegation: false,
      },
    },
  });
  return result.content.replace(/from\s*(['"])vue\1/g, "from 'vue-lynx/vapor'");
}

/** Run the build-time structured-template transform synchronously. */
function applyStructuredLoader(code: string): string {
  let out = code;
  const ctx = {
    resourcePath: 'Fixture.vue',
    async: () => (_err: Error | null, content?: string) => {
      if (content !== undefined) out = content;
    },
  };
  structuredTemplateLoader.call(ctx as never, code);
  return out;
}

let fixtureCounter = 0;

async function importCompiled(code: string): Promise<{ default: unknown }> {
  fs.mkdirSync(generatedDir, { recursive: true });
  const file = path.join(
    generatedDir,
    `structured-${process.pid}-${fixtureCounter++}.mts`,
  );
  fs.writeFileSync(file, code);
  return (await import(/* @vite-ignore */ `${file}?t=${Date.now()}`)) as {
    default: unknown;
  };
}

async function mountAndCollect(code: string): Promise<DecodedOp[]> {
  const { createApp } = await import('vue-lynx/vapor');
  const mod = await importCompiled(code);
  const app = (createApp as (c: unknown) => { mount(): void; unmount(): void })(
    mod.default,
  );
  app.mount();
  await nextTick();
  const ops = expandOps(decodeOps(collectFlushedOps()));
  app.unmount();
  return ops;
}

// ---------------------------------------------------------------------------
// Fixtures — cover the parser's edge cases: nested elements, folded only-child
// text, interpolation placeholders, anchors (<!>), void elements, unquoted &
// quoted attrs, entities, ids/classes/styles, multiple root templates (v-if/for).
// ---------------------------------------------------------------------------

const FIXTURES: Record<string, string> = {
  counter: `
<script setup vapor lang="ts">
import { ref } from 'vue'
const count = ref(0)
function inc() { count.value++ }
</script>
<template>
  <view class="page">
    <text class="label">Count: {{ count }}</text>
    <view v-if="count > 0"><text>positive</text></view>
    <view v-for="i in count" :key="i"><text>row {{ i }}</text></view>
    <view class="btn" @tap="inc"><text>+1</text></view>
    <input placeholder="type here" />
    <image src="a.png" mode="cover" />
  </view>
</template>
`,
  entitiesAndAttrs: `
<script setup vapor lang="ts">
const label = 'x'
</script>
<template>
  <view id="root" data-flag="a b c">
    <text>a &amp; b &lt; c &gt; d</text>
    <text class="deep"><text>{{ label }}</text></text>
    <view><view><view><text>nested</text></view></view></view>
  </view>
</template>
`,
  styleAndId: `
<script setup vapor lang="ts">
const n = 1
</script>
<template>
  <view style="padding: 8px; flex: 1" id="hero">
    <text>{{ n }}</text>
    <text>static tail</text>
  </view>
</template>
`,
};

// ---------------------------------------------------------------------------

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
  resetTemplateExpander();
});

describe('vapor build-time structured templates (#234 Part A)', () => {
  for (const [name, sfc] of Object.entries(FIXTURES)) {
    it(`emits an identical op stream for "${name}"`, async () => {
      const stringCode = compileVaporSfc(`${name}.vue`, sfc);
      const structuredCode = applyStructuredLoader(stringCode);

      // Sanity: the transform actually fired (structured form present).
      expect(structuredCode).not.toBe(stringCode);
      expect(structuredCode).toMatch(/template\(\s*\[/);
      expect(structuredCode).not.toMatch(/template\(\s*"</);

      // String path first.
      resetForTesting();
      resetCapturedOps();
      resetTemplateExpander();
      const stringOps = await mountAndCollect(stringCode);

      // Structured path in a fresh realm.
      resetForTesting();
      resetCapturedOps();
      resetTemplateExpander();
      const structuredOps = await mountAndCollect(structuredCode);

      expect(canonicalizeUids(structuredOps)).toEqual(canonicalizeUids(stringOps));
      expect(structuredOps.length).toBeGreaterThan(0);
    });
  }
});
