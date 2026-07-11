// Ported from elk: app/composables/cache.ts.
// Elk uses lru-cache (max 1000); a Map-based LRU keeps the dependency
// footprint of the Lynx bundle small with identical behavior at this size.
import type { mastodon } from 'masto';
import { useMastoClient } from './masto';
import { currentServer, currentUser, getInstanceDomainFromServer } from './users';

const MAX_ENTRIES = 1000;
const cache = new Map<string, any>();

function cacheGet(key: string): any {
  if (!cache.has(key)) return undefined;
  const value = cache.get(key);
  // refresh recency
  cache.delete(key);
  cache.set(key, value);
  return value;
}

export function setCached(key: string, value: any, override = false) {
  if (override || !cache.has(key)) {
    cache.delete(key);
    cache.set(key, value);
    if (cache.size > MAX_ENTRIES) {
      const oldest = cache.keys().next().value!;
      cache.delete(oldest);
    }
  }
}

function removeCached(key: string) {
  cache.delete(key);
}

function userKey() {
  return `${currentServer.value}:${currentUser.value?.account?.id}`;
}

export function fetchStatus(id: string, force = false): Promise<mastodon.v1.Status> {
  const key = `${userKey()}:status:${id}`;
  const cached = cacheGet(key);
  if (cached && !force) return Promise.resolve(cached);

  const promise = useMastoClient().v1.statuses.$select(id).fetch().then((status) => {
    cacheStatus(status);
    return status;
  });
  setCached(key, promise, true);
  return promise;
}

export function fetchAccountById(id?: string | null): Promise<mastodon.v1.Account | null> {
  if (!id) return Promise.resolve(null);

  const server = currentServer.value;
  const key = `${userKey()}:account:${id}`;
  const cached = cacheGet(key);
  if (cached) return Promise.resolve(cached);

  const domain = getInstanceDomainFromServer(server);
  const promise = useMastoClient().v1.accounts.$select(id).fetch().then((r) => {
    if (r.acct && !r.acct.includes('@') && domain)
      r.acct = `${r.acct}@${domain}`;
    cacheAccount(r, server, true);
    return r;
  });
  setCached(key, promise, true);
  return promise;
}

export function fetchAccountByHandle(acct: string): Promise<mastodon.v1.Account> {
  const server = currentServer.value;
  const domain = getInstanceDomainFromServer(server);
  const userAcct = domain && acct.endsWith(`@${domain}`)
    ? acct.slice(0, -domain.length - 1)
    : acct;
  const key = `${userKey()}:account:${userAcct}`;
  const cached = cacheGet(key);
  if (cached) return Promise.resolve(cached);

  const promise = useMastoClient().v1.accounts.lookup({ acct: userAcct }).then((account) => {
    if (account.acct && !account.acct.includes('@') && domain)
      account.acct = `${account.acct}@${domain}`;
    cacheAccount(account, server, true);
    return account;
  });
  setCached(key, promise, true);
  return promise;
}

export function fetchTag(tagName: string, force = false): Promise<mastodon.v1.Tag> {
  const key = `${userKey()}:tag:${tagName}`;
  const cached = cacheGet(key);
  if (cached && !force) return Promise.resolve(cached);

  const promise = useMastoClient().v1.tags.$select(tagName).fetch().then((tag) => {
    cacheTag(tag);
    return tag;
  });
  setCached(key, promise, true);
  return promise;
}

export function cacheStatus(status: mastodon.v1.Status, server = currentServer.value, override?: boolean) {
  const userId = currentUser.value?.account?.id;
  setCached(`${server}:${userId}:status:${status.id}`, status, override);
}

export function removeCachedStatus(id: string, server = currentServer.value) {
  const userId = currentUser.value?.account?.id;
  removeCached(`${server}:${userId}:status:${id}`);
}

export function cacheAccount(account: mastodon.v1.Account, server = currentServer.value, override?: boolean) {
  const userId = currentUser.value?.account?.id;
  const userAcct = account.acct.endsWith(`@${server}`)
    ? account.acct.slice(0, -server.length - 1)
    : account.acct;
  setCached(`${server}:${userId}:account:${account.id}`, account, override);
  setCached(`${server}:${userId}:account:${userAcct}`, account, override);
}

export function cacheTag(tag: mastodon.v1.Tag, server = currentServer.value, override?: boolean) {
  const userId = currentUser.value?.account?.id;
  setCached(`${server}:${userId}:tag:${tag.name}`, tag, override);
}
