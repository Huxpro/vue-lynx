<script lang="ts">
// Ported from elk: app/components/account/AccountDisplayName.vue —
// display name with custom emoji rendered inline.
import type { mastodon } from 'masto';
import type { PropType } from 'vue-lynx';
import { defineComponent, h } from 'vue-lynx';
import { nameToVNode } from '../composables/content-render';

export default defineComponent({
  name: 'AccountDisplayName',
  props: {
    account: { type: Object as PropType<mastodon.v1.Account>, required: true },
    bold: { type: Boolean, default: true },
    fontSize: { type: Number, default: 15 },
  },
  setup(props) {
    return () => h(
      'text',
      {
        class: props.bold ? 'account-display-name account-display-name-bold' : 'account-display-name',
        style: { fontSize: `${props.fontSize}px` },
      },
      nameToVNode(props.account),
    );
  },
});
</script>

<style>
.account-display-name {
  color: var(--c-text-base);
}

.account-display-name-bold {
  font-weight: 600;
}
</style>
