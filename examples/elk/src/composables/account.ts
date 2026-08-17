// Ported from elk: app/composables/masto/account.ts — near-verbatim.
import type { mastodon } from 'masto';
import { currentInstance, currentServer, currentUser, getInstanceDomain } from './users';

const EMOJI_REGEX = /:([\w-]+):/g;

export function getDisplayName(account: mastodon.v1.Account, options?: { rich?: boolean }) {
  const displayName = account.displayName || account.username || account.acct || '';
  if (options?.rich)
    return displayName;
  return displayName.replace(EMOJI_REGEX, '');
}

export function accountToShortHandle(acct: string) {
  return `@${acct.includes('@') ? acct.split('@')[0] : acct}`;
}

export function getShortHandle({ acct }: mastodon.v1.Account) {
  if (!acct)
    return '';
  return accountToShortHandle(acct);
}

export function getServerName(account: mastodon.v1.Account) {
  if (account.acct?.includes('@'))
    return account.acct.split('@')[1];
  return currentInstance.value ? getInstanceDomain(currentInstance.value) : currentServer.value;
}

export function getFullHandle(account: mastodon.v1.Account) {
  const handle = `@${account.acct}`;
  if (!currentUser.value || account.acct.includes('@'))
    return handle;
  return `${handle}@${getServerName(account)}`;
}

export function extractAccountHandle(account: mastodon.v1.Account) {
  let handle = getFullHandle(account).slice(1);
  const uri = currentInstance.value
    ? getInstanceDomain(currentInstance.value)
    : currentServer.value;
  if (currentInstance.value && handle.endsWith(`@${uri}`))
    handle = handle.slice(0, -uri.length - 1);

  return handle;
}
