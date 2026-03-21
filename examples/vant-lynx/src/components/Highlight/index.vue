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
  const pattern = filtered
    .map((k) => (props.autoEscape ? k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : k))
    .join('|');
  const regex = new RegExp(`(${pattern})`, flags);

  const parts = source.split(regex);
  const result: Chunk[] = [];

  for (const part of parts) {
    if (!part) continue;
    const isMatch = filtered.some((k) =>
      props.caseSensitive ? part === k : part.toLowerCase() === k.toLowerCase(),
    );
    result.push({ text: part, highlight: isMatch });
  }

  return result;
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
