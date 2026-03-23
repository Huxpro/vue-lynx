const _fetch: typeof fetch = globalThis.fetch ?? fetch;

const BASE_URL = 'https://api.hackerwebapp.com';

export interface FeedItem {
  id: number;
  title: string;
  url: string;
  user: string;
  points: number;
  time_ago: string;
  comments_count: number;
  type: string;
}

export interface ItemDetail {
  id: number;
  title: string;
  url: string;
  user: string;
  points: number;
  time_ago: string;
  comments_count: number;
  comments: CommentData[];
  content: string;
  type: string;
}

export interface CommentData {
  id: number;
  user: string;
  time_ago: string;
  content: string;
  comments: CommentData[];
}

export interface UserData {
  id: string;
  created: string;
  karma: number;
  about: string;
}

export const validFeeds: Record<string, { title: string; pages: number }> = {
  news: { title: 'News', pages: 10 },
  newest: { title: 'Newest', pages: 12 },
  ask: { title: 'Ask', pages: 2 },
  show: { title: 'Show', pages: 2 },
  jobs: { title: 'Jobs', pages: 1 },
};

export async function fetchFeed(
  feed: string,
  page: number,
): Promise<FeedItem[]> {
  const res = await _fetch(`${BASE_URL}/${feed}?page=${page}`);
  if (!res.ok) throw new Error(`Failed to fetch ${feed} page ${page}`);
  return res.json();
}

export async function fetchItem(id: number): Promise<ItemDetail> {
  const res = await _fetch(`${BASE_URL}/item/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch item ${id}`);
  return res.json();
}

export async function fetchUser(id: string): Promise<UserData> {
  // The hackerwebapp API doesn't have a working user endpoint,
  // so we use the official HN Firebase API and normalize the response.
  const res = await _fetch(
    `https://hacker-news.firebaseio.com/v0/user/${id}.json`,
  );
  if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
  const data = await res.json();
  if (!data) throw new Error(`User ${id} not found`);
  return {
    id: data.id,
    created: new Date(data.created * 1000).toLocaleDateString(),
    karma: data.karma,
    about: data.about || '',
  };
}
