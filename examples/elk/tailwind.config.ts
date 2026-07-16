import type { Config } from 'tailwindcss';

import preset from '@lynx-js/tailwind-preset';

const config: Config = {
  content: ['./src/**/*.{vue,js,ts}'],
  presets: [preset],
  theme: {
    extend: {
      colors: {
        primary: 'var(--c-primary)',
        'primary-active': 'var(--c-primary-active)',
        'primary-light': 'var(--c-primary-light)',
        'primary-fade': 'var(--c-primary-fade)',
        base: 'var(--c-bg-base)',
        card: 'var(--c-bg-card)',
        active: 'var(--c-bg-active)',
        'text-base': 'var(--c-text-base)',
        secondary: 'var(--c-text-secondary)',
        'secondary-light': 'var(--c-text-secondary-light)',
        'border-base': 'var(--c-border)',
        danger: 'var(--c-danger)',
      },
    },
  },
};

export default config;
