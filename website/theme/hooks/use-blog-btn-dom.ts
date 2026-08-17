import { useCallback, useEffect, useMemo } from 'react';
import { useLang, useNavigate, usePageData } from '@rspress/core/runtime';
import { useLatestBlog } from '../../src/hooks';

const fallbackText = {
  zh: '阅读最新博客',
  en: 'Read the Latest Blog',
};

/**
 * Drive the home hero badge from the latest blog post (same pattern as lynx-website).
 */
const useBlogBtnDom = () => {
  const { page } = usePageData();
  const navigate = useNavigate();
  const lang = useLang() as 'en' | 'zh';

  const {
    text: blogText,
    link: blogLink,
    isExternal,
  } = useLatestBlog();

  const handleInteraction = useCallback(() => {
    if (!blogLink) return;

    if (isExternal) {
      window.open(blogLink, '_blank');
    } else {
      navigate(blogLink);
    }
  }, [navigate, blogLink, isExternal]);

  const displayText = useMemo(() => {
    return blogText || fallbackText[lang];
  }, [blogText, lang]);

  useEffect(() => {
    if (page.pageType !== 'home') return;

    const badgeElement = document.querySelector<HTMLElement>(
      '.rp-home-hero__badge',
    );
    const h1 = document.querySelector('.rp-home-hero__title');
    if (!h1 || !badgeElement) return;

    badgeElement.className = 'rp-home-hero__badge active-hover';
    badgeElement.textContent = displayText;
    badgeElement.style.opacity = '1';

    badgeElement.addEventListener('click', handleInteraction);
    badgeElement.addEventListener('touchstart', handleInteraction);

    return () => {
      badgeElement.removeEventListener('click', handleInteraction);
      badgeElement.removeEventListener('touchstart', handleInteraction);
    };
  }, [displayText, handleInteraction, page.pageType]);
};

export { useBlogBtnDom };
