import type React from 'react';
import { useLang } from '@rspress/core/runtime';
import { PhoneGo, PhoneVideo } from './PhoneFrame';
import { PREVIEW } from './phone-frame';
import styles from './index.module.scss';

type LocaleText = Record<'en' | 'zh', string>;

interface CardBase {
  title: LocaleText;
  desc: LocaleText;
  cta: LocaleText;
  link: string;
}

interface LiveShowcaseItem extends CardBase {
  kind: 'live';
  example: string;
  defaultFile?: string;
  defaultEntryName?: string;
  entry?: string | string[];
  schema?: string;
}

interface VideoTutorialItem extends CardBase {
  kind: 'video';
  video: string;
}

type ShowcaseCard = LiveShowcaseItem | VideoTutorialItem;

/** Product / benchmark apps — live Lynx embeds. */
const showcaseList: LiveShowcaseItem[] = [
  {
    kind: 'live',
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
    kind: 'live',
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
    kind: 'live',
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

/** Learn-by-doing tutorials — original gallery / swiper recordings. */
const tutorialList: VideoTutorialItem[] = [
  {
    kind: 'video',
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
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/ifr.mp4',
  },
  {
    kind: 'video',
    title: {
      en: 'Product Detail with Carousel',
      zh: '带轮播的商品详情页',
    },
    desc: {
      en: 'Deep dive into main thread scripting by building a highly responsive swiper.',
      zh: '通过构建一个高响应性的轮播组件，深入学习主线程脚本。',
    },
    cta: {
      en: 'Learn by doing',
      zh: '边做边学',
    },
    link: '/guide/tutorial-swiper',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/mts.mp4',
  },
];

const sectionTitle: LocaleText = {
  en: 'Try it for yourself',
  zh: '亲自体验',
};

const sectionDesc: LocaleText = {
  en: 'Live product ports up top — then hands-on tutorials to build the feel yourself.',
  zh: '上方是真实产品移植，下方是动手教程，亲手做出原生质感。',
};

const rowLabels = {
  showcases: { en: 'Showcases', zh: '应用展示' } satisfies LocaleText,
  tutorials: { en: 'Tutorials', zh: '教程' } satisfies LocaleText,
};

function cardKey(item: ShowcaseCard): string {
  return item.kind === 'live'
    ? `${item.example}-${item.defaultEntryName ?? 'main'}`
    : item.video;
}

function PhonePreview({
  item,
  lang,
}: {
  item: ShowcaseCard;
  lang: 'en' | 'zh';
}) {
  if (item.kind === 'live') {
    return (
      <PhoneGo
        example={item.example}
        defaultFile={item.defaultFile}
        defaultEntryName={item.defaultEntryName}
        entry={item.entry}
        schema={item.schema}
      />
    );
  }
  return <PhoneVideo src={item.video} label={`${item.title[lang]} preview`} />;
}

function CardRow({
  label,
  items,
  lang,
  localePrefix,
}: {
  label: LocaleText;
  items: ShowcaseCard[];
  lang: 'en' | 'zh';
  localePrefix: string;
}) {
  const columns = items.length <= 4 ? items.length : 3;

  return (
    <div className={styles['show-case-row']}>
      <div className={styles['row-label']}>{label[lang]}</div>
      <ul
        className={styles['show-case-list']}
        style={{ '--showcase-cols': columns } as React.CSSProperties}
      >
        {items.map((item) => (
          <li className={styles['show-case-list-item']} key={cardKey(item)}>
            <PhonePreview item={item} lang={lang} />
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
}

export const ShowCase: React.FC = () => {
  const lang = useLang() as 'en' | 'zh';
  const localePrefix = lang === 'zh' ? '/zh' : '';

  return (
    <div className={styles['show-case-frame']}>
      <div className={styles['title']}>{sectionTitle[lang]}</div>
      <div className={styles['desc']}>{sectionDesc[lang]}</div>
      <CardRow
        label={rowLabels.showcases}
        items={showcaseList}
        lang={lang}
        localePrefix={localePrefix}
      />
      <CardRow
        label={rowLabels.tutorials}
        items={tutorialList}
        lang={lang}
        localePrefix={localePrefix}
      />
    </div>
  );
};
