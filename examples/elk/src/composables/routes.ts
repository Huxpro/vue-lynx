// Ported from elk: app/composables/masto/routes.ts.
// Elk resolves Nuxt file-based routes; these build paths for our explicit
// route table (src/router.ts) instead.
import type { mastodon } from 'masto';
import { extractAccountHandle } from './account';
import { currentServer } from './users';

export function getAccountRoute(account: mastodon.v1.Account) {
  return `/${currentServer.value}/@${extractAccountHandle(account)}`;
}

export function getStatusRoute(status: mastodon.v1.Status) {
  return `/${currentServer.value}/status/${status.id}`;
}

export function getTagRoute(tag: string) {
  return `/${currentServer.value}/tags/${tag}`;
}
