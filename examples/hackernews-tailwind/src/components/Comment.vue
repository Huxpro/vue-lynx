<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import type { CommentData } from '../api';
import { pluralize, stripHtml } from '../utils';

defineProps<{
  comment: CommentData;
  depth?: number;
}>();

const router = useRouter();
const open = ref(true);

function goToUser(userId: string) {
  router.push(`/user/${userId}`);
}
</script>

<template>
  <view
    v-if="comment && comment.user"
    class="flex flex-col border-t border-hn-border"
    :style="{ paddingLeft: `${(depth ?? 0) * 24}px` }"
  >
    <!-- Comment header -->
    <view class="flex flex-row" :style="{ gap: '6px', paddingTop: '1em' }">
      <text
        :style="{ color: '#222', fontSize: '0.9em', textDecorationLine: 'underline' }"
        @tap="goToUser(comment.user)"
      >
        {{ comment.user }}
      </text>
      <text :style="{ color: '#595959', fontSize: '0.9em' }">
        {{ comment.time_ago }}
      </text>
    </view>

    <!-- Comment body -->
    <view :style="{ paddingTop: '0.5em', paddingBottom: '0.5em' }">
      <text :style="{ color: '#2e495e', fontSize: '0.9em', lineHeight: '1.5em' }">
        {{ stripHtml(comment.content) }}
      </text>
    </view>

    <!-- Toggle children -->
    <view v-if="comment.comments && comment.comments.length">
      <view
        :style="{
          backgroundColor: open ? 'transparent' : '#fffbf2',
          borderRadius: '4px',
          padding: open ? '0' : '0.3em 0.5em',
          alignSelf: 'flex-start',
          marginBottom: open ? '0' : '0.5em',
        }"
        @tap="open = !open"
      >
        <text :style="{ color: '#222', fontSize: '0.9em' }">
          {{
            open
              ? '[-]'
              : '[+] ' + pluralize(comment.comments.length, 'reply', 'replies') + ' collapsed'
          }}
        </text>
      </view>
    </view>

    <!-- Nested comments -->
    <template v-if="open && comment.comments">
      <Comment
        v-for="child in comment.comments"
        :key="child.id"
        :comment="child"
        :depth="(depth ?? 0) + 1"
      />
    </template>
  </view>
</template>
