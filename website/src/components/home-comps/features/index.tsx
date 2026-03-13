import type React from 'react';
import { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { BorderBeam } from '../border-beam';

const FeatureIllustration: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles['feature-illustration']}>
      <img
        src={isDark ? '/assets/home/home-f-3-dark.svg' : '/assets/home/home-f-3.svg'}
        alt=""
      />
    </div>
  );
};

const featuresConfig = [
  {
    icon: (
      <svg viewBox="0 0 261.76 226.69" width="32" height="28">
        <path d="M161.096.001l-30.225 52.351L100.647.001H0l130.877 226.688L261.749.001z" fill="#42b883" />
        <path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#35495e" />
      </svg>
    ),
    title: 'Powered by Vue 3',
    desc: 'Full support for the Composition API, Single-File Components, and the reactivity system — the same Vue 3 APIs you already know and love.',
    actions: [
      { text: 'Composition API', link: 'https://vuejs.org/guide/extras/composition-api-faq.html' },
      { text: 'SFC', link: 'https://vuejs.org/guide/scaling-up/sfc.html' },
    ],
    isRowSet: 508,
  },
  {
    icon: (
      <svg viewBox="0 0 33 33" width="32" height="32">
        <path fill="#42b883" d="M 15.5,0.5 C 16.5,0.5 17.5,0.5 18.5,0.5C 18.5,4.83333 18.5,9.16667 18.5,13.5C 21.5,13.5 24.5,13.5 27.5,13.5C 24.516,20.1221 20.516,26.1221 15.5,31.5C 14.2801,31.1131 13.6135,30.2798 13.5,29C 14.3942,25.2238 14.7275,21.3905 14.5,17.5C 11.5,17.5 8.5,17.5 5.5,17.5C 5.35055,16.448 5.51722,15.448 6,14.5C 9.43419,9.94886 12.6009,5.28219 15.5,0.5 Z" />
      </svg>
    ),
    title: 'Made for Lynx',
    desc: "Dual-threaded Vue tailor-made for Lynx, carrying over Lynx's native UI responsiveness and main thread scripting.",
    illustration: 'item3',
  },
  {
    icon: (
      <svg viewBox="0 0 33 32" width="32" height="32">
        <path d="M26.0365 9.31438C25.2485 9.44996 24.5122 9.79741 23.9065 10.3195C23.3009 10.8416 22.8487 11.5186 22.5985 12.2781C22.4099 12.8675 22.0785 13.4012 21.6336 13.8314C21.1887 14.2617 20.6443 14.5752 20.0489 14.7439L18.2513 15.2427C17.5172 15.4473 16.7381 15.4221 16.0188 15.1706C15.2994 14.919 14.6744 14.4532 14.2278 13.8357L14.2137 13.8169C13.3817 12.6611 13.3102 11.144 13.9831 9.88943C14.5979 8.74598 14.8665 7.4483 14.7562 6.15475C14.6459 4.86121 14.1615 3.62774 13.362 2.60489C11.1512 -0.234581 7.02328 -0.846332 4.07652 1.23362C3.34004 1.74924 2.71493 2.40789 2.23846 3.17028C1.76199 3.93268 1.44392 4.78321 1.30322 5.67117C1.16252 6.55913 1.20206 7.46633 1.41949 8.33868C1.63692 9.21103 2.02779 10.0307 2.56879 10.7487C3.31802 11.7414 4.32511 12.5097 5.48052 12.97C6.63593 13.4303 7.89544 13.565 9.12206 13.3595C10.5366 13.1242 11.9643 13.6795 12.7973 14.8361L13.1031 15.2597C13.4889 15.7941 13.7236 16.4227 13.7824 17.0792C13.8412 17.7357 13.7219 18.3959 13.4373 18.9904L12.6448 20.6459C12.4004 21.1626 12.0385 21.6149 11.5879 21.9666C11.1373 22.3183 10.6106 22.5597 10.05 22.6713C9.26841 22.8193 8.5415 23.1764 7.94658 23.7046C7.35166 24.2327 6.91094 24.9122 6.67129 25.6707C5.99366 27.8119 7.0854 30.145 9.16912 31.0165C11.4957 31.9887 14.1478 30.8396 15.025 28.5158C15.2674 27.8752 15.3551 27.1863 15.281 26.5053C15.2069 25.8243 14.9731 25.1705 14.5986 24.5969C14.2624 24.0731 14.0664 23.4717 14.0295 22.8503C13.9926 22.229 14.116 21.6086 14.3878 21.0487L15.2819 19.1852C15.5111 18.708 15.8399 18.2853 16.246 17.9457C16.6522 17.6061 17.1264 17.3574 17.6367 17.2163L20.655 16.3778C21.8182 16.0549 23.0803 16.2836 24.0196 17.0385C24.5309 17.4496 25.1269 17.7422 25.7649 17.8953C26.4028 18.0485 27.0668 18.0583 27.7089 17.9241C30.1522 17.4149 31.6976 14.9905 31.0849 12.5623C30.5268 10.3468 28.3028 8.91533 26.0365 9.31344" fill="#42b883" />
      </svg>
    ),
    title: 'Compatible with Vue Ecosystem',
    desc: 'Bring your favorite Vue libraries and enjoy the rich Vue ecosystem on Lynx.',
  },
];

export const Features: React.FC = () => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div className={styles['features-frame']}>
      <div className={styles['list-frame']}>
        {featuresConfig.map((item, index) => (
          <div
            className={`${styles['list-item']} ${item.isRowSet ? styles['row-set'] : ''}`}
            key={index}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            style={item.isRowSet ? { paddingRight: `${item.isRowSet}px` } : {}}
          >
            <div className={styles['title-icon']}>{item.icon}</div>
            <div className={styles['title']}>{item.title}</div>
            <div className={styles['desc']}>{item.desc}</div>
            {item.actions?.length > 0&& (
              <div className={styles['action-frame']}>
                {item.actions.map((action, i) => (
                  <a
                    key={i}
                    className={styles['action-btn']}
                    href={action.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {action.text}
                  </a>
                ))}
              </div>
            )}
            {item.illustration && <FeatureIllustration />}
            {hoverIndex === index && <BorderBeam size={2} duration={3} />}
          </div>
        ))}
      </div>
    </div>
  );
};
