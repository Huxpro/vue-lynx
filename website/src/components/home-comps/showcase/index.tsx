import type React from 'react';
import styles from './index.module.scss';

const showCaseList = [
  {
    title: 'Two-Column Waterfall Gallery',
    desc: 'Cover everything you need to know to start building with Vue Lynx.',
    link: '/guide/tutorial-gallery',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/ifr.mp4',
  },
  {
    title: 'Product Detail with Carousel',
    desc: 'Deep dive into main thread scripting by building a highly responsive swiper.',
    link: '/guide/tutorial-swiper',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/mts.mp4',
  },
];

export const ShowCase: React.FC = () => {
  return (
    <div className={styles['show-case-frame']}>
      <div className={styles['title']}>Try it for yourself</div>
      <div className={styles['desc']}>
        Experience true native feel, instant launch, and silky interactions.
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
                  aria-label={`${item.title} preview`}
                >
                  <source src={item.video} type="video/mp4" />
                </video>
              </div>
            </div>
            <div className={styles['item-title']}>{item.title}</div>
            <div className={styles['item-desc']}>{item.desc}</div>
            <a href={item.link} className={styles['item-link']}>
              Learn by doing &rarr;
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
