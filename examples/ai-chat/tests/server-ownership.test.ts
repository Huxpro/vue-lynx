import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const serverEntry = path.resolve(import.meta.dirname, '../server/index.mjs');
const children = new Set<ChildProcess>();
const tempDirs = new Set<string>();

async function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close();
        reject(new Error('Could not allocate test port'));
        return;
      }
      probe.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function startServer() {
  const port = await availablePort();
  const dataDir = await mkdtemp(path.join(tmpdir(), 'vue-lynx-ai-chat-'));
  tempDirs.add(dataDir);
  const child = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      PORT: String(port),
      FAST_MOCK: '1',
      AI_CHAT_DATA_DIR: dataDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);

  let stderr = '';
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited before startup: ${stderr}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/session`, {
        headers: { 'x-session-id': 'test-probe' },
      });
      if (response.ok) return { baseUrl, dataDir };
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out waiting for server: ${stderr}`);
}

function sessionHeaders(sessionId: string): HeadersInit {
  return {
    'content-type': 'application/json',
    'x-session-id': sessionId,
  };
}

async function createChat(baseUrl: string, sessionId: string, id: string) {
  return fetch(`${baseUrl}/api/chats`, {
    method: 'POST',
    headers: sessionHeaders(sessionId),
    body: JSON.stringify({ id }),
  });
}

afterEach(async () => {
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  children.clear();
  await Promise.all([...tempDirs].map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.clear();
});

describe('AI chat server storage isolation', () => {
  it('writes its database under AI_CHAT_DATA_DIR when provided', async () => {
    const { dataDir } = await startServer();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(existsSync(path.join(dataDir, 'db.json'))).toBe(true);
  });
});

describe('AI chat server ownership', () => {
  it('rejects a client-supplied chat id that already exists', async () => {
    const { baseUrl } = await startServer();
    const id = `collision-${Date.now()}`;

    const victimCreate = await createChat(baseUrl, 'victim', id);
    const attackerCreate = await createChat(baseUrl, 'attacker', id);

    expect(victimCreate.status).toBe(200);
    expect(attackerCreate.status).toBe(409);
    await expect(attackerCreate.json()).resolves.toEqual({
      message: 'Chat id already exists',
    });
  });

  it('does not let another session delete a private chat by reusing its id', async () => {
    const { baseUrl } = await startServer();
    const id = `private-${Date.now()}`;

    expect((await createChat(baseUrl, 'victim', id)).status).toBe(200);
    await createChat(baseUrl, 'attacker', id);

    const attackerDelete = await fetch(`${baseUrl}/api/chats/${id}`, {
      method: 'DELETE',
      headers: sessionHeaders('attacker'),
    });
    const victimRead = await fetch(`${baseUrl}/api/chats/${id}`, {
      headers: sessionHeaders('victim'),
    });

    expect(attackerDelete.status).toBe(404);
    expect(await victimRead.json()).toMatchObject({ id });
  });
});
