import { useState } from 'react';
import { useLang } from '@rspress/core/runtime';
import { renderInlineMarkdown } from '@rspress/core/theme';
import useIfMobile from '../../../theme/hooks/use-if-mobile';
import { useBlogPages, useTiltEffect } from '../../hooks';
import { toBlogPath } from '../../lib/utils';
import { BlogAvatar } from '../blog-avatar';
import { BorderBeam } from '../home-comps/border-beam';
import { MeteorsBackground } from '../home-comps/meteors-background';
import styles from './index.module.scss';

const subtitleText = {
  en: {
    text: 'Release notes and announcements for Vue Lynx. Follow',
    suffix: 'to stay up to date.',
  },
  zh: {
    text: 'Vue Lynx 在此发布版本说明和官方公告。关注',
    suffix: '以获取最新动态。',
  },
};

function BlogCard({
  date,
  description,
  link,
  title,
  authors,
  lang,
  variant = 'grid',
}: {
  date?: Date;
  description?: string;
  link?: string;
  title?: string;
  authors?: string[];
  lang: string;
  variant?: 'featured' | 'grid';
}) {
  const isFeatured = variant === 'featured';
  const blogPath = toBlogPath(link);
  const [isBeamActive, setIsBeamActive] = useState(false);

  return (
    <a
      href={blogPath}
      className={`${styles.card} ${isFeatured ? styles.featured : styles.gridItem}`}
      data-tilt-card
      onMouseEnter={() => setIsBeamActive(true)}
      onMouseLeave={() => setIsBeamActive(false)}
      onFocus={() => setIsBeamActive(true)}
      onBlur={() => setIsBeamActive(false)}
    >
      {isBeamActive && (
        <BorderBeam className={styles.beam} size={2} duration={3} />
      )}
      {date && (
        <span className={styles.date}>
          {new Intl.DateTimeFormat(lang, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(date)}
        </span>
      )}
      {title && (
        <div className={isFeatured ? styles.featuredTitle : styles.title}>
          {title}
        </div>
      )}
      {description && (
        <div
          className={
            isFeatured ? styles.featuredDescription : styles.description
          }
        >
          <p {...renderInlineMarkdown(description)} style={{ margin: 0 }} />
        </div>
      )}
      {authors && (
        <div className={styles.footer}>
          <BlogAvatar
            list={authors}
            className={styles.avatarOverride}
            compact
          />
        </div>
      )}
    </a>
  );
}

export function BlogList({ limit }: { limit?: number }) {
  const blogPages = useBlogPages();
  const lang = useLang() as 'en' | 'zh';
  const isMobile = useIfMobile();

  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  const pages = limitNum ? blogPages.slice(0, limitNum) : blogPages;
  const isEmbedded = !!limitNum;

  const featuredPost = !isEmbedded && pages.length > 0 ? pages[0] : null;
  const gridPosts = !isEmbedded ? pages.slice(1) : pages;

  useTiltEffect('[data-tilt-card]', { isMobile });

  return (
    <div className={styles.blogPage}>
      {!isEmbedded && <MeteorsBackground gridSize={120} meteorCount={3} />}

      {!isEmbedded && (
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {lang === 'zh' ? '博客' : 'Blog'}
          </h1>
          <p className={styles.subtitle}>
            {subtitleText[lang].text}{' '}
            <a
              href="https://x.com/huxpro"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.xLink}
            >
              @huxpro
            </a>{' '}
            {subtitleText[lang].suffix}
          </p>
        </header>
      )}

      {featuredPost && (
        <section className={styles.featuredSection}>
          <BlogCard {...featuredPost} lang={lang} variant="featured" />
        </section>
      )}

      {gridPosts.length > 0 && (
        <section className={styles.grid}>
          {gridPosts.map((post, index) => (
            <BlogCard
              key={post.link || index}
              {...post}
              lang={lang}
              variant="grid"
            />
          ))}
        </section>
      )}
    </div>
  );
}
