// Ported from elk: app/composables/masto/search.ts.
// Same shape and debounce; Elk's `debouncedWatch` (VueUse) is inlined and
// `isHydrated` (SSR guard) dropped. `resolve` follows login state like Elk.
import type { mastodon } from 'masto';
import type { MaybeRefOrGetter } from 'vue-lynx';
import { computed, readonly, ref, toValue, watch } from 'vue-lynx';
import { useMastoClient } from './masto';
import { getAccountRoute, getStatusRoute, getTagRoute } from './routes';
import { currentUser } from './users';

export interface BuildSearchResult<K extends string, T> {
  id: string;
  type: K;
  data: T;
  to: string;
}
export type AccountSearchResult = BuildSearchResult<'account', mastodon.v1.Account>;
export type HashTagSearchResult = BuildSearchResult<'hashtag', mastodon.v1.Tag>;
export type StatusSearchResult = BuildSearchResult<'status', mastodon.v1.Status>;

export function useSearch(query: MaybeRefOrGetter<string>) {
  const done = ref(false);
  const loading = ref(false);
  const accounts = ref<AccountSearchResult[]>([]);
  const hashtags = ref<HashTagSearchResult[]>([]);
  const statuses = ref<StatusSearchResult[]>([]);

  const q = computed(() => toValue(query).trim());

  let paginator: mastodon.Paginator<mastodon.v2.Search, mastodon.rest.v2.SearchParams> | undefined;

  const appendResults = (results: mastodon.v2.Search, empty = false) => {
    if (empty) {
      accounts.value = [];
      hashtags.value = [];
      statuses.value = [];
    }
    accounts.value = [...accounts.value, ...results.accounts.map<AccountSearchResult>(account => ({
      type: 'account',
      id: account.id,
      data: account,
      to: getAccountRoute(account),
    }))];
    hashtags.value = [...hashtags.value, ...results.hashtags.map<HashTagSearchResult>(hashtag => ({
      type: 'hashtag',
      id: `hashtag-${hashtag.name}`,
      data: hashtag,
      to: getTagRoute(hashtag.name),
    }))];
    statuses.value = [...statuses.value, ...results.statuses.map<StatusSearchResult>(status => ({
      type: 'status',
      id: status.id,
      data: status,
      to: getStatusRoute(status),
    }))];
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(q, () => {
    loading.value = !!q.value;
    if (timer)
      clearTimeout(timer);
    timer = setTimeout(async () => {
      if (!q.value) {
        loading.value = false;
        return;
      }
      paginator = useMastoClient().v2.search.list({
        q: q.value,
        resolve: !!currentUser.value,
      });
      try {
        const nextResults = await paginator.values().next();
        done.value = !!nextResults.done;
        if (!nextResults.done)
          appendResults(nextResults.value, true);
      }
      catch (e) {
        console.error(e);
      }
      loading.value = false;
    }, 300);
  });

  const next = async () => {
    if (!q.value || !paginator || done.value || loading.value)
      return;

    loading.value = true;
    try {
      const nextResults = await paginator.values().next();
      done.value = !!nextResults.done;
      if (!nextResults.done)
        appendResults(nextResults.value);
    }
    catch (e) {
      console.error(e);
    }
    loading.value = false;
  };

  return {
    accounts,
    hashtags,
    statuses,
    loading: readonly(loading),
    done: readonly(done),
    next,
  };
}
