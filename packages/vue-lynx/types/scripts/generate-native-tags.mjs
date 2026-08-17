#!/usr/bin/env node
// Reads @lynx-js/types IntrinsicElements and rewrites nativeTags in volar-plugin.cjs.
// Run: pnpm generate:native-tags

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const typesRoot = dirname(require.resolve('@lynx-js/types/package.json'));
const elementDts = readFileSync(
  resolve(typesRoot, 'types/common/element/element.d.ts'),
  'utf-8',
);

const match = elementDts.match(/export interface IntrinsicElements \{([^}]+)\}/s);
if (!match) throw new Error('Could not find IntrinsicElements in element.d.ts');

const lynxTags = [...match[1].matchAll(/'([^']+)':/g)].map(m => m[1]);
const tagListStr = lynxTags.map(t => `    '${t}'`).join(',\n');

const pluginPath = resolve(__dirname, '../src/volar-plugin.cjs');
const src = readFileSync(pluginPath, 'utf-8');

const updated = src.replace(
  /const lynxTags = \[[^\]]*\];/s,
  `const lynxTags = [\n${tagListStr},\n];`,
);

if (updated === src) throw new Error('Could not find lynxTags array in volar-plugin.cjs');

writeFileSync(pluginPath, updated);
console.info(`Updated lynxTags with ${lynxTags.length} tags from @lynx-js/types.`);
