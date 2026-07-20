import { useBlogPages, type BlogItem } from './use-blog-pages';

export type LatestBlogConfig = {
  /**
   * Specify a blog post by its filename (without extension) to use instead of the latest.
   */
  filename?: string;
  /**
   * Use an external link instead of a blog post.
   */
  externalLink?: string;
  /**
   * Custom text to display when using external link.
   */
  externalText?: string;
};

export type LatestBlogResult = {
  blog: BlogItem | null;
  text: string | null;
  link: string | null;
  isExternal: boolean;
};

/**
 * Hook to get the latest blog post or a specific blog post for display in badges/banners.
 */
export const useLatestBlog = (config?: LatestBlogConfig): LatestBlogResult => {
  const blogPages = useBlogPages();

  if (config?.externalLink) {
    return {
      blog: null,
      text: config.externalText || null,
      link: config.externalLink,
      isExternal: true,
    };
  }

  if (config?.filename) {
    const specificBlog = blogPages.find(
      (blog) => blog.filename === config.filename,
    );
    if (specificBlog) {
      return {
        blog: specificBlog,
        text: specificBlog.badgeText || specificBlog.title || null,
        link: specificBlog.link || null,
        isExternal: false,
      };
    }
  }

  const latestBlog = blogPages[0] || null;
  if (latestBlog) {
    return {
      blog: latestBlog,
      text: latestBlog.badgeText || latestBlog.title || null,
      link: latestBlog.link || null,
      isExternal: false,
    };
  }

  return {
    blog: null,
    text: null,
    link: null,
    isExternal: false,
  };
};
