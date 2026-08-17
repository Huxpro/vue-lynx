<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import type { CommentData } from '../api';
import { pluralize, stripHtml } from '../utils';

defineProps<{
  comment: CommentData;
}>();

const router = useRouter();
const open = ref(true);

function goToUser(userId: string) {
  router.push(`/user/${userId}`);
}
</script>

<template>
  <view v-if="comment && comment.user" class="comment">
    <view class="by">
      <text class="by-link" @tap="goToUser(comment.user)">{{ comment.user }}</text>
      <text>{{ comment.time_ago }}</text>
    </view>

    <text class="text">{{ stripHtml(comment.content) }}</text>

    <view
      v-if="comment.comments && comment.comments.length"
      class="toggle"
      :class="{ open }"
      @tap="open = !open"
    >
      <text class="toggle-label">
        {{
          open
            ? '[-]'
            : '[+] ' + pluralize(comment.comments.length, 'reply', 'replies') + ' collapsed'
        }}
      </text>
    </view>

    <view v-if="open && comment.comments && comment.comments.length" class="comment-children">
      <Comment
        v-for="childComment in comment.comments"
        :key="childComment.id"
        :comment="childComment"
      />
    </view>
  </view>
</template>

<style lang="scss">
.comment-children {
  .comment-children {
    margin-left: 1.5em;
  }
}

.comment {
  border-top: 1px solid #eee;
  position: relative;

  .by,
  .text,
  .toggle {
    font-size: 0.9em;
    margin: 1em 0;
  }

  .by {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    color: #222;
    gap: 0.4em;
  }

  .by-link {
    color: #222;
    text-decoration: underline;
  }

  .text {
    overflow-wrap: break-word;
    white-space: pre-wrap;
    line-height: 1.4em;
  }

  .toggle {
    background-color: #fffbf2;
    padding: 0.3em 0.5em;
    border-radius: 4px;
    align-self: flex-start;

    &.open {
      padding: 0;
      background-color: transparent;
      margin-bottom: -0.5em;
    }
  }

  .toggle-label {
    color: #222;
  }
}
</style>
