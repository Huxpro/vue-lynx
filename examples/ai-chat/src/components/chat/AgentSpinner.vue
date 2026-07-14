<script setup lang="ts">
import { useSpinnerFrame } from '../../composables/useSpinnerFrame';
import { dots2 } from '../../lib/agent-spinner';

const frame = useSpinnerFrame(dots2.frames, dots2.interval);
</script>

<template>
  <view class="agent-spinner shrink-0 flex items-center justify-center">
    <text class="agent-spinner-frame text-muted">{{ frame }}</text>
  </view>
</template>

<style>
.agent-spinner {
  width: 16px;
  height: 16px;
}

.agent-spinner-frame {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
}
</style>
