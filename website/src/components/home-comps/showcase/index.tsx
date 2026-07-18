import type React from 'react';
import { useLang } from '@rspress/core/runtime';
import { Go } from '../../go/Go';
import styles from './index.module.scss';

interface ShowCaseItem {
  title: Record<'en' | 'zh', string>;
  desc: Record<'en' | 'zh', string>;
  link: string;
  example: string;
  defaultFile?: string;
  schema?: string;
}

const showCaseList: ShowCaseItem[] = [
  {
    title: {
      en: 'Elk — a Mastodon Client',
      zh: 'Elk — Mastodon 客户端',
    },
    desc: {
      en: 'A real product-grade app: Elk ported to a native Mastodon client, reusing its API and content layers.',
      zh: '真正产品级的应用：将 Elk 移植为原生 Mastodon 客户端，复用其 API 与内容渲染层。',
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
  en: "Live Elk, AI Chat, and HackerNews — Go's loading overlay stays up until first paint.",
  zh: '真实运行的 Elk、AI Chat 与 HackerNews——Go 加载遮罩会保持到首帧绘制。',
};

const learnByDoing = {
  en: 'Learn by doing',
  zh: '边做边学',
};

export const ShowCase: React.FC = () => {
  const lang = useLang() as 'en' | 'zh';
  const localePrefix = lang === 'zh' ? '/zh' : '';

  return (
    <div className={styles['show-case-frame']}>
      <div className={styles['title']}>{sectionTitle[lang]}</div>
      <div className={styles['desc']}>
        {sectionDesc[lang]}
      </div>
      <ul className={styles['show-case-list']}>
        {showCaseList.map((item) => (
          <li className={styles['show-case-list-item']} key={item.example}>
            <div className={styles['mobile-show-frame']}>
              <div className={styles['preview']}>
                <Go
                  example={item.example}
                  defaultFile={item.defaultFile}
                  schema={item.schema}
                  mode="preview"
                  defaultTab="web"
                  // responsive: lynx-view fills the phone frame. fit/cover was
                  // collapsing HackerNews list rows to width:0 in this bezel.
                  webPreviewMode="responsive"
                />
              </div>
            </div>
            <div className={styles['item-title']}>{item.title[lang]}</div>
            <div className={styles['item-desc']}>{item.desc[lang]}</div>
            <a href={`${localePrefix}${item.link}`} className={styles['item-link']}>
              {learnByDoing[lang]} &rarr;
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
