import type React from 'react';
import { useLang } from '@rspress/core/runtime';
import { PhoneGo } from './PhoneFrame';
import { PREVIEW } from './phone-frame';
import styles from './index.module.scss';

interface ShowCaseItem {
  title: Record<'en' | 'zh', string>;
  desc: Record<'en' | 'zh', string>;
  /** CTA under the card — tutorial vs product showcase. */
  cta: Record<'en' | 'zh', string>;
  link: string;
  example: string;
  defaultFile?: string;
  defaultEntryName?: string;
  entry?: string | string[];
  schema?: string;
}

const showCaseList: ShowCaseItem[] = [
  {
    title: {
      en: 'Two-Column Waterfall Gallery',
      zh: '双列瀑布流画廊',
    },
    desc: {
      en: 'Cover everything you need to know to start building with Vue Lynx.',
      zh: '覆盖使用 Vue Lynx 开发所需的一切知识。',
    },
    cta: {
      en: 'Learn by doing',
      zh: '边做边学',
    },
    link: '/guide/tutorial-gallery',
    example: 'gallery',
    defaultFile: 'src/GalleryComplete/Gallery.vue',
    defaultEntryName: 'GalleryComplete',
    entry: 'src/GalleryComplete',
  },
  {
    title: {
      en: 'Elk — a Mastodon Client',
      zh: 'Elk — Mastodon 客户端',
    },
    desc: {
      en: 'A real product-grade app: Elk ported to a native Mastodon client, reusing its API and content layers.',
      zh: '真正产品级的应用：将 Elk 移植为原生 Mastodon 客户端，复用其 API 与内容渲染层。',
    },
    cta: {
      en: 'Explore the port',
      zh: '了解移植细节',
    },
    link: '/guide/elk',
    example: 'elk',
    defaultFile: 'src/App.vue',
    schema: '{{{url}}}?fullscreen=true&bar_color=fafafa&bg_color=fafafa',
  },
  {
    title: {
      en: 'Nuxt AI Chat',
      zh: 'Nuxt AI Chat',
    },
    desc: {
      en: 'A full-featured AI chatbot ported from the Nuxt AI Chat template — streaming, tools, markdown, and more.',
      zh: '从 Nuxt AI Chat 模板移植的完整 AI 聊天应用——流式响应、工具调用、Markdown 等。',
    },
    cta: {
      en: 'See how it works',
      zh: '看看怎么做的',
    },
    link: '/guide/ai-chat',
    example: 'ai-chat',
    defaultFile: 'src/App.vue',
  },
  {
    title: {
      en: 'Vue HackerNews',
      zh: 'Vue HackerNews',
    },
    desc: {
      en: "Evan You's classic HackerNews demo on Vue Lynx — Vue Router, Pinia, TanStack Query, and Tailwind.",
      zh: 'Evan You 经典 HackerNews 示例的 Vue Lynx 版——Vue Router、Pinia、TanStack Query 与 Tailwind。',
    },
    cta: {
      en: 'Browse the benchmark',
      zh: '查看基准示例',
    },
    link: '/guide/hackernews',
    example: 'hackernews-tailwind',
    defaultFile: 'src/App.vue',
  },
];

const sectionTitle = {
  en: 'Try it for yourself',
  zh: '亲自体验',
};

const sectionDesc = {
  en: 'Live apps at the same density as the original showcase videos (360 CSS-px @3× → phone frame).',
  zh: '与最早的 showcase 录屏同一密度（360 CSS 像素 @3× → 手机框）。',
};

export const ShowCase: React.FC = () => {
  const lang = useLang() as 'en' | 'zh';
  const localePrefix = lang === 'zh' ? '/zh' : '';

  return (
    <div className={styles['show-case-frame']}>
      <div className={styles['title']}>{sectionTitle[lang]}</div>
      <div className={styles['desc']}>{sectionDesc[lang]}</div>
      <ul className={styles['show-case-list']}>
        {showCaseList.map((item) => (
          <li
            className={styles['show-case-list-item']}
            key={`${item.example}-${item.defaultEntryName ?? 'main'}`}
          >
            <PhoneGo
              example={item.example}
              defaultFile={item.defaultFile}
              defaultEntryName={item.defaultEntryName}
              entry={item.entry}
              schema={item.schema}
            />
            <div className={styles['item-title']}>{item.title[lang]}</div>
            <div
              className={styles['item-desc']}
              style={{ maxWidth: PREVIEW.width }}
            >
              {item.desc[lang]}
            </div>
            <a
              href={`${localePrefix}${item.link}`}
              className={styles['item-link']}
            >
              {item.cta[lang]} &rarr;
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
