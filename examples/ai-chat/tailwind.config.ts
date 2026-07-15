import type { Config } from 'tailwindcss';

import preset from '@lynx-js/tailwind-preset';

/**
 * Semantic tokens mirror Nuxt UI v4's theme (neutral=zinc, primary=blue), so
 * markup ported from the original template keeps its class names:
 *   text-highlighted / text-muted / bg-elevated / border-default / ...
 * The underlying --ui-* CSS variables are defined in src/App.css and swap with
 * the .theme-light / .theme-dark root class.
 */
const config: Config = {
  content: ['./src/**/*.{vue,js,ts}'],
  presets: [preset],
  theme: {
    extend: {
      colors: {
        primary: 'var(--ui-primary)',
        error: 'var(--ui-error)',
        success: 'var(--ui-success)',

        highlighted: 'var(--ui-text-highlighted)',
        toned: 'var(--ui-text-toned)',
        muted: 'var(--ui-text-muted)',
        dimmed: 'var(--ui-text-dimmed)',
        inverted: 'var(--ui-text-inverted)',
      },
      backgroundColor: {
        default: 'var(--ui-bg)',
        page: 'var(--ui-bg-page)',
        muted: 'var(--ui-bg-muted)',
        elevated: 'var(--ui-bg-elevated)',
        accented: 'var(--ui-bg-accented)',
        inverted: 'var(--ui-bg-inverted)',
        primary: 'var(--ui-primary)',
        error: 'var(--ui-error)',
      },
      textColor: {
        default: 'var(--ui-text)',
      },
      borderColor: {
        DEFAULT: 'var(--ui-border)',
        default: 'var(--ui-border)',
        muted: 'var(--ui-border-muted)',
        accented: 'var(--ui-border-accented)',
      },
      fontFamily: {
        sans: [
          'Public Sans',
          'PublicSans-Regular',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
    },
  },
};

export default config;
