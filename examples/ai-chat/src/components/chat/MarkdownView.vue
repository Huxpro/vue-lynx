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

function alignmentStyle(alignment: 'left' | 'center' | 'right' | null) {
  return { textAlign: alignment ?? 'left' };
}

function tableStyle(columns: number) {
  return { width: `${Math.max(320, columns * 160)}px` };
}

function streamBlockStyle(index: number) {
  return {
    marginTop: index > 0 ? '16px' : '0px',
    animationDelay: props.streaming ? `${Math.min(index, 3) * 28}ms` : '0ms',
  };
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
  <!-- Each block gets a single <view> wrapper: Vue's v-if/v-else-if chains
       leave zero-size placeholder nodes as siblings, and Lynx flex `gap`
       adds space around EVERY child (placeholders included), which would
       otherwise multiply the spacing between blocks. Keeping the chain
       inside a per-block wrapper confines the placeholders. -->
  <!-- Spacing via per-block margin-top (bi > 0), not container `gap`: Lynx
       flex `gap` also spaces around the v-for fragment anchors (empty
       zero-size text nodes), which would add a phantom gap at the top. -->
  <view class="flex flex-col">
    <view
      v-for="(block, bi) in blocks"
      :key="bi"
      :class="streaming ? 'stream-block-enter' : ''"
      :style="streamBlockStyle(bi)"
    >
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

      <scroll-view
        v-else-if="block.type === 'table'"
        scroll-x
        class="md-table-scroll w-full"
      >
        <view
          class="md-table rounded-md border border-default overflow-hidden"
          :style="tableStyle(block.headers.length)"
        >
          <view class="flex flex-row bg-muted md-table-row">
            <view
              v-for="(cell, ci) in block.headers"
              :key="`header-${ci}`"
              class="md-table-cell px-3 py-2"
            >
              <text
                class="text-sm font-semibold text-highlighted md-line"
                :style="alignmentStyle(block.alignments[ci])"
              >
                <template v-for="(tok, ti) in cell" :key="ti">
                  <text v-if="tok.type === 'bold'" class="font-bold">{{ tok.text }}</text>
                  <text v-else-if="tok.type === 'italic'" class="md-italic">{{ tok.text }}</text>
                  <text v-else-if="tok.type === 'code'" class="md-inline-code">{{ ' ' + tok.text + ' ' }}</text>
                  <text v-else-if="tok.type === 'link'" class="text-primary md-underline">{{ tok.text }}</text>
                  <text v-else>{{ tok.text }}</text>
                </template>
              </text>
            </view>
          </view>

          <view
            v-for="(row, ri) in block.rows"
            :key="`row-${ri}`"
            class="flex flex-row md-table-row"
          >
            <view
              v-for="(cell, ci) in row"
              :key="`cell-${ri}-${ci}`"
              class="md-table-cell px-3 py-2"
            >
              <text
                class="text-sm text-default md-line"
                :style="alignmentStyle(block.alignments[ci])"
              >
                <template v-for="(tok, ti) in cell" :key="ti">
                  <text v-if="tok.type === 'bold'" class="font-bold text-highlighted">{{ tok.text }}</text>
                  <text v-else-if="tok.type === 'italic'" class="md-italic">{{ tok.text }}</text>
                  <text v-else-if="tok.type === 'code'" class="md-inline-code">{{ ' ' + tok.text + ' ' }}</text>
                  <text v-else-if="tok.type === 'link'" class="text-primary md-underline">{{ tok.text }}</text>
                  <text v-else>{{ tok.text }}</text>
                </template>
              </text>
            </view>
          </view>
        </view>
      </scroll-view>

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
    </view>
  </view>
</template>

<style>
.md-line {
  line-height: 28px;
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
  line-height: 28px;
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
.md-table-scroll {
  max-width: 100%;
}
.md-table-cell {
  width: 160px;
  border-right: 1px solid var(--ui-border);
}
.md-table-row {
  border-bottom: 1px solid var(--ui-border);
}
</style>
