/**
 * Local re-declaration of the AI SDK v5 `UIMessage` data model. The original
 * imports these from `ai` / `@ai-sdk/vue`; the shapes (and helper names) are
 * kept identical so ported component code reads the same.
 */

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export interface TextUIPart {
  type: 'text';
  text: string;
  state?: 'streaming' | 'done';
}

export interface ReasoningUIPart {
  type: 'reasoning';
  text: string;
  state?: 'streaming' | 'done';
}

export type ToolUIPartState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

export interface ToolUIPart {
  type: `tool-${string}`;
  toolCallId: string;
  state: ToolUIPartState;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorText?: string;
}

export interface SourceUrlUIPart {
  type: 'source-url';
  sourceId: string;
  url: string;
  title?: string;
}

export interface FileUIPart {
  type: 'file';
  mediaType: string;
  url: string;
}

export type UIMessagePart =
  | TextUIPart
  | ReasoningUIPart
  | ToolUIPart
  | SourceUrlUIPart
  | FileUIPart;

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: UIMessagePart[];
  metadata?: { createdAt?: string };
}

// --- helpers matching the `ai` package API --------------------------------

export function isTextUIPart(part: UIMessagePart): part is TextUIPart {
  return part.type === 'text';
}

export function isReasoningUIPart(part: UIMessagePart): part is ReasoningUIPart {
  return part.type === 'reasoning';
}

export function isToolUIPart(part: UIMessagePart): part is ToolUIPart {
  return part.type.startsWith('tool-');
}

export function isFileUIPart(part: UIMessagePart): part is FileUIPart {
  return part.type === 'file';
}

export function getToolName(part: ToolUIPart): string {
  return part.type.slice('tool-'.length);
}

/** matches @nuxt/ui/utils/ai isPartStreaming */
export function isPartStreaming(part: UIMessagePart): boolean {
  return 'state' in part && part.state === 'streaming';
}

/** matches @nuxt/ui/utils/ai isToolStreaming */
export function isToolStreaming(part: ToolUIPart): boolean {
  return part.state === 'input-streaming' || part.state === 'input-available';
}

/** matches @nuxt/ui/utils/ai getTextFromMessage */
export function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('');
}
