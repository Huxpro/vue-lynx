import { useLang, usePages } from '@rspress/core/runtime';

export type BlogItem = {
  title?: string;
  description?: string;
  date?: Date;
  link?: string;
  authors?: string[];
  /**
   * Custom text to display in badge or banner.
   * Defined in the frontmatter of the blog post.
   */
  badgeText?: string;
  /**
   * The filename of the blog post (without extension).
   * E.g. 'announcing-vue-lynx' for 'announcing-vue-lynx.mdx'
   */
  filename?: string;
};

/**
 * Hook to get all blog pages sorted by date (newest first).
 */
export const useBlogPages = (): BlogItem[] => {
  const { pages } = usePages();
  const lang = useLang();

  const blogPages = pages
    .filter((page) => page.lang === lang)
    .filter(
      (page) =>
        page.routePath.includes('/blog/') && !page.routePath.endsWith('/blog/'),
    )
    .sort((a, b) => {
      const dateA = a.frontmatter?.date
        ? new Date(a.frontmatter?.date as string)
        : new Date(0);
      const dateB = b.frontmatter?.date
        ? new Date(b.frontmatter?.date as string)
        : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

  return blogPages.map(
    ({
      frontmatter: { description, date, authors, badge_text },
      routePath,
      title,
    }) => {
      const itemDate = date ? new Date(date as string) : undefined;
      const filename = routePath.split('/').pop();
      return {
        date: itemDate,
        description: description as string | undefined,
        link: routePath,
        title,
        authors: authors as string[] | undefined,
        badgeText: badge_text as string | undefined,
        filename,
      };
    },
  );
};
