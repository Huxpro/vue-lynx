// Ported from elk: app/composables/users.ts (de-Nuxted, single-session).
// Elk persists multi-account state in localStorage/IndexedDB and reloads the
// page on account switch — both browser-only. Here a session is a pair of
// (server, token?) module refs; token absent = anonymous public browsing,
// exactly Elk's `publicServer` guest mode.
import type { mastodon } from 'masto';
import { computed, ref, shallowRef } from 'vue-lynx';

export interface UserLogin {
  server: string;
  token?: string;
  account?: mastodon.v1.Account;
}

// Elk defaults to m.webtoo.ls; mas.to is used here because it also serves
// anonymous public timelines AND has trends enabled, so the explore page
// has data. (mastodon.social requires auth for these APIs since 4.5.)
export const DEFAULT_SERVER = 'mas.to';

export const currentUser = ref<UserLogin | undefined>();
export const publicServer = ref(DEFAULT_SERVER);
export const publicInstance = shallowRef<mastodon.v2.Instance | null>(null);

export const currentServer = computed<string>(
  () => currentUser.value?.server || publicServer.value,
);
export const currentInstance = computed<mastodon.v2.Instance | null>(
  () => publicInstance.value,
);

export function getInstanceDomain(instance: mastodon.v2.Instance) {
  return instance.domain;
}

export function getInstanceDomainFromServer(server: string) {
  return currentInstance.value && currentServer.value === server
    ? getInstanceDomain(currentInstance.value)
    : server;
}

export function checkLogin() {
  return !!currentUser.value?.token;
}
