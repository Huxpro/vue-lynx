import type { transformerMetaHighlight as officialTransformerJustForType } from '@shikijs/transformers';

export function parseMetaHighlightString(meta: string): number[] | null {
  if (!meta) return null;
  const match = meta.match(/\{([\d,-]+)\}/);
  if (!match) return null;
  const lines = match[1].split(',').flatMap((v) => {
    const num = v.split('-').map((v) => Number.parseInt(v, 10));
    if (num.length === 1) return [num[0]];
    return Array.from({ length: num[1] - num[0] + 1 }, (_, i) => i + num[0]);
  });
  return lines;
}

export interface TransformerMetaHighlightOptions {
  /**
   * Meta string
   *
   * @default undefined
   */
  highlightVal?: string;
}

const symbol = Symbol('highlighted-lines');

export const SHIKI_TRANSFORMER_META_HIGHLIGHT =
  'shiki-transformer:runtime-meta-highlight';

/**
 * Allow using `{1,3-5}` in the code snippet meta to mark highlighted lines.
 */
export function transformerRuntimeMetaHighlight(
  options: TransformerMetaHighlightOptions = {},
): ReturnType<typeof officialTransformerJustForType> {
  const { highlightVal } = options;

  return {
    name: SHIKI_TRANSFORMER_META_HIGHLIGHT,
    line(node, line) {
      if (!highlightVal) {
        return;
      }
      const meta = this.meta as {
        [symbol]: number[] | null;
      };

      meta[symbol] ??= parseMetaHighlightString(highlightVal);
      const lines: number[] = meta[symbol] ?? [];

      if (lines.includes(line)) this.addClassToHast(node, 'highlighted');
      return node;
    },
    pre(hast) {
      this.addClassToHast(hast, 'has-highlighted');
      return hast;
    },
  };
}
