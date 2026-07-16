/**
 * Correctness oracle: every variant must produce the same rendered document
 * as the shipped pipeline (bg-baseline), modulo bookkeeping attributes.
 *
 *   node --import ./register-hooks.mjs src/correctness.mjs
 */

import { makeJsdomBackend, normalizeHtml } from './papi-backends.mjs';
import { prepareScene } from './prep.mjs';
import { SIZES, allScenes } from './scenes.mjs';
import { VARIANTS } from './variants.mjs';

const normalizationProbe = normalizeHtml(
  '<page class="data-v-app"><page class="data-v-app"></page></page>',
);
if (normalizationProbe !== '<page><page class="data-v-app"></page></page>') {
  throw new Error('normalization must preserve nested application output');
}

const backend = await makeJsdomBackend();

let failures = 0;

const requiredVariants = ['ifr-vapor-real'];
for (const name of requiredVariants) {
  if (!(name in VARIANTS)) {
    console.error(`✗ missing required variant: ${name}`);
    failures++;
  }
}

for (const sceneEntry of allScenes(SIZES.small)) {
  const bundle = prepareScene(sceneEntry, sceneEntry.sizeArg);
  const outputs = new Map();

  for (const [name, factory] of Object.entries(VARIANTS)) {
    backend.install();
    backend.reset();
    const page = __CreatePage('0', 0);
    __SetCSSId([page], 0);
    const ctx = { page, pageUid: __GetElementUniqueID(page) };
    const v = factory(bundle);
    v.reset(ctx);
    v.run();
    __FlushElementTree(page);
    outputs.set(name, normalizeHtml(backend.html()));
  }

  const reference = outputs.get('bg-baseline');
  if (!reference || reference.length < 50) {
    console.error(`✗ ${sceneEntry.name}: bg-baseline produced no output`);
    failures++;
    continue;
  }
  for (const [name, html] of outputs) {
    if (html === reference) {
      console.log(`✓ ${sceneEntry.name} / ${name}`);
    } else {
      failures++;
      console.error(`✗ ${sceneEntry.name} / ${name} DIFFERS from bg-baseline`);
      // First divergence point for debugging.
      let i = 0;
      while (i < Math.min(html.length, reference.length) && html[i] === reference[i]) i++;
      console.error(`  ref: …${reference.slice(Math.max(0, i - 60), i + 80)}…`);
      console.error(`  got: …${html.slice(Math.max(0, i - 60), i + 80)}…`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} correctness failure(s)`);
  process.exit(1);
}
console.log('\nAll variants render identically. ✔');
