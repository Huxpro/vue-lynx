export function toBlogPath(link?: string) {
  if (!link) {
    return '/blog/';
  }

  if (/^(https?:)?\/\//.test(link)) {
    return link;
  }

  return link.startsWith('/') ? link : `/${link}`;
}

export function getBlogIndexPath(lang: string) {
  return lang === 'zh' ? '/zh/blog/' : '/blog/';
}
