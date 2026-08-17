import type React from 'react';
import { useLang } from '@rspress/core/runtime';
import styles from './index.module.scss';
import { DotPattern } from './DotPattern';

const i18n = {
  startBuilding: { en: 'Start building with', zh: '开始使用' },
  quickStart: { en: 'Quick Start', zh: '快速开始' },
};

export const Banner: React.FC = () => {
  const lang = useLang() as 'en' | 'zh';
  const prefix = lang === 'zh' ? '/zh' : '';
  return (
    <div className={styles['banner-frame']}>
      <p className={styles['banner-title']}>
        {i18n.startBuilding[lang]}{' '}
        <span className={styles['vue-lynx-text']}>Vue Lynx</span>
      </p>
      <a href={`${prefix}/guide/quick-start`} className={styles['banner-btn']}>
        {i18n.quickStart[lang]}
      </a>
      <DotPattern />
    </div>
  );
};
