import { useLang, usePageData } from '@rspress/core/runtime';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/core/theme';
import { getBlogIndexPath } from '../../lib/utils';
import { BlogAvatar } from '../blog-avatar';
import styles from './index.module.scss';

export function BlogHeader() {
  const lang = useLang();
  const { page } = usePageData();
  const authors = (page.frontmatter?.authors as string[]) ?? [];
  const blogIndexPath = getBlogIndexPath(lang);
  const date = page.frontmatter?.date
    ? new Date(page.frontmatter.date as string)
    : undefined;

  const formattedDate = date
    ? new Intl.DateTimeFormat(lang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    : undefined;

  return (
    <>
      <a href={blogIndexPath} className={styles.backLink}>
        ← {lang === 'zh' ? '所有文章' : 'All Posts'}
      </a>
      <div className={styles.blogHeader}>
        {formattedDate && <span className={styles.date}>{formattedDate}</span>}
        <BlogAvatar list={authors} className={styles.avatars} />
        {process.env.ENABLE_LLMS_UI && (
          <LlmsContainer>
            <LlmsCopyButton />
            <LlmsViewOptions />
          </LlmsContainer>
        )}
      </div>
    </>
  );
}
