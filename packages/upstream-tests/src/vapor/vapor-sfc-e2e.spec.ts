/**
 * End-to-end Vapor SFC tests: compile real `<script setup vapor>` SFC source
 * with `@vue/compiler-sfc` (exactly like the build plugin does), execute the
 * compiled module against the vue-lynx Vapor runtime, and assert on the ops
 * stream and interaction behavior.
 *
 * This closes the compiler ↔ runtime contract loop: the runtime tests in
 * vapor-runtime.spec.ts hand-write compiled-output-style code, while these
 * tests run whatever the actual compiler emits today.
 *
 * Mechanism: compiled module code (which imports helpers from 'vue') is
 * rewritten to import from 'vue-lynx/vapor-app', written to a gitignored
 * .generated/ dir, and dynamically imported so vite resolves the imports
 * through the same aliases as everything else.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';

import { compileScript, parse } from '@vue/compiler-sfc';
import { nextTick, resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import * as vaporSurface from 'vue-lynx/vapor-app';
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

// ---------------------------------------------------------------------------
// Compile helpers — mirror pluginVueLynx's compiler configuration
// ---------------------------------------------------------------------------

interface CompiledFixture {
  code: string;
  importsFromVue: string[];
}

function compileVaporSfc(filename: string, source: string): CompiledFixture {
  const { descriptor, errors } = parse(source, { filename });
  expect(errors).toEqual([]);
  expect(descriptor.vapor).toBe(true);

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

  const importsFromVue: string[] = [];
  const importRe = /import\s*\{([^}]*)\}\s*from\s*(['"])vue\2/g;
  for (const match of result.content.matchAll(importRe)) {
    for (const spec of match[1]!.split(',')) {
      const name = spec.split(' as ')[0]!.trim();
      if (name) importsFromVue.push(name);
    }
  }

  const code = result.content.replace(
    /from\s*(['"])vue\1/g,
    "from 'vue-lynx/vapor-app'",
  );
  return { code, importsFromVue };
}

let fixtureCounter = 0;

async function importCompiled(code: string): Promise<{ default: unknown }> {
  fs.mkdirSync(generatedDir, { recursive: true });
  const file = path.join(
    generatedDir,
    `fixture-${process.pid}-${fixtureCounter++}.mts`,
  );
  fs.writeFileSync(file, code);
  return (await import(/* @vite-ignore */ `${file}?t=${Date.now()}`)) as {
    default: unknown;
  };
}

// ---------------------------------------------------------------------------
// Ops decoding (shared shape with vapor-runtime.spec.ts)
// ---------------------------------------------------------------------------

async function flushedOps(): Promise<DecodedOp[]> {
  await nextTick();
  return expandOps(decodeOps(collectFlushedOps()));
}

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
  resetTemplateExpander();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COUNTER_SFC = `
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
  </view>
</template>
`;

const KITCHEN_SINK_SFC = `
<script setup vapor lang="ts">
import { ref, computed } from 'vue'
const show = ref(true)
const items = ref(['a', 'b'])
const msg = ref('hi')
const cls = computed(() => ({ active: show.value }))
const styleObj = computed(() => ({ height: '20px' }))
function noop() {}
</script>
<template>
  <view :class="cls" :style="styleObj" :custom-attr="msg" :id="msg">
    <text v-show="show">shown</text>
    <view v-if="show"><text>if</text></view>
    <view v-else><text>else</text></view>
    <view v-for="(item, i) in items" :key="item"><text>{{ i }}: {{ item }}</text></view>
    <view @tap.stop="noop" @touchstart.once="noop"><text>events</text></view>
    <input v-model.trim="msg" />
  </view>
</template>
<style scoped>
.active { color: red; }
</style>
`;

// ---------------------------------------------------------------------------
// Contract: every helper the compiler emits exists on our export surface
// ---------------------------------------------------------------------------

describe('vapor SFC e2e: compiler ↔ runtime contract', () => {
  it('exports every helper the vapor compiler imports from "vue"', () => {
    for (const sfc of [COUNTER_SFC, KITCHEN_SINK_SFC]) {
      const { importsFromVue } = compileVaporSfc('Contract.vue', sfc);
      expect(importsFromVue.length).toBeGreaterThan(0);
      const missing = importsFromVue.filter(
        (name) => (vaporSurface as Record<string, unknown>)[name] === undefined,
      );
      expect(missing).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Behavior: compile → execute → assert ops
// ---------------------------------------------------------------------------

describe('vapor SFC e2e: counter app', () => {
  it('mounts real compiler output and reacts to events', async () => {
    const { code } = compileVaporSfc('Counter.vue', COUNTER_SFC);
    const mod = await importCompiled(code);
    expect((mod.default as { __vapor?: boolean }).__vapor).toBe(true);

    const app = vaporSurface.createApp(mod.default as never);
    app.mount();

    let decoded = await flushedOps();
    // static classes from the template
    const classes = opsOf(decoded, OP.SET_CLASS).map((c) => c.args[1]);
    expect(classes).toContain('page');
    expect(classes).toContain('label');
    expect(classes).toContain('btn');
    // interpolation
    expect(opsOf(decoded, OP.SET_TEXT).some((t) => t.args[1] === 'Count: 0'))
      .toBe(true);
    // v-if off, v-for empty
    expect(
      opsOf(decoded, OP.SET_TEXT).some((t) => t.args[1] === 'positive'),
    ).toBe(false);

    // tap the +1 button through the Lynx event pipeline
    const tap = opsOf(decoded, OP.SET_EVENT).find((e) => e.args[2] === 'tap')!;
    publishEvent(tap.args[3] as string, {});

    decoded = await flushedOps();
    const texts = opsOf(decoded, OP.SET_TEXT).map((t) => t.args[1]);
    expect(texts).toContain('Count: 1');
    expect(texts).toContain('positive');
    expect(texts).toContain('row 1');

    app.unmount();
  });
});

describe('vapor SFC e2e: kitchen sink', () => {
  it('handles class/style/attr bindings, v-show, v-if/v-else, modifiers, v-model', async () => {
    const { code } = compileVaporSfc('Sink.vue', KITCHEN_SINK_SFC);
    const mod = await importCompiled(code);

    const app = vaporSurface.createApp(mod.default as never);
    app.mount();

    const decoded = await flushedOps();

    // :class object binding → normalized class string
    expect(opsOf(decoded, OP.SET_CLASS).some((c) => c.args[1] === 'active'))
      .toBe(true);
    // :style object binding through the style facade
    expect(
      opsOf(decoded, OP.SET_STYLE).some(
        (s) => (s.args[1] as Record<string, unknown>)?.height === '20px',
      ),
    ).toBe(true);
    // dynamic attr + :id
    expect(
      opsOf(decoded, OP.SET_PROP).some(
        (p) => p.args[1] === 'custom-attr' && p.args[2] === 'hi',
      ),
    ).toBe(true);
    expect(opsOf(decoded, OP.SET_ID).some((i) => i.args[1] === 'hi')).toBe(true);
    // scoped CSS → SET_SCOPE_ID ops from the data-v attrs in the template
    expect(opsOf(decoded, OP.SET_SCOPE_ID).length).toBeGreaterThan(0);
    // v-if true branch only
    const texts = opsOf(decoded, OP.SET_TEXT).map((t) => t.args[1]);
    expect(texts).toContain('if');
    expect(texts).not.toContain('else');
    // v-for
    expect(texts).toContain('0: a');
    expect(texts).toContain('1: b');
    // @tap.stop → catchEvent
    const events = opsOf(decoded, OP.SET_EVENT);
    expect(
      events.some((e) => e.args[1] === 'catchEvent' && e.args[2] === 'tap'),
    ).toBe(true);
    // @touchstart.once still registers
    expect(events.some((e) => e.args[2] === 'touchstart')).toBe(true);
    // v-model wires the input event
    expect(events.some((e) => e.args[2] === 'input')).toBe(true);

    app.unmount();
  });
});
