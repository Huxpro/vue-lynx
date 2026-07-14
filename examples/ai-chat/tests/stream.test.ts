import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/backend-mode', () => ({
  backendMode: async () => 'remote',
}));

vi.mock('../src/lib/api', () => ({
  getSessionId: () => 'test-session',
}));

interface FakeResponseInit {
  status?: number;
}

function jsonResponse(value: unknown, init: FakeResponseInit = {}): Response {
  const status = init.status ?? 200;
  const text = JSON.stringify(value);
  return {
    ok: status >= 200 && status < 300,
    status,
    body: null,
    json: async () => value,
    text: async () => text,
  } as Response;
}

async function importStreamWith(fetchImpl: typeof fetch) {
  vi.resetModules();
  vi.stubGlobal('fetch', fetchImpl);
  return import('../src/lib/stream');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('remote UI message transport', () => {
  it('starts poll mode once and emits native chunks incrementally', async () => {
    const calls: string[] = [];
    const responses = [
      jsonResponse({ streamId: 'stream-1' }),
      jsonResponse({
        events: [{ type: 'start' }, { type: 'text-start', id: 'text-1' }],
        cursor: 2,
        done: false,
      }),
      jsonResponse({
        events: [
          { type: 'text-delta', id: 'text-1', delta: 'Hello' },
          { type: 'finish' },
        ],
        cursor: 4,
        done: true,
      }),
    ];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      const response = responses.shift();
      if (!response) throw new Error('Unexpected extra fetch');
      return response;
    }) as typeof fetch;
    const { streamRemoteUIMessages } = await importStreamWith(fetchImpl);
    const chunks: Array<{ type: string }> = [];

    await streamRemoteUIMessages(
      {
        path: '/api/chats/chat-1',
        body: { messages: [] },
        signal: new AbortController().signal,
        onChunk: (chunk) => chunks.push(chunk),
      },
      { transport: 'poll', pollIntervalMs: 0 },
    );

    expect(calls).toEqual([
      'http://localhost:3210/api/chats/chat-1?mode=poll',
      'http://localhost:3210/api/stream/stream-1?cursor=0',
      'http://localhost:3210/api/stream/stream-1?cursor=2',
    ]);
    expect(chunks.map((chunk) => chunk.type)).toEqual([
      'start',
      'text-start',
      'text-delta',
      'finish',
    ]);
  });

  it('uses one SSE request for the streaming web transport', async () => {
    const calls: string[] = [];
    const payload = [
      'data: {"type":"start","messageId":"a1"}\n\n',
      'data: {"type":"finish"}\n\ndata: [DONE]\n\n',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of payload) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(stream, { status: 200 });
    }) as typeof fetch;
    const { streamRemoteUIMessages } = await importStreamWith(fetchImpl);
    const chunks: Array<{ type: string }> = [];

    await streamRemoteUIMessages(
      {
        path: '/api/chats/chat-1',
        body: { messages: [] },
        signal: new AbortController().signal,
        onChunk: (chunk) => chunks.push(chunk),
      },
      { transport: 'sse' },
    );

    expect(calls).toEqual(['http://localhost:3210/api/chats/chat-1']);
    expect(chunks.map((chunk) => chunk.type)).toEqual(['start', 'finish']);
  });

  it('surfaces poll start and read errors without retrying generation', async () => {
    const startFetch = vi.fn(async () =>
      jsonResponse({ message: 'generation rejected' }, { status: 503 }),
    ) as typeof fetch;
    let module = await importStreamWith(startFetch);

    await expect(
      module.streamRemoteUIMessages(
        {
          path: '/api/chats/chat-1',
          body: {},
          signal: new AbortController().signal,
          onChunk: () => {},
        },
        { transport: 'poll', pollIntervalMs: 0 },
      ),
    ).rejects.toThrow('generation rejected');
    expect(startFetch).toHaveBeenCalledTimes(1);

    const readFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ streamId: 'stream-1' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'poll failed' }, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true })) as typeof fetch;
    module = await importStreamWith(readFetch);

    await expect(
      module.streamRemoteUIMessages(
        {
          path: '/api/chats/chat-1',
          body: {},
          signal: new AbortController().signal,
          onChunk: () => {},
        },
        { transport: 'poll', pollIntervalMs: 0 },
      ),
    ).rejects.toThrow('poll failed');
    expect(readFetch).toHaveBeenCalledTimes(3);
  });

  it('stops polling after abort without another request', async () => {
    const controller = new AbortController();
    const calls: Array<{ url: string; method: string }> = [];
    const fetchImpl = vi
      .fn()
      .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), method: init?.method ?? 'GET' });
        if (calls.length === 1) return jsonResponse({ streamId: 'stream-1' });
        if (calls.length === 2) {
          controller.abort();
          return jsonResponse({ events: [{ type: 'start' }], cursor: 1, done: false });
        }
        if (calls.length === 3) return jsonResponse({ ok: true });
        throw new Error('Unexpected extra fetch');
      }) as typeof fetch;
    const { streamRemoteUIMessages } = await importStreamWith(fetchImpl);

    await streamRemoteUIMessages(
      {
        path: '/api/chats/chat-1',
        body: {},
        signal: controller.signal,
        onChunk: () => {},
      },
      { transport: 'poll', pollIntervalMs: 0 },
    );

    expect(calls).toEqual([
      {
        url: 'http://localhost:3210/api/chats/chat-1?mode=poll',
        method: 'POST',
      },
      {
        url: 'http://localhost:3210/api/stream/stream-1?cursor=0',
        method: 'GET',
      },
      {
        url: 'http://localhost:3210/api/stream/stream-1',
        method: 'DELETE',
      },
    ]);
  });
});
