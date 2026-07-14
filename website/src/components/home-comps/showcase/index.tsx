import type React from 'react';
import { useLang } from '@rspress/core/runtime';
import styles from './index.module.scss';

interface ShowCaseItem {
  title: Record<'en' | 'zh', string>;
  desc: Record<'en' | 'zh', string>;
  link: string;
  video?: string;
  image?: string;
}

const showCaseList: ShowCaseItem[] = [
  {
    title: {
      en: 'Two-Column Waterfall Gallery',
      zh: '双列瀑布流画廊',
    },
    desc: {
      en: 'Cover everything you need to know to start building with Vue Lynx.',
      zh: '覆盖使用 Vue Lynx 开发所需的一切知识。',
    },
    link: '/guide/tutorial-gallery',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/ifr.mp4',
  },
  {
    title: {
      en: 'Product Detail with Carousel',
      zh: '带轮播的商品详情页',
    },
    desc: {
      en: 'Deep dive into main thread scripting by building a highly responsive swiper.',
      zh: '通过构建一个高响应性的轮播组件，深入学习主线程脚本。',
    },
    link: '/guide/tutorial-swiper',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/mts.mp4',
  },
  {
    title: {
      en: 'Elk — a Mastodon Client',
      zh: 'Elk — Mastodon 客户端',
    },
    desc: {
      en: 'A real product-grade app: Elk ported to a native Mastodon client, reusing its API and content layers.',
      zh: '真正产品级的应用：将 Elk 移植为原生 Mastodon 客户端，复用其 API 与内容渲染层。',
    },
    link: '/guide/elk',
    image: '/examples/elk/preview-image.png',
  },
];

const sectionTitle = {
  en: 'Try it for yourself',
  zh: '亲自体验',
};

const sectionDesc = {
  en: 'Experience true native feel, instant launch, and silky interactions.',
  zh: '体验真正的原生质感、瞬时启动和丝滑交互。',
};

const learnByDoing = {
  en: 'Learn by doing',
  zh: '边做边学',
};

export const ShowCase: React.FC = () => {
  const lang = useLang() as 'en' | 'zh';
  const localePrefix = lang === 'zh' ? '/zh' : '';

  return (
    <div className={styles['show-case-frame']}>
      <div className={styles['title']}>{sectionTitle[lang]}</div>
      <div className={styles['desc']}>
        {sectionDesc[lang]}
      </div>
      <ul className={styles['show-case-list']}>
        {showCaseList.map((item, index) => (
          <li className={styles['show-case-list-item']} key={index}>
            <div className={styles['mobile-show-frame']}>
              <div className={styles['preview']}>
                {item.video
                  ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label={`${item.title[lang]} preview`}
                    >
                      <source src={item.video} type="video/mp4" />
                    </video>
                  )
                  : (
                    <img
                      src={item.image}
                      alt={`${item.title[lang]} preview`}
                      loading="lazy"
                    />
                  )}
              </div>
            </div>
            <div className={styles['item-title']}>{item.title[lang]}</div>
            <div className={styles['item-desc']}>{item.desc[lang]}</div>
            <a href={`${localePrefix}${item.link}`} className={styles['item-link']}>
              {learnByDoing[lang]} &rarr;
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
