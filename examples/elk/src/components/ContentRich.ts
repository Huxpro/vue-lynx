// Ported from elk: app/components/content/ContentRich.vue.
// Elk renders a <span class="content-rich"> via contentToVNode; here the
// wrapper is a <view> column of Lynx text blocks.
import type { mastodon } from 'masto';
import type { PropType } from 'vue-lynx';
import { defineComponent, h } from 'vue-lynx';
import { useRouter } from 'vue-router';
import { contentToVNode } from '../composables/content-render';

export default defineComponent({
  name: 'ContentRich',
  props: {
    content: { type: String, required: true },
    emojis: { type: Array as PropType<mastodon.v1.CustomEmoji[]>, default: undefined },
    mentions: { type: Array as PropType<mastodon.v1.StatusMention[]>, default: undefined },
    markdown: { type: Boolean, default: true },
    collapseMentionLink: { type: Boolean, default: false },
    status: { type: Object as PropType<mastodon.v1.Status>, default: undefined },
    inReplyToStatus: { type: Object as PropType<mastodon.v1.Status>, default: undefined },
  },
  setup(props) {
    const router = useRouter();
    return () => h(
      'view',
      { class: 'content-rich' },
      contentToVNode(props.content, {
        emojis: Object.fromEntries((props.emojis ?? []).map(e => [e.shortcode, e])),
        mentions: props.mentions,
        markdown: props.markdown,
        collapseMentionLink: props.collapseMentionLink,
        status: props.status,
        inReplyToStatus: props.inReplyToStatus,
      }, { router }),
    );
  },
});
