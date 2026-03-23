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
          sectionHeaderText: 'VueLynx Essentials',
        },
        { text: 'What is VueLynx?', link: '/guide/introduction' },
        { text: 'Vue Compatibility', link: '/guide/vue-compatibility' },
        { text: 'Main Thread Script', link: '/guide/main-thread-script' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: 'Tutorials',
        },
        { text: 'Product Gallery', link: '/guide/tutorial-gallery' },
        { text: 'Product Swiper', link: '/guide/tutorial-swiper' },
        { text: '7GUIs Benchmark', link: '/guide/7guis' },
        { text: 'HackerNews Slopfork', link: '/guide/hackernews' },
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
          sectionHeaderText: 'VueLynx 基础',
        },
        { text: '什么是 VueLynx？', link: '/zh/guide/introduction' },
        { text: 'Vue 兼容性', link: '/zh/guide/vue-compatibility' },
        { text: '主线程脚本', link: '/zh/guide/main-thread-script' },
        {
          dividerType: 'solid',
        },
        {
          sectionHeaderText: '教程',
        },
        { text: '商品画廊', link: '/zh/guide/tutorial-gallery' },
        { text: '商品轮播', link: '/zh/guide/tutorial-swiper' },
        { text: '7GUIs 基准测试', link: '/zh/guide/7guis' },
        { text: 'HackerNews Slopfork', link: '/zh/guide/hackernews' },
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
          sectionHeaderText: 'API 参考',
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
    locales: [
      {
        lang: 'zh',
        label: '简体中文',
        nav: [
          {
            text: '指南',
            link: '/zh/guide/introduction',
          },
        ],
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
