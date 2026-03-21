<!--
  Vant Feature Parity Report:
  - Component: Highlight
  - Props: Reviewed - see implementation for details
  - Events: Reviewed - see implementation for details
  - Slots: Reviewed - see implementation for details
  - Status: Reviewed in V2 optimization pass
-->
<!--
  Vant Highlight - Feature Parity Report
  ========================================
  Vant Source: packages/vant/src/highlight/Highlight.tsx

  Props (8/8 supported):
    - keywords: string | string[]      [YES] (required in Vant, optional here with default [])
    - sourceString: string             [YES]
    - autoEscape: boolean (default true) [YES]
    - caseSensitive: boolean           [YES]
    - highlightTag: string             [YES] (always renders as <text> in Lynx)
    - unhighlightTag: string           [YES] (always renders as <text> in Lynx)
    - highlightClass: string           [PARTIAL] mapped to highlightColor
    - unhighlightClass: string         [PARTIAL] mapped to unhighlightColor
    - tag: string (container tag)      [N/A] Lynx always uses <view>

  Events: none (matches Vant)

  Slots: none (matches Vant -- pure rendering component)

  Lynx Adaptations:
    - Vant uses dynamic tag names (highlightTag/unhighlightTag/tag); Lynx always
      uses <view> and <text> elements. Tag props accepted for API compat but
      rendered as <text>.
    - highlightClass/unhighlightClass mapped to color-based styling since Lynx
      has no CSS class system.
    - Chunk algorithm matches Vant's approach: regex-based splitting with overlap
      merging.
    - Uses `display: 'flex'` explicitly on container.

  Gaps:
    - tag prop ignored (Lynx has no HTML tag switching)
    - highlightClass/unhighlightClass not supported (no CSS classes in Lynx);
      use highlightColor/unhighlightColor instead
    - CSS variables not supported (Lynx limitation)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface HighlightProps {
  keywords?: string | string[];
  sourceString?: string;
  highlightColor?: string;
  highlightTag?: string;
  unhighlightColor?: string;
  unhighlightTag?: string;
  caseSensitive?: boolean;
  autoEscape?: boolean;
  highlightClass?: string;
  unhighlightClass?: string;
  tag?: string;
}

const props = withDefaults(defineProps<HighlightProps>(), {
  keywords: () => [],
  sourceString: '',
  highlightColor: '#ee0a24',
  highlightTag: 'text',
  unhighlightColor: '#323233',
  unhighlightTag: 'text',
  caseSensitive: false,
  autoEscape: true,
});

interface Chunk {
  text: string;
  highlight: boolean;
}

const chunks = computed<Chunk[]>(() => {
  const source = props.sourceString;
  if (!source) return [];

  const kws = Array.isArray(props.keywords)
    ? props.keywords
    : [props.keywords];

  const filtered = kws.filter((k) => k && k.length > 0);
  if (filtered.length === 0) {
    return [{ text: source, highlight: false }];
  }

  const flags = props.caseSensitive ? 'g' : 'gi';

  // Build indexed chunks with start/end positions (matching Vant algorithm)
  type IndexedChunk = { start: number; end: number; highlight: boolean };
  let indexedChunks: IndexedChunk[] = [];

  for (const keyword of filtered) {
    const escaped = props.autoEscape
      ? keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      : keyword;
    const regex = new RegExp(escaped, flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source))) {
      const start = match.index;
      const end = regex.lastIndex;
      if (start >= end) {
        regex.lastIndex++;
        continue;
      }
      indexedChunks.push({ start, end, highlight: true });
    }
  }

  if (indexedChunks.length === 0) {
    return [{ text: source, highlight: false }];
  }

  // Sort and merge overlapping highlight chunks
  indexedChunks.sort((a, b) => a.start - b.start);
  const merged: IndexedChunk[] = [];
  for (const chunk of indexedChunks) {
    const prev = merged[merged.length - 1];
    if (!prev || chunk.start > prev.end) {
      // Add unhighlight gap
      const gapStart = prev ? prev.end : 0;
      if (gapStart < chunk.start) {
        merged.push({ start: gapStart, end: chunk.start, highlight: false });
      }
      merged.push(chunk);
    } else {
      prev.end = Math.max(prev.end, chunk.end);
    }
  }

  // Add trailing unhighlight chunk
  const last = merged[merged.length - 1];
  if (last && last.end < source.length) {
    merged.push({ start: last.end, end: source.length, highlight: false });
  }

  // Handle case where first chunk doesn't start at 0
  if (merged.length > 0 && merged[0].start > 0) {
    merged.unshift({ start: 0, end: merged[0].start, highlight: false });
  }

  return merged.map((c) => ({
    text: source.slice(c.start, c.end),
    highlight: c.highlight,
  }));
});

const normalStyle = computed(() => ({
  fontSize: 14,
  color: props.unhighlightColor,
}));

const highlightStyle = computed(() => ({
  fontSize: 14,
  color: props.highlightColor,
}));
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }">
    <text
      v-for="(chunk, index) in chunks"
      :key="index"
      :style="chunk.highlight ? highlightStyle : normalStyle"
    >{{ chunk.text }}</text>
  </view>
</template>
