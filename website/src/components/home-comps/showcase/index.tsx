import type React from 'react';
import { useLang } from '@rspress/core/runtime';
import styles from './index.module.scss';

const showCaseList = [
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
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label={`${item.title[lang]} preview`}
                >
                  <source src={item.video} type="video/mp4" />
                </video>
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
