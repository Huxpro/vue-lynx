import type { SourceUrlUIPart, UIMessagePart } from '../types/ai';
import { isTextUIPart } from '../types/ai';

/**
 * Port of app/utils/ai.ts getMergedParts — merges consecutive text parts.
 * Deviation: the original inlines source-url parts into the markdown as
 * `:source-link` MDC components; without an HTML renderer we collect them
 * and render a pill row after the text (see MessageContent.vue).
 */
export function getMergedParts(parts: UIMessagePart[]): UIMessagePart[] {
  const result: UIMessagePart[] = [];
  for (const part of parts) {
    const prev = result[result.length - 1];
    if (part.type === 'source-url') {
      result.push(part);
      continue;
    }
    if (isTextUIPart(part) && prev && isTextUIPart(prev)) {
      result[result.length - 1] = { type: 'text', text: prev.text + part.text, state: part.state };
    } else {
      result.push(part);
    }
  }
  return result;
}

/** Groups trailing source-url parts for pill-row rendering. */
export function collectSources(parts: UIMessagePart[]): SourceUrlUIPart[] {
  return parts.filter((p): p is SourceUrlUIPart => p.type === 'source-url');
}
