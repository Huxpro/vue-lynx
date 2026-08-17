import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const appPath = path.resolve(import.meta.dirname, '../src/App.vue');
const chatPagePath = path.resolve(import.meta.dirname, '../src/pages/ChatPage.vue');

describe('chat route lifecycle', () => {
  it('keys RouterView by the full route so parameter navigation remounts chat state', async () => {
    const source = await readFile(appPath, 'utf8');

    expect(source).toContain('<RouterView :key="$route.fullPath" />');
  });

  it('aborts an active generation when ChatPage unmounts', async () => {
    const source = await readFile(chatPagePath, 'utf8');

    expect(source).toMatch(/onUnmounted\(stop\)/);
  });
});
