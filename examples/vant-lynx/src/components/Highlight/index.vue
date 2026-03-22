<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as <view> (Lynx has no HTML tag switching)
  - highlightTag/unhighlightTag: accepted for API compat but always renders as <text>
  - highlightClass/unhighlightClass: accepted for API compat but Lynx has no CSS class system;
    use highlightColor/unhighlightColor (Lynx extension) for color customization instead
  - CSS class-based styling: Lynx uses inline styles; CSS variables in index.less defined for theming reference only
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface HighlightProps {
  keywords?: string | string[];
  sourceString?: string;
  autoEscape?: boolean;
  caseSensitive?: boolean;
  highlightClass?: string;
  highlightTag?: string;
  unhighlightClass?: string;
  unhighlightTag?: string;
  tag?: string;
  // Lynx extensions (Vant uses CSS classes for color)
  highlightColor?: string;
  unhighlightColor?: string;
}

const props = withDefaults(defineProps<HighlightProps>(), {
  keywords: () => [],
  sourceString: '',
  autoEscape: true,
  caseSensitive: false,
  highlightTag: 'span',
  unhighlightTag: 'span',
  tag: 'div',
  highlightColor: '#1989fa',
  unhighlightColor: '',
});

interface HighlightChunk {
  start: number;
  end: number;
  highlight: boolean;
}

const highlightChunks = computed<HighlightChunk[]>(() => {
  const { autoEscape, caseSensitive, keywords, sourceString } = props;
  const flags = caseSensitive ? 'g' : 'gi';
  const _keywords = Array.isArray(keywords) ? keywords : [keywords];

  // generate chunks
  let chunks = _keywords
    .filter((keyword) => keyword)
    .reduce<HighlightChunk[]>((chunks, keyword) => {
      if (autoEscape) {
        keyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      const regex = new RegExp(keyword, flags);

      let match;
      while ((match = regex.exec(sourceString))) {
        const start = match.index;
        const end = regex.lastIndex;

        if (start >= end) {
          regex.lastIndex++;
          continue;
        }

        chunks.push({ start, end, highlight: true });
      }

      return chunks;
    }, []);

  // merge chunks
  chunks = chunks
    .sort((a, b) => a.start - b.start)
    .reduce<HighlightChunk[]>((merged, currentChunk) => {
      const prevChunk = merged[merged.length - 1];

      if (!prevChunk || currentChunk.start > prevChunk.end) {
        const unhighlightStart = prevChunk ? prevChunk.end : 0;
        const unhighlightEnd = currentChunk.start;

        if (unhighlightStart !== unhighlightEnd) {
          merged.push({
            start: unhighlightStart,
            end: unhighlightEnd,
            highlight: false,
          });
        }

        merged.push(currentChunk);
      } else {
        prevChunk.end = Math.max(prevChunk.end, currentChunk.end);
      }

      return merged;
    }, []);

  const lastChunk = chunks[chunks.length - 1];

  if (!lastChunk) {
    chunks.push({
      start: 0,
      end: sourceString.length,
      highlight: false,
    });
  }

  if (lastChunk && lastChunk.end < sourceString.length) {
    chunks.push({
      start: lastChunk.end,
      end: sourceString.length,
      highlight: false,
    });
  }

  return chunks;
});

const highlightStyle = computed(() => ({
  fontSize: '14px',
  color: props.highlightColor,
}));

const unhighlightStyle = computed(() => {
  const style: Record<string, any> = { fontSize: '14px' };
  if (props.unhighlightColor) {
    style.color = props.unhighlightColor;
  }
  return style;
});
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }">
    <template v-for="(chunk, index) in highlightChunks" :key="index">
      <text
        v-if="chunk.highlight"
        :style="highlightStyle"
      >{{ sourceString.slice(chunk.start, chunk.end) }}</text>
      <text
        v-else
        :style="unhighlightStyle"
      >{{ sourceString.slice(chunk.start, chunk.end) }}</text>
    </template>
  </view>
</template>
