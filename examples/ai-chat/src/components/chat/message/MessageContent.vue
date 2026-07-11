<script setup lang="ts">
import { computed } from 'vue-lynx';

import { collectSources, getMergedParts } from '../../../lib/ai-utils';
import type { UIMessage } from '../../../types/ai';
import {
  getToolName,
  isFileUIPart,
  isPartStreaming,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
} from '../../../types/ai';
import FilePreview from '../FilePreview.vue';
import MarkdownView from '../MarkdownView.vue';
import ReasoningPart from '../ReasoningPart.vue';
import SourceLink from '../SourceLink.vue';
import ToolChart from '../tool/Chart.vue';
import ToolSearch from '../tool/Search.vue';
import ToolWeather from '../tool/Weather.vue';
import MessageEdit from './MessageEdit.vue';

/** Port of app/components/chat/message/MessageContent.vue. */
const props = defineProps<{
  message: UIMessage;
  editing: boolean;
}>();

const emit = defineEmits<{
  save: [message: UIMessage, text: string];
  cancelEdit: [];
}>();

const merged = computed(() => getMergedParts(props.message.parts));
const sources = computed(() => collectSources(props.message.parts));
const fileParts = computed(() => props.message.parts.filter(isFileUIPart));
</script>

<template>
  <view class="flex flex-col gap-3">
    <view v-if="fileParts.length" class="flex flex-row flex-wrap gap-2 justify-end">
      <FilePreview
        v-for="(file, fi) in fileParts"
        :key="`${message.id}-file-${fi}`"
        :name="file.url"
        :type="file.mediaType"
        :preview-url="file.url"
        :size="96"
      />
    </view>

    <template v-for="(part, index) in merged" :key="`${message.id}-${part.type}-${index}`">
      <ReasoningPart
        v-if="isReasoningUIPart(part)"
        :text="part.text"
        :streaming="isPartStreaming(part)"
      />

      <template v-else-if="isToolUIPart(part)">
        <ToolChart v-if="getToolName(part) === 'chart'" :invocation="part" />
        <ToolWeather v-else-if="getToolName(part) === 'weather'" :invocation="part" />
        <ToolSearch
          v-else-if="getToolName(part) === 'web_search' || getToolName(part) === 'google_search'"
          :invocation="part"
        />
      </template>

      <template v-else-if="isTextUIPart(part)">
        <MarkdownView
          v-if="message.role === 'assistant'"
          :markdown="part.text"
          :streaming="isPartStreaming(part)"
        />
        <template v-else-if="message.role === 'user'">
          <MessageEdit
            v-if="editing"
            :message="message"
            :text="part.text"
            @save="(msg, text) => emit('save', msg, text)"
            @cancel="emit('cancelEdit')"
          />
          <text v-else class="text-base text-highlighted user-text">{{ part.text }}</text>
        </template>
      </template>
    </template>

    <view v-if="sources.length && message.role === 'assistant'" class="flex flex-row flex-wrap gap-1.5">
      <SourceLink
        v-for="source in sources"
        :key="source.sourceId"
        :url="source.url"
        :title="source.title"
      />
    </view>
  </view>
</template>

<style>
.user-text {
  line-height: 24px;
  white-space: pre-wrap;
}
</style>
