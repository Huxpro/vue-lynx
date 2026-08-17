import type { Config } from 'tailwindcss';

import preset from '@lynx-js/tailwind-preset';

const config: Config = {
  content: ['./src/**/*.{vue,js,ts}'],
  presets: [preset],
  theme: {
    extend: {
      colors: {
        'hn-green': 'var(--color-hn-green)',
        'hn-bg': 'var(--color-hn-bg)',
        'hn-text': 'var(--color-hn-text)',
        'hn-meta': 'var(--color-hn-meta)',
        'hn-card': 'var(--color-hn-card)',
        'hn-border': 'var(--color-hn-border)',
        'hn-comment-bg': 'var(--color-hn-comment-bg)',
      },
    },
  },
};

export default config;
