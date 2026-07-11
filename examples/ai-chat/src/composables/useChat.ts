import { ref } from 'vue-lynx';

import { streamUIMessages } from '../lib/stream';
import { uid } from '../lib/uid';
import type {
  ChatStatus,
  FileUIPart,
  ReasoningUIPart,
  TextUIPart,
  ToolUIPart,
  UIMessage,
} from '../types/ai';

export interface UseChatOptions {
  id: string;
  messages?: UIMessage[];
  model: () => string;
  onError?: (error: Error) => void;
}

/**
 * Re-implementation of `@ai-sdk/vue`'s useChat() with the surface the
 * template uses: { messages, status, error, sendMessage, regenerate, stop }.
 * The AI SDK client itself assumes browser streams; this version speaks the
 * same UI-message-stream protocol through lib/stream.ts (see PORTING.md).
 */
export function useChat(options: UseChatOptions) {
  const messages = ref<UIMessage[]>(options.messages ?? []);
  const status = ref<ChatStatus>('ready');
  const error = ref<Error | null>(null);

  let abort: AbortController | null = null;

  function upsertAssistant(messageId: string): UIMessage {
    const last = messages.value[messages.value.length - 1];
    if (!last || last.role !== 'assistant' || last.id !== messageId) {
      messages.value.push({ id: messageId, role: 'assistant', parts: [] });
    }
    // Return the REACTIVE proxy (reading back through the ref), not the raw
    // object — mutations through the raw object would bypass Vue's
    // property-level dependency tracking and freeze child components.
    return messages.value[messages.value.length - 1]!;
  }

  async function run() {
    error.value = null;
    status.value = 'submitted';
    abort = new AbortController();

    // Maps stream part ids -> REACTIVE part proxies of the assistant message
    // being built (push then read back, so mutations trigger updates).
    let assistant: UIMessage | null = null;
    const textParts = new Map<string, TextUIPart>();
    const reasoningParts = new Map<string, ReasoningUIPart>();
    const toolParts = new Map<string, ToolUIPart>();

    function pushPart<T>(part: T): T {
      assistant!.parts.push(part as never);
      return assistant!.parts[assistant!.parts.length - 1] as T;
    }

    try {
      await streamUIMessages({
        path: `/api/chats/${options.id}`,
        body: { model: options.model(), messages: messages.value },
        signal: abort.signal,
        onChunk(chunk) {
          switch (chunk.type) {
            case 'start': {
              assistant = upsertAssistant(String(chunk.messageId ?? uid()));
              status.value = 'streaming';
              break;
            }
            case 'text-start': {
              if (!assistant) break;
              const part = pushPart<TextUIPart>({ type: 'text', text: '', state: 'streaming' });
              textParts.set(String(chunk.id), part);
              break;
            }
            case 'text-delta': {
              const part = textParts.get(String(chunk.id));
              if (part) part.text += String(chunk.delta ?? '');
              break;
            }
            case 'text-end': {
              const part = textParts.get(String(chunk.id));
              if (part) part.state = 'done';
              break;
            }
            case 'reasoning-start': {
              if (!assistant) break;
              const part = pushPart<ReasoningUIPart>({ type: 'reasoning', text: '', state: 'streaming' });
              reasoningParts.set(String(chunk.id), part);
              break;
            }
            case 'reasoning-delta': {
              const part = reasoningParts.get(String(chunk.id));
              if (part) part.text += String(chunk.delta ?? '');
              break;
            }
            case 'reasoning-end': {
              const part = reasoningParts.get(String(chunk.id));
              if (part) part.state = 'done';
              break;
            }
            case 'tool-input-start': {
              if (!assistant) break;
              const part = pushPart<ToolUIPart>({
                type: `tool-${String(chunk.toolName)}`,
                toolCallId: String(chunk.toolCallId),
                state: 'input-streaming',
              });
              toolParts.set(String(chunk.toolCallId), part);
              break;
            }
            case 'tool-input-available': {
              const part = toolParts.get(String(chunk.toolCallId));
              if (part) {
                part.state = 'input-available';
                part.input = chunk.input as Record<string, unknown>;
              }
              break;
            }
            case 'tool-output-available': {
              const part = toolParts.get(String(chunk.toolCallId));
              if (part) {
                part.state = 'output-available';
                part.output = chunk.output as Record<string, unknown>;
              }
              break;
            }
            case 'source-url': {
              if (!assistant) break;
              pushPart({
                type: 'source-url',
                sourceId: String(chunk.sourceId),
                url: String(chunk.url),
                title: chunk.title ? String(chunk.title) : undefined,
              });
              break;
            }
            case 'error': {
              throw new Error(String(chunk.errorText ?? 'Stream error'));
            }
            default:
              break;
          }
        },
      });
      status.value = 'ready';
    } catch (e) {
      if (abort?.signal.aborted) {
        status.value = 'ready';
      } else {
        const err = e instanceof Error ? e : new Error(String(e));
        error.value = err;
        status.value = 'error';
        options.onError?.(err);
      }
    } finally {
      abort = null;
    }
  }

  /** sendMessage({ text, files?, messageId? }) — messageId replaces an edited message. */
  async function sendMessage(input: {
    text: string;
    files?: FileUIPart[];
    messageId?: string;
  }) {
    const parts = [
      ...(input.files ?? []),
      { type: 'text' as const, text: input.text },
    ];

    if (input.messageId) {
      const index = messages.value.findIndex((m) => m.id === input.messageId);
      if (index !== -1) {
        const edited: UIMessage = { id: uid(), role: 'user', parts };
        messages.value = [...messages.value.slice(0, index), edited];
      }
    } else {
      messages.value = [
        ...messages.value,
        { id: uid(), role: 'user', parts },
      ];
    }
    await run();
  }

  /** regenerate({ messageId? }) — drops the assistant message and re-runs. */
  async function regenerate(input: { messageId?: string } = {}) {
    const list = messages.value;
    if (input.messageId) {
      const index = list.findIndex((m) => m.id === input.messageId);
      if (index !== -1) messages.value = list.slice(0, index);
    } else if (list[list.length - 1]?.role === 'assistant') {
      messages.value = list.slice(0, -1);
    }
    await run();
  }

  function stop() {
    abort?.abort();
  }

  return { messages, status, error, sendMessage, regenerate, stop };
}
