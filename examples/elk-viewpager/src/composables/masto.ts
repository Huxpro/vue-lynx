// Ported from elk: app/composables/masto/masto.ts.
// Reuses masto.js `createRestAPIClient` unchanged. Differences from Elk:
// - module singleton instead of Nuxt `$masto` injection
// - no streaming client: the Lynx JS runtime has no WebSocket, and Elk's
//   guest mode doesn't stream either (see PRD "Core infrastructure")
import type { mastodon } from 'masto';
import { createRestAPIClient } from 'masto';
import { shallowRef } from 'vue-lynx';
import { currentUser, publicInstance, publicServer, type UserLogin } from './users';

const client = shallowRef<mastodon.rest.Client>(undefined as never);

export function useMastoClient() {
  return client.value;
}

declare const __ELK_API_PROXY__: string;

export function mastoLogin(user: UserLogin) {
  // __ELK_API_PROXY__ is a build-time define, empty except in verification
  // builds behind a TLS-blocking sandbox proxy (see PORTING.md). The relay
  // routes bare /api/* paths to its configured target instance, because
  // masto's `new URL(path, base)` would drop any base path prefix.
  const url = __ELK_API_PROXY__ || `https://${user.server}`;
  client.value = createRestAPIClient({ url, accessToken: user.token });

  if (user.token) {
    currentUser.value = user;
    client.value.v1.accounts.verifyCredentials().then((account) => {
      currentUser.value = { ...user, account: account as unknown as mastodon.v1.Account };
    });
  }
  else {
    publicServer.value = user.server;
  }

  // Refetch instance info in the background on login (Elk does the same,
  // including the v1 fallback for pre-v2 servers — dropped here for brevity).
  client.value.v2.instance.fetch()
    .then((instance) => {
      publicInstance.value = instance;
    })
    .catch(() => {});

  return client.value;
}
