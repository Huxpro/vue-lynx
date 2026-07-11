/**
 * Real-model mode: streams text/reasoning from the Vercel AI Gateway
 * (OpenAI-compatible API) when AI_GATEWAY_API_KEY is set — the same gateway
 * and model ids the original template uses. Custom weather/chart/web-search
 * tools remain mock-only (a zero-dep tool-calling loop is out of scope for
 * this example; see PRD F7.2).
 */

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

// The original's system prompt (server/api/chats/[id].post.ts), minus the
// tool-specific sections.
const INSTRUCTIONS = `You are a knowledgeable and helpful AI assistant. Your goal is to provide clear, accurate, and well-structured responses.

**FORMATTING RULES (CRITICAL):**
- ABSOLUTELY NO MARKDOWN HEADINGS: Never use #, ##, ###, ####, #####, or ######
- NO underline-style headings with === or ---
- Use **bold text** for emphasis and section labels instead
- Start all responses with content, never with a heading

**RESPONSE QUALITY:**
- Be concise yet comprehensive
- Use examples when helpful
- Break down complex topics into digestible parts
- Maintain a friendly, professional tone`;

export function realModeAvailable() {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

function toGatewayMessages(messages) {
  return [
    { role: 'system', content: INSTRUCTIONS },
    ...messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role,
        content: (m.parts || [])
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('\n'),
      }))
      .filter((m) => m.content),
  ];
}

let idCounter = 0;

/** Streams a real generation as UI-message chunks via emit(). Returns parts. */
export async function runRealGeneration({ messages, model, emit, signal }) {
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: toGatewayMessages(messages),
      stream: true,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gateway error ${res.status}: ${text.slice(0, 200)}`);
  }

  const parts = [];
  let textPart = null;
  let textId = null;
  let reasoningPart = null;
  let reasoningId = null;

  const decoder = new TextDecoder();
  let buffer = '';

  const endReasoning = () => {
    if (reasoningPart) {
      emit({ type: 'reasoning-end', id: reasoningId });
      reasoningPart.state = 'done';
      reasoningPart = null;
    }
  };

  for await (const value of res.body) {
    if (signal.aborted) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) {
      const line = event.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      let json;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = json.choices?.[0]?.delta ?? {};
      const reasoning = delta.reasoning_content ?? delta.reasoning;
      if (reasoning) {
        if (!reasoningPart) {
          reasoningId = `r${++idCounter}`;
          reasoningPart = { type: 'reasoning', text: '', state: 'streaming' };
          parts.push(reasoningPart);
          emit({ type: 'reasoning-start', id: reasoningId });
        }
        reasoningPart.text += reasoning;
        emit({ type: 'reasoning-delta', id: reasoningId, delta: reasoning });
      }
      if (delta.content) {
        endReasoning();
        if (!textPart) {
          textId = `t${++idCounter}`;
          textPart = { type: 'text', text: '', state: 'streaming' };
          parts.push(textPart);
          emit({ type: 'text-start', id: textId });
        }
        textPart.text += delta.content;
        emit({ type: 'text-delta', id: textId, delta: delta.content });
      }
    }
  }

  endReasoning();
  if (textPart) {
    emit({ type: 'text-end', id: textId });
    textPart.state = 'done';
  }
  return parts;
}
