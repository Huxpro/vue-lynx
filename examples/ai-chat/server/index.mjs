/**
 * Standalone dev server for the ai-chat example.
 *
 * Reimplements the Nuxt template's Nitro API surface (same routes, same JSON
 * shapes, same AI SDK v5 UI-message-stream SSE protocol) with zero
 * dependencies so the example runs fully offline:
 *
 *   GET    /api/session                  -> { user|null }
 *   POST   /api/session/login            -> demo-user login (replaces GitHub OAuth)
 *   DELETE /api/session                  -> logout
 *   GET    /api/chats                    -> chats for this session
 *   POST   /api/chats                    -> create chat with first user message
 *   GET    /api/chats/:id                -> chat + messages (+isOwner)
 *   POST   /api/chats/:id                -> AI response (SSE stream; ?mode=poll for polling)
 *   GET    /api/stream/:sid?cursor=N     -> polling fallback for native Lynx
 *   DELETE /api/chats/:id
 *   PATCH  /api/chats/:id/title
 *   PATCH  /api/chats/:id/visibility
 *   GET    /api/chats/:id/votes
 *   POST   /api/chats/:id/votes
 *   DELETE /api/chats/:id/messages       -> truncate for edit/regenerate
 *   GET    /api/samples                  -> demo attachment images
 *
 * AI responses are deterministic mocks (streamed word-by-word like the
 * original's smoothStream) covering text/markdown, reasoning, weather + chart
 * tool calls, and web-search sources. Sessions are keyed by an `x-session-id`
 * header instead of cookies (Lynx has no document.cookie).
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MODELS, mockResponseFor, mockTitleFor, SEED_CHATS } from '../shared/mock-ai.mjs';
import { realModeAvailable, runRealGeneration } from './real-ai.mjs';
import { SAMPLE_IMAGES } from './samples.mjs';

const PORT = Number(process.env.PORT || 3210);
const DATA_DIR = process.env.AI_CHAT_DATA_DIR
  ? process.env.AI_CHAT_DATA_DIR
  : join(dirname(fileURLToPath(import.meta.url)), '.data');
const DB_FILE = join(DATA_DIR, 'db.json');

// ---------------------------------------------------------------------------
// Persistence (stands in for the original's SQLite + Drizzle)
// ---------------------------------------------------------------------------

/** @type {{ chats: any[], messages: any[], votes: any[], sessions: Record<string, any> }} */
let db = { chats: [], messages: [], votes: [], sessions: {} };

function loadDb() {
  if (existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, 'utf8'));
      return;
    } catch {
      /* corrupted file: reseed */
    }
  }
  seed();
  saveDb();
}

let saveTimer = null;
function saveDb() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }, 50);
}

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

const DEMO_SEED_SESSION = 'seed-demo-user';

function seed() {
  // Chats spread over time so the sidebar's date grouping has content
  // (Today/Yesterday/Last week/Last month/older); data shared with the
  // client-side fallback backend.
  const now = Date.now();
  for (const c of SEED_CHATS) {
    db.chats.push({
      id: c.id,
      userId: DEMO_SEED_SESSION,
      title: c.title,
      visibility: 'private',
      createdAt: new Date(now - c.ageMs).toISOString(),
    });
    db.messages.push(
      {
        id: `${c.id}-u1`,
        chatId: c.id,
        role: 'user',
        parts: [{ type: 'text', text: c.q }],
        createdAt: new Date(now - c.ageMs).toISOString(),
      },
      {
        id: `${c.id}-a1`,
        chatId: c.id,
        role: 'assistant',
        parts: [{ type: 'text', text: c.a }],
        createdAt: new Date(now - c.ageMs + 30_000).toISOString(),
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Session handling (header token replaces the original's sealed cookie)
// ---------------------------------------------------------------------------

const DEMO_USER = {
  id: 'demo-user',
  username: 'lynx',
  name: 'Lynx Explorer',
  avatar: '/samples/avatar.png',
};

/**
 * Copies the seeded demo history to an owner (anonymous session or the demo
 * user) exactly once, so a fresh client always sees a populated, grouped
 * sidebar like the original template's screenshots. Clones are flagged
 * `seeded` so login doesn't multiply them into the shared demo account.
 */
function cloneSeedsFor(ownerId) {
  db.seededOwners ||= [];
  if (db.seededOwners.includes(ownerId)) return;
  db.seededOwners.push(ownerId);
  const prefix = ownerId.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  for (const chat of db.chats.filter((c) => c.userId === DEMO_SEED_SESSION)) {
    const cloneId = `${prefix}-${chat.id}`;
    db.chats.push({ ...chat, id: cloneId, userId: ownerId, seeded: true });
    for (const msg of db.messages.filter((m) => m.chatId === chat.id)) {
      db.messages.push({ ...msg, id: `${prefix}-${msg.id}`, chatId: cloneId });
    }
  }
  saveDb();
}

function getSession(req) {
  const sid = req.headers['x-session-id'] || 'anonymous';
  if (!db.sessions[sid]) db.sessions[sid] = { id: sid, user: null };
  if (!db.sessions[sid].user) cloneSeedsFor(sid);
  return { sid, user: db.sessions[sid].user };
}

// Chats created while logged out belong to the anonymous session id; after
// login they belong to the demo user id (matches nuxt-auth-utils behavior).
function ownerKey(session) {
  return session.user?.id || session.sid;
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

/** Active poll-mode streams: id -> { events: string[], done: boolean } */
const pollStreams = new Map();

function sseChunk(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

/**
 * Runs a mock generation, invoking emit(chunkObject) for every UI-message
 * stream chunk. Returns the final assistant message parts.
 */
async function runGeneration({ chat, messages, model, emit, signal }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = lastUser
    ? lastUser.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('\n')
    : '';

  const messageId = uid();
  let parts = [];

  emit({ type: 'start', messageId });
  emit({ type: 'start-step' });

  const persist = () => {
    if (parts.length && !signal.aborted) {
      db.messages.push({
        id: messageId,
        chatId: chat.id,
        role: 'assistant',
        parts,
        createdAt: new Date().toISOString(),
      });
      saveDb();
    }
  };

  // Real-model mode (AI_GATEWAY_API_KEY set): stream from the Vercel AI
  // Gateway like the original; falls back to the mock script on failure.
  if (realModeAvailable()) {
    try {
      parts = await runRealGeneration({ messages, model, emit, signal });
      emit({ type: 'finish-step' });
      emit({ type: 'finish' });
      persist();
      return;
    } catch (err) {
      console.error('[real-ai] falling back to mock:', err.message);
    }
  }

  const script = mockResponseFor(prompt, model);

  const sleep = (ms) =>
    new Promise((r) => setTimeout(r, process.env.FAST_MOCK ? 1 : ms));

  for (const step of script) {
    if (signal.aborted) break;
    if (step.kind === 'reasoning') {
      const id = uid();
      emit({ type: 'reasoning-start', id });
      let text = '';
      for (const word of step.text.split(/(?<=\s)/)) {
        if (signal.aborted) break;
        text += word;
        emit({ type: 'reasoning-delta', id, delta: word });
        await sleep(24);
      }
      emit({ type: 'reasoning-end', id });
      parts.push({ type: 'reasoning', text, state: 'done' });
    } else if (step.kind === 'text') {
      const id = uid();
      emit({ type: 'text-start', id });
      let text = '';
      for (const word of step.text.split(/(?<=\s)/)) {
        if (signal.aborted) break;
        text += word;
        emit({ type: 'text-delta', id, delta: word });
        await sleep(18);
      }
      emit({ type: 'text-end', id });
      parts.push({ type: 'text', text, state: 'done' });
    } else if (step.kind === 'tool') {
      const toolCallId = uid();
      emit({ type: 'tool-input-start', toolCallId, toolName: step.name });
      await sleep(300);
      emit({
        type: 'tool-input-available',
        toolCallId,
        toolName: step.name,
        input: step.input,
      });
      // The original's tools sleep 1.5s to showcase the input-available state.
      await sleep(1500);
      emit({ type: 'tool-output-available', toolCallId, output: step.output });
      parts.push({
        type: `tool-${step.name}`,
        toolCallId,
        state: 'output-available',
        input: step.input,
        output: step.output,
      });
    } else if (step.kind === 'source') {
      const sourceId = uid();
      emit({ type: 'source-url', sourceId, url: step.url, title: step.title });
      parts.push({ type: 'source-url', sourceId, url: step.url, title: step.title });
    }
  }

  emit({ type: 'finish-step' });
  emit({ type: 'finish' });

  persist();
}

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------

function json(res, status, body) {
  const data = JSON.stringify(body ?? null);
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function chatForOwner(id, session) {
  return db.chats.find((c) => c.id === id && c.userId === ownerKey(session));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,x-session-id',
      'access-control-max-age': '86400',
    });
    return res.end();
  }

  try {
    // --- static sample images -------------------------------------------
    if (req.method === 'GET' && path.startsWith('/samples/')) {
      const name = path.slice('/samples/'.length);
      const sample = SAMPLE_IMAGES[name];
      if (!sample) return json(res, 404, { message: 'Not found' });
      res.writeHead(200, {
        'content-type': sample.contentType,
        'access-control-allow-origin': '*',
        // the Lynx web preview page sets COEP: require-corp
        'cross-origin-resource-policy': 'cross-origin',
        'cache-control': 'public, max-age=3600',
      });
      return res.end(sample.body);
    }

    if (req.method === 'GET' && path === '/api/samples') {
      return json(
        res,
        200,
        Object.entries(SAMPLE_IMAGES)
          .filter(([, s]) => s.listed !== false)
          .map(([name, s]) => ({
            name,
            url: `/samples/${name}`,
            mediaType: s.contentType,
          })),
      );
    }

    const session = getSession(req);

    // --- session ----------------------------------------------------------
    if (path === '/api/session') {
      if (req.method === 'GET') return json(res, 200, { user: session.user });
      if (req.method === 'DELETE') {
        db.sessions[session.sid].user = null;
        saveDb();
        return json(res, 200, { user: null });
      }
    }
    if (req.method === 'POST' && path === '/api/session/login') {
      db.sessions[session.sid].user = DEMO_USER;
      // Adopt the session's own (non-seeded) chats into the logged-in
      // identity, like the original links chats by userId once
      // authenticated; seed clones stay behind to avoid duplicates in the
      // shared demo account, which gets its own single seed copy.
      for (const chat of db.chats) {
        if (chat.userId === session.sid && !chat.seeded) chat.userId = DEMO_USER.id;
      }
      cloneSeedsFor(DEMO_USER.id);
      saveDb();
      return json(res, 200, { user: DEMO_USER });
    }

    // --- chats collection ---------------------------------------------------
    if (path === '/api/chats' && req.method === 'GET') {
      const chats = db.chats
        .filter((c) => c.userId === ownerKey(session))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map(({ id, title, createdAt, visibility }) => ({
          id,
          title,
          createdAt,
          visibility,
        }));
      return json(res, 200, chats);
    }

    if (path === '/api/chats' && req.method === 'POST') {
      const body = await readBody(req);
      const id = body.id || uid();
      if (db.chats.some((chat) => chat.id === id)) {
        return json(res, 409, { message: 'Chat id already exists' });
      }
      const chat = {
        id,
        userId: ownerKey(session),
        title: null,
        visibility: 'private',
        createdAt: new Date().toISOString(),
      };
      db.chats.push(chat);
      if (body.message) {
        db.messages.push({
          id: body.message.id || uid(),
          chatId: id,
          role: 'user',
          parts: body.message.parts || [],
          createdAt: new Date().toISOString(),
        });
      }
      saveDb();
      return json(res, 200, chat);
    }

    // --- polling fallback stream reader ------------------------------------
    const streamMatch = path.match(/^\/api\/stream\/([^/]+)$/);
    if (streamMatch && req.method === 'GET') {
      const stream = pollStreams.get(streamMatch[1]);
      if (!stream) return json(res, 404, { message: 'Stream not found' });
      const cursor = Number(url.searchParams.get('cursor') || 0);
      return json(res, 200, {
        events: stream.events.slice(cursor),
        cursor: stream.events.length,
        done: stream.done,
      });
    }

    // --- single chat --------------------------------------------------------
    const chatMatch = path.match(/^\/api\/chats\/([^/]+)(\/.*)?$/);
    if (chatMatch) {
      const [, id, sub = ''] = chatMatch;
      const anyChat = db.chats.find((c) => c.id === id);
      const owned = chatForOwner(id, session);

      if (sub === '' && req.method === 'GET') {
        const chat = owned || (anyChat?.visibility === 'public' ? anyChat : null);
        if (!chat) return json(res, 200, null); // matches useFetch data:null → 404 view
        const messages = db.messages
          .filter((m) => m.chatId === chat.id)
          .map(({ id: mid, role, parts, createdAt }) => ({
            id: mid,
            role,
            parts,
            metadata: { createdAt },
          }));
        return json(res, 200, {
          id: chat.id,
          title: chat.title,
          visibility: chat.visibility,
          isOwner: Boolean(owned),
          messages,
        });
      }

      if (sub === '' && req.method === 'DELETE') {
        if (!owned) return json(res, 404, { message: 'Chat not found' });
        db.chats = db.chats.filter((c) => c.id !== id);
        db.messages = db.messages.filter((m) => m.chatId !== id);
        db.votes = db.votes.filter((v) => v.chatId !== id);
        saveDb();
        return json(res, 200, { ok: true });
      }

      if (sub === '/title' && req.method === 'PATCH') {
        if (!owned) return json(res, 404, { message: 'Chat not found' });
        const { title } = await readBody(req);
        owned.title = String(title || '').slice(0, 100);
        saveDb();
        return json(res, 200, { ok: true });
      }

      if (sub === '/visibility' && req.method === 'PATCH') {
        if (!owned) return json(res, 404, { message: 'Chat not found' });
        const { visibility } = await readBody(req);
        if (!['public', 'private'].includes(visibility)) {
          return json(res, 400, { message: 'Invalid visibility' });
        }
        owned.visibility = visibility;
        saveDb();
        return json(res, 200, { ok: true });
      }

      if (sub === '/votes' && req.method === 'GET') {
        if (!owned) return json(res, 200, []);
        return json(
          res,
          200,
          db.votes.filter((v) => v.chatId === id),
        );
      }

      if (sub === '/votes' && req.method === 'POST') {
        if (!owned) return json(res, 404, { message: 'Chat not found' });
        const { messageId, isUpvoted } = await readBody(req);
        db.votes = db.votes.filter(
          (v) => !(v.chatId === id && v.messageId === messageId),
        );
        if (typeof isUpvoted === 'boolean') {
          db.votes.push({ chatId: id, messageId, isUpvoted });
        }
        saveDb();
        return json(res, 200, { ok: true });
      }

      if (sub === '/messages' && req.method === 'DELETE') {
        if (!owned) return json(res, 404, { message: 'Chat not found' });
        const { messageId, type } = await readBody(req);
        const list = db.messages.filter((m) => m.chatId === id);
        const idx = list.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
          // edit: drop the edited message and everything after it (client
          // resends the new text); regenerate: drop the assistant message.
          const dropIds = new Set(
            list.slice(type === 'edit' ? idx : idx).map((m) => m.id),
          );
          db.messages = db.messages.filter((m) => !dropIds.has(m.id));
          saveDb();
        }
        return json(res, 200, { ok: true });
      }

      // --- AI generation ---------------------------------------------------
      if (sub === '' && req.method === 'POST') {
        if (!owned) return json(res, 404, { message: 'Chat not found' });
        const body = await readBody(req);
        const model = body.model || MODELS[0].value;
        const messages = body.messages || [];

        if (!owned.title) {
          owned.title = mockTitleFor(messages[0]);
          saveDb();
        }

        // Persist the incoming user message (subsequent turns; the first one
        // was stored by POST /api/chats).
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'user') {
          const exists = db.messages.some((m) => m.id === lastMessage.id);
          if (!exists) {
            db.messages.push({
              id: lastMessage.id || uid(),
              chatId: id,
              role: 'user',
              parts: lastMessage.parts,
              createdAt: new Date().toISOString(),
            });
            saveDb();
          }
        }

        const abort = new AbortController();
        req.on('close', () => abort.abort());

        if (url.searchParams.get('mode') === 'poll') {
          // Native Lynx fallback: run the generation server-side, buffer
          // chunks, let the client poll GET /api/stream/:sid.
          const sid = uid();
          const stream = { events: [], done: false };
          pollStreams.set(sid, stream);
          runGeneration({
            chat: owned,
            messages,
            model,
            emit: (c) => stream.events.push(c),
            signal: abort.signal,
          }).finally(() => {
            stream.done = true;
            setTimeout(() => pollStreams.delete(sid), 5 * 60 * 1000);
          });
          return json(res, 200, { streamId: sid });
        }

        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'x-vercel-ai-ui-message-stream': 'v1',
        });
        await runGeneration({
          chat: owned,
          messages,
          model,
          emit: (c) => res.write(sseChunk(c)),
          signal: abort.signal,
        });
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    return json(res, 404, { message: `No route: ${req.method} ${path}` });
  } catch (err) {
    console.error(err);
    return json(res, 500, { message: String(err?.message || err) });
  }
});

loadDb();
server.listen(PORT, () => {
  console.log(`ai-chat mock server listening on http://localhost:${PORT}`);
  console.log('Mock AI mode (deterministic). Set FAST_MOCK=1 for instant streams.');
});
