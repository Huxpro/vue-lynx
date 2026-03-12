import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginSass } from '@rsbuild/plugin-sass';
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';

const apiSidebar = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'api-sidebar.json'), 'utf-8'),
);

export default defineConfig({
  root: 'docs',
  title: 'Vue Lynx',
  description: 'Vue 3 framework for building Lynx apps',
  // icon: '/vue-lynx.png', // TODO: add favicon
  plugins: [pluginLlms()],
  markdown: {
    shiki: {
      transformers: [
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerNotationHighlight(),
      ],
    },
    globalComponents: [
      path.join(__dirname, 'src/components/go/Go.tsx'),
    ],
  },
  route: {
    cleanUrls: true,
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        content: 'https://github.com/huxpro/vue-lynx',
        mode: 'link',
      },
    ],
    footer: {
      message: `\u00a9 ${new Date().getFullYear()} Vue Lynx Authors. All Rights Reserved.`,
    },
    sidebar: {
      '/guide/': [
        {
          sectionHeaderText: 'Guide',
        },
        { text: 'Introduction', link: '/guide/introduction' },
        { text: 'Quick Start', link: '/guide/quick-start' },
        { text: 'Product Gallery', link: '/guide/tutorial-gallery' },
        { text: 'Product Detail (Swiper)', link: '/guide/tutorial-swiper' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'API Reference',
        },
        ...apiSidebar,
      ],
    },
    llmsUI: true,
    nav: [
      {
        text: 'Guide',
        link: '/guide/introduction',
      },
    ],
  },
  builderConfig: {
    plugins: [pluginSass()],
    source: {
      alias: {
        '@comp': path.join(__dirname, 'src/components'),
      },
    },
    server: {
      open: 'http://localhost:<port>/',
    },
  },
});
