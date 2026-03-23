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
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&nbsp;': ' ',
};

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&[#\w]+;/g, (m) => entityMap[m] ?? m)
    .trim();
}

export function openExternalUrl(url: string): void {
  if (!url) return;

  const scope = globalThis as typeof globalThis & {
    open?: (url: string, target?: string) => unknown;
    location?: { href?: string };
  };

  if (typeof scope.open === 'function') {
    scope.open(url, '_blank');
    return;
  }

  if (scope.location) {
    scope.location.href = url;
  }
}
