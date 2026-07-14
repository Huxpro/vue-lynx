import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const configUrl = new URL('../rspress.config.ts', import.meta.url);
const rootContextUrl = new URL('../../.impeccable.md', import.meta.url);
const elkContextUrl = new URL(
  '../../examples/elk/.impeccable.md',
  import.meta.url,
);
const aiChatContextUrl = new URL(
  '../../examples/ai-chat/.impeccable.md',
  import.meta.url,
);

function sliceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  assert.notEqual(startIndex, -1, `missing sidebar marker: ${start}`);
  assert.notEqual(endIndex, -1, `missing sidebar marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

test('Elk follows AI Chat in both Benchmark sidebars', async () => {
  const config = await readFile(configUrl, 'utf8');
  const english = sliceBetween(config, "'/guide/': [", "'/zh/guide/': [");
  const chinese = sliceBetween(config, "'/zh/guide/': [", 'llmsUI: true');

  assert.match(
    english,
    /HackerNews[\s\S]*AI Chat[\s\S]*Elk \(Mastodon Client\)/,
  );
  assert.match(
    chinese,
    /HackerNews[\s\S]*AI Chat[\s\S]*Elk（Mastodon 客户端）/,
  );
  assert.doesNotMatch(config, /sectionHeaderText:\s*'(?:Showcase|案例展示)'/);
});

test('example design context lives with its owning example', async () => {
  assert.equal(existsSync(rootContextUrl), false);
  assert.equal(existsSync(elkContextUrl), true);
  assert.equal(existsSync(aiChatContextUrl), true);

  const [elkContext, aiChatContext] = await Promise.all([
    readFile(elkContextUrl, 'utf8'),
    readFile(aiChatContextUrl, 'utf8'),
  ]);
  assert.match(elkContext, /Elk example/);
  assert.match(aiChatContext, /AI chat/);
});
