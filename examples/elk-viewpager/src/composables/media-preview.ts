// Ported from elk: app/composables/dialog.ts (openMediaPreview slice).
// Elk's dialog composable manages modal state via history.pushState —
// browser-only; a module ref is the Lynx equivalent.
import type { mastodon } from 'masto';
import { ref } from 'vue-lynx';

export const mediaPreview = ref<mastodon.v1.MediaAttachment | null>(null);

export function openMediaPreview(attachment: mastodon.v1.MediaAttachment) {
  mediaPreview.value = attachment;
}
