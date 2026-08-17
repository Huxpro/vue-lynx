import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateRealTitle } from '../server/real-ai.mjs';

const previousKey = process.env.AI_GATEWAY_API_KEY;

afterEach(() => {
  if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = previousKey;
});

describe('real AI title generation', () => {
  it('uses gpt-4.1-nano and returns its plain title', async () => {
    process.env.AI_GATEWAY_API_KEY = 'test-key';
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        model: 'openai/gpt-4.1-nano',
        stream: false,
      });
      expect(body.messages.at(-1)?.content).toContain('Vue composable');
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Creating a Vue composable' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    const title = await generateRealTitle(
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Help me create a Vue composable' }],
      },
      { fetchImpl },
    );

    expect(title).toBe('Creating a Vue composable');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty gateway title so the server can use its mock fallback', async () => {
    process.env.AI_GATEWAY_API_KEY = 'test-key';
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), {
        status: 200,
      }),
    );

    await expect(
      generateRealTitle(
        { id: 'user-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        { fetchImpl },
      ),
    ).rejects.toThrow('Gateway returned an empty title');
  });
});
