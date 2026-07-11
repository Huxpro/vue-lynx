<script setup lang="ts">
import { computed } from 'vue-lynx';

import { parseMarkdown, tokenizeCodeLine } from '../../lib/markdown';

/**
 * Renders markdown as native Lynx nodes (replaces ChatComark / Comark).
 * Inline styling uses nested <text> spans; code blocks get the regex
 * tokenizer with theme-aware token classes (App.css).
 */
const props = defineProps<{
  markdown: string;
  streaming?: boolean;
}>();

const blocks = computed(() => parseMarkdown(props.markdown));

function codeLines(code: string) {
  return code.split('\n').map((line) => tokenizeCodeLine(line));
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-2xl font-bold text-highlighted',
  2: 'text-xl font-bold text-highlighted',
  3: 'text-lg font-semibold text-highlighted',
  4: 'text-base font-semibold text-highlighted',
  5: 'text-sm font-semibold text-highlighted',
  6: 'text-sm font-semibold text-muted',
};
</script>

<template>
  <view class="flex flex-col gap-3">
    <template v-for="(block, bi) in blocks" :key="bi">
      <!-- paragraph / heading / quote share the inline renderer -->
      <text
        v-if="block.type === 'p' || block.type === 'heading'"
        :class="block.type === 'heading' ? HEADING_CLASSES[block.level] : 'text-base text-default md-line'"
      >
        <template v-for="(tok, ti) in block.inline" :key="ti">
          <text v-if="tok.type === 'bold'" class="font-bold text-highlighted">{{ tok.text }}</text>
          <text v-else-if="tok.type === 'italic'" class="md-italic">{{ tok.text }}</text>
          <text v-else-if="tok.type === 'code'" class="md-inline-code">{{ ' ' + tok.text + ' ' }}</text>
          <text v-else-if="tok.type === 'link'" class="text-primary md-underline">{{ tok.text }}</text>
          <text v-else>{{ tok.text }}</text>
        </template>
      </text>

      <view v-else-if="block.type === 'quote'" class="flex flex-row gap-3">
        <view class="quote-bar rounded-full" />
        <text class="text-base text-muted flex-1 md-line">
          <template v-for="(tok, ti) in block.inline" :key="ti">
            <text v-if="tok.type === 'bold'" class="font-bold">{{ tok.text }}</text>
            <text v-else-if="tok.type === 'code'" class="md-inline-code">{{ tok.text }}</text>
            <text v-else>{{ tok.text }}</text>
          </template>
        </text>
      </view>

      <view v-else-if="block.type === 'list'" class="flex flex-col gap-1.5">
        <view
          v-for="(item, ii) in block.items"
          :key="ii"
          class="flex flex-row gap-2"
        >
          <text class="text-base text-dimmed md-marker">{{ block.ordered ? `${ii + 1}.` : '•' }}</text>
          <text class="text-base text-default flex-1 md-line">
            <template v-for="(tok, ti) in item" :key="ti">
              <text v-if="tok.type === 'bold'" class="font-bold text-highlighted">{{ tok.text }}</text>
              <text v-else-if="tok.type === 'italic'" class="md-italic">{{ tok.text }}</text>
              <text v-else-if="tok.type === 'code'" class="md-inline-code">{{ ' ' + tok.text + ' ' }}</text>
              <text v-else-if="tok.type === 'link'" class="text-primary md-underline">{{ tok.text }}</text>
              <text v-else>{{ tok.text }}</text>
            </template>
          </text>
        </view>
      </view>

      <view v-else-if="block.type === 'code'" class="rounded-md border border-default bg-muted overflow-hidden">
        <view v-if="block.lang" class="flex flex-row px-3 py-1.5 border-b border-default">
          <text class="text-xs text-dimmed">{{ block.lang }}</text>
        </view>
        <scroll-view scroll-x class="w-full">
          <view class="flex flex-col px-3 py-2.5">
            <text v-for="(line, li) in codeLines(block.code)" :key="li" class="md-code-line">
              <template v-for="(tok, ti) in line" :key="ti">
                <text :class="`tok-${tok.kind}`">{{ tok.text }}</text>
              </template>
              <text v-if="!line.length"> </text>
            </text>
          </view>
        </scroll-view>
      </view>

      <view v-else-if="block.type === 'hr'" class="h-px bg-accented" />
    </template>
  </view>
</template>

<style>
.md-line {
  line-height: 26px;
}
.md-inline-code {
  background-color: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  font-family: monospace;
  font-size: 14px;
  border-radius: 4px;
}
.md-underline {
  text-decoration: underline;
}
.md-italic {
  font-style: italic;
}
.md-marker {
  line-height: 26px;
}
.quote-bar {
  width: 3px;
  background-color: var(--ui-border-accented);
}
.md-code-line {
  font-family: monospace;
  font-size: 13px;
  line-height: 20px;
  white-space: pre;
}
</style>
