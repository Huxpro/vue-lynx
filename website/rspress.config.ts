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

/** Prefix all `link` values in sidebar items with the given prefix (e.g. "/zh"). */
function prefixSidebarLinks(
  items: Array<Record<string, unknown>>,
  prefix: string,
): Array<Record<string, unknown>> {
  return items.map((item) => {
    const out = { ...item };
    if (typeof out.link === 'string') {
      out.link = `${prefix}${out.link}`;
    }
    if (Array.isArray(out.items)) {
      out.items = prefixSidebarLinks(
        out.items as Array<Record<string, unknown>>,
        prefix,
      );
    }
    return out;
  });
}

export default defineConfig({
  root: 'docs',
  title: 'Vue Lynx',
  description: 'Vue 3 framework for building Lynx apps',
  icon: '/favicon.png',
  lang: 'en',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'Vue Lynx',
      description: 'Vue 3 framework for building Lynx apps',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Vue Lynx',
      description: 'Vue 3 框架，用于构建 Lynx 应用',
    },
  ],
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
      message: `\u00a9 ${new Date().getFullYear()} Xuan Huang (huxpro). All Rights Reserved.`,
    },
    sidebar: {
      '/guide/': [
        { text: 'Quick Start', link: '/guide/quick-start' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'Learn VueLynx',
        },
        { text: 'What is VueLynx?', link: '/guide/introduction' },
        { text: 'Vue Compatibility', link: '/guide/vue-compatibility' },
        { text: 'Main Thread Script', link: '/guide/main-thread-script' },
        { text: 'Tutorial: Product Gallery', link: '/guide/tutorial-gallery' },
        { text: 'Tutorial: Product Swiper', link: '/guide/tutorial-swiper' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'Ecosystem',
        },
        { text: 'Vue Router', link: '/guide/routing' },
        { text: 'Pinia', link: '/guide/pinia' },
        { text: 'Vue Query', link: '/guide/data-fetching' },
        { text: 'Tailwind CSS', link: '/guide/tailwindcss' },
        { text: 'VueLynx Testing Library', link: '/guide/testing-library' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'Benchmark',
        },
        { text: 'TodoMVC', link: '/guide/todomvc' },
        { text: '7GUIs', link: '/guide/7guis' },
        { text: 'HackerNews', link: '/guide/hackernews' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'API Reference',
        },
        ...apiSidebar,
      ],
      '/zh/guide/': [
        { text: '快速开始', link: '/zh/guide/quick-start' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: '学习 VueLynx',
        },
        { text: '什么是 VueLynx？', link: '/zh/guide/introduction' },
        { text: 'Vue 兼容性', link: '/zh/guide/vue-compatibility' },
        { text: '主线程脚本', link: '/zh/guide/main-thread-script' },
        { text: '教程：商品画廊', link: '/zh/guide/tutorial-gallery' },
        { text: '教程：商品轮播', link: '/zh/guide/tutorial-swiper' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: '生态系统',
        },
        { text: 'Vue Router', link: '/zh/guide/routing' },
        { text: 'Pinia', link: '/zh/guide/pinia' },
        { text: 'Vue Query', link: '/zh/guide/data-fetching' },
        { text: 'Tailwind CSS', link: '/zh/guide/tailwindcss' },
        { text: 'VueLynx 测试库', link: '/zh/guide/testing-library' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: '基准测试',
        },
        { text: 'TodoMVC', link: '/zh/guide/todomvc' },
        { text: '7GUIs', link: '/zh/guide/7guis' },
        { text: 'HackerNews', link: '/zh/guide/hackernews' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'API 参考',
        },
        ...prefixSidebarLinks(apiSidebar, '/zh'),
      ],
    },
    llmsUI: true,
    nav: [
      {
        text: 'Guide',
        link: '/guide/quick-start',
      },
      {
        text: 'API',
        link: '/guide/api/vue-lynx/',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'English',
        nav: [
          {
            text: 'Guide',
            link: '/guide/quick-start',
          },
          {
            text: 'API',
            link: '/guide/api/vue-lynx/',
          },
        ],
      },
      {
        lang: 'zh',
        label: '简体中文',
        nav: [
          {
            text: '指南',
            link: '/zh/guide/quick-start',
          },
          {
            text: 'API',
            link: '/zh/guide/api/vue-lynx/',
          },
        ],
      },
    ],
  },
  head: [
    ['meta', { property: 'og:title', content: 'Vue Lynx' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Vue 3 framework for building Lynx apps',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://vue.lynxjs.org/og-image.png',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://vue.lynxjs.org' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Vue Lynx' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'Vue 3 framework for building Lynx apps',
      },
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://vue.lynxjs.org/og-image.png',
      },
    ],
  ],
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
