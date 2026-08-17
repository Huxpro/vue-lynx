export function toHost(url: string): string {
  if (!url) return '';
  const host = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const parts = host.split('.').slice(-3);
  if (parts[0] === 'www') parts.shift();
  return parts.join('.');
}

export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + 's'}`;
}

const entityMap: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&#x27;': "'", '&#x2F;': '/', '&nbsp;': ' ',
};

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&[#\w]+;/g, (m) => entityMap[m] ?? m);
}
