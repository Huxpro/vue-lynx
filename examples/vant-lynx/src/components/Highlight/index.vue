<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as <view> (Lynx has no HTML tag switching)
  - highlightTag/unhighlightTag: accepted for API compat but always renders as <text>
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import type { HighlightProps } from './types';
import './index.less';

const [, bem] = createNamespace('highlight');

const props = withDefaults(defineProps<HighlightProps>(), {
  keywords: () => [],
  sourceString: '',
  autoEscape: true,
  caseSensitive: false,
  highlightTag: 'span',
  unhighlightTag: 'span',
  tag: 'div',
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
</script>

<template>
  <view :class="bem()">
    <template v-for="(chunk, index) in highlightChunks" :key="index">
      <text
        v-if="chunk.highlight"
        :class="[bem('tag'), highlightClass]"
      >{{ sourceString.slice(chunk.start, chunk.end) }}</text>
      <text
        v-else
        :class="unhighlightClass"
      >{{ sourceString.slice(chunk.start, chunk.end) }}</text>
    </template>
  </view>
</template>
