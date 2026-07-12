import {
  MODELS,
  mockResponseFor,
  mockTitleFor,
  SEED_CHATS,
} from '../../shared/mock-ai.mjs';
import type { UIMessage, UIMessagePart } from '../types/ai';
import { LOCAL_AVATAR, LOCAL_SAMPLES } from './local-samples';
import type { StreamChunk } from './stream';
import { uid } from './uid';

/**
 * Client-side fallback backend: an in-memory twin of server/index.mjs used
 * when no API server is reachable — the website's <Go> playground and
 * LynxExplorer bundles scanned from it have no localhost:3210. Same seed
 * data, same mock generations (via shared/mock-ai.mjs), same route
 * semantics; state lives for the app session only.
 */

interface ChatRow {
  id: string;
  title: string | null;
  visibility: 'public' | 'private';
  createdAt: string;
}

interface MessageRow extends UIMessage {
  chatId: string;
  createdAt: string;
}

const DEMO_USER = {
  id: 'demo-user',
  username: 'lynx',
  name: 'Lynx Explorer',
  avatar: LOCAL_AVATAR,
};

const chats: ChatRow[] = [];
const messages: MessageRow[] = [];
const votes: Array<{ chatId: string; messageId: string; isUpvoted: boolean }> = [];
let user: typeof DEMO_USER | null = null;

(function seed() {
  const now = Date.now();
  for (const c of SEED_CHATS) {
    chats.push({
      id: c.id,
      title: c.title,
      visibility: 'private',
      createdAt: new Date(now - c.ageMs).toISOString(),
    });
    messages.push(
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
})();

function chatById(id: string) {
  return chats.find((c) => c.id === id);
}

/** Mirrors the server's route handlers (see server/index.mjs). */
export function localApi(path: string, method: string, body?: unknown): unknown {
  const payload = (body ?? {}) as Record<string, never>;

  if (path === '/api/session' && method === 'GET') return { user };
  if (path === '/api/session' && method === 'DELETE') {
    user = null;
    return { user: null };
  }
  if (path === '/api/session/login' && method === 'POST') {
    user = DEMO_USER;
    return { user };
  }

  if (path === '/api/samples' && method === 'GET') return LOCAL_SAMPLES;

  if (path === '/api/chats' && method === 'GET') {
    return [...chats].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  if (path === '/api/chats' && method === 'POST') {
    const { id, message } = payload as {
      id?: string;
      message?: { id?: string; parts?: UIMessagePart[] };
    };
    const chatId = id || uid();
    if (chats.some((chat) => chat.id === chatId)) {
      throw Object.assign(new Error('Chat id already exists'), { status: 409 });
    }
    const chat: ChatRow = {
      id: chatId,
      title: null,
      visibility: 'private',
      createdAt: new Date().toISOString(),
    };
    chats.push(chat);
    if (message) {
      messages.push({
        id: message.id || uid(),
        chatId: chat.id,
        role: 'user',
        parts: message.parts || [],
        createdAt: new Date().toISOString(),
      });
    }
    return chat;
  }

  const match = path.match(/^\/api\/chats\/([^/]+)(\/.*)?$/);
  if (match) {
    const [, id, sub = ''] = match;
    const chat = chatById(id!);

    if (sub === '' && method === 'GET') {
      if (!chat) return null;
      return {
        id: chat.id,
        title: chat.title,
        visibility: chat.visibility,
        isOwner: true,
        messages: messages
          .filter((m) => m.chatId === chat.id)
          .map(({ id: mid, role, parts, createdAt }) => ({
            id: mid,
            role,
            parts,
            metadata: { createdAt },
          })),
      };
    }
    if (!chat) throw new Error('Chat not found');

    if (sub === '' && method === 'DELETE') {
      chats.splice(chats.indexOf(chat), 1);
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]!.chatId === id) messages.splice(i, 1);
      }
      return { ok: true };
    }
    if (sub === '/title' && method === 'PATCH') {
      chat.title = String((payload as { title?: string }).title || '').slice(0, 100);
      return { ok: true };
    }
    if (sub === '/visibility' && method === 'PATCH') {
      chat.visibility = (payload as { visibility: 'public' | 'private' }).visibility;
      return { ok: true };
    }
    if (sub === '/votes' && method === 'GET') {
      return votes.filter((v) => v.chatId === id);
    }
    if (sub === '/votes' && method === 'POST') {
      const { messageId, isUpvoted } = payload as { messageId: string; isUpvoted?: boolean };
      const existing = votes.findIndex((v) => v.chatId === id && v.messageId === messageId);
      if (existing !== -1) votes.splice(existing, 1);
      if (typeof isUpvoted === 'boolean') votes.push({ chatId: id!, messageId, isUpvoted });
      return { ok: true };
    }
    if (sub === '/messages' && method === 'DELETE') {
      const { messageId, type } = payload as { messageId: string; type: 'edit' | 'regenerate' };
      const list = messages.filter((m) => m.chatId === id);
      const idx = list.findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        const dropIds = new Set(list.slice(type === 'edit' ? idx : idx).map((m) => m.id));
        for (let i = messages.length - 1; i >= 0; i--) {
          if (dropIds.has(messages[i]!.id)) messages.splice(i, 1);
        }
      }
      return { ok: true };
    }
  }

  throw new Error(`No local route: ${method} ${path}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mirrors the server's runGeneration (word-paced mock streaming). */
export async function localStream(
  chatId: string,
  body: { model?: string; messages?: UIMessage[] },
  signal: AbortSignal,
  onChunk: (chunk: StreamChunk) => void,
): Promise<void> {
  const chat = chatById(chatId);
  if (!chat) throw new Error('Chat not found');

  const incoming = body.messages ?? [];
  const model = body.model || MODELS[0]!.value;

  if (!chat.title) {
    chat.title = mockTitleFor(incoming[0]);
  }

  const lastMessage = incoming[incoming.length - 1];
  if (lastMessage?.role === 'user' && !messages.some((m) => m.id === lastMessage.id)) {
    messages.push({
      ...lastMessage,
      chatId,
      createdAt: new Date().toISOString(),
    });
  }

  const prompt = lastMessage
    ? lastMessage.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as { text: string }).text)
        .join('\n')
    : '';

  const script = mockResponseFor(prompt, model);
  const messageId = uid();
  const parts: UIMessagePart[] = [];

  onChunk({ type: 'start', messageId });
  onChunk({ type: 'start-step' });

  // The real template has a visible submitted phase while the request reaches
  // the model. Keep that feedback in the zero-network demo too; otherwise the
  // synchronous fallback jumps straight to the first reasoning part and the
  // waiting spinner never becomes perceptible.
  await sleep(600);

  for (const step of script) {
    if (signal.aborted) break;
    if (step.kind === 'reasoning' || step.kind === 'text') {
      const id = uid();
      onChunk({ type: `${step.kind}-start`, id });
      let text = '';
      for (const word of step.text.split(/(?<=\s)/)) {
        if (signal.aborted) break;
        text += word;
        onChunk({ type: `${step.kind}-delta`, id, delta: word });
        await sleep(step.kind === 'reasoning' ? 24 : 18);
      }
      onChunk({ type: `${step.kind}-end`, id });
      parts.push({ type: step.kind, text, state: 'done' });
    } else if (step.kind === 'tool') {
      const toolCallId = uid();
      onChunk({ type: 'tool-input-start', toolCallId, toolName: step.name });
      await sleep(300);
      onChunk({ type: 'tool-input-available', toolCallId, toolName: step.name, input: step.input });
      await sleep(1500);
      onChunk({ type: 'tool-output-available', toolCallId, output: step.output });
      parts.push({
        type: `tool-${step.name}`,
        toolCallId,
        state: 'output-available',
        input: step.input,
        output: step.output,
      });
    } else if (step.kind === 'source') {
      const sourceId = uid();
      onChunk({ type: 'source-url', sourceId, url: step.url, title: step.title });
      parts.push({ type: 'source-url', sourceId, url: step.url, title: step.title });
    }
  }

  onChunk({ type: 'finish-step' });
  onChunk({ type: 'finish' });

  if (parts.length && !signal.aborted) {
    messages.push({
      id: messageId,
      chatId,
      role: 'assistant',
      parts,
      createdAt: new Date().toISOString(),
    });
  }
}
