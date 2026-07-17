/**
 * Port of app/utils/url.ts — regex-based instead of the URL API, which
 * isn't guaranteed on Lynx background threads.
 */
export function getFileName(url: string): string {
  const path = url.split('?')[0]!.split('#')[0]!;
  const name = path.split('/').pop();
  return name ? decodeURIComponent(name) : 'file';
}

export function getDomain(url: string): string {
  const match = url.match(/^[a-z]+:\/\/([^/?#]+)/i);
  return (match ? match[1]! : url).replace(/^www\./, '');
}

export function getFaviconUrl(url: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${getDomain(url)}`;
}
