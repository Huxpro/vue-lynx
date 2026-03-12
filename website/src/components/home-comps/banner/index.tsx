import type React from 'react';
import styles from './index.module.scss';
import { DotPattern } from './DotPattern';

export const Banner: React.FC = () => {
  return (
    <div className={styles['banner-frame']}>
      <p className={styles['banner-title']}>
        Start building with{' '}
        <span className={styles['vue-lynx-text']}>Vue Lynx</span>
      </p>
      <a href="/guide/quick-start" className={styles['banner-btn']}>
        Quick Start
      </a>
      <DotPattern />
    </div>
  );
};
