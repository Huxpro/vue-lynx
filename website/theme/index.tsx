import { useEffect } from 'react';
import {
  HomeLayout as BaseHomeLayout,
  getCustomMDXComponent as basicGetCustomMDXComponent,
} from '@rspress/core/theme-original';

import './index.scss';

import {
  Banner,
  Features,
  MeteorsBackground,
  ShowCase,
} from '../src/components/home-comps';

const cyclingWords = ['Unlock', 'Vibe', 'Render'];

function HomeLayout(props: Parameters<typeof BaseHomeLayout>[0]) {
  // Badge → GitHub link
  useEffect(() => {
    const badge = document.querySelector('.rp-home-hero__badge');
    if (badge) {
      badge.innerHTML = `<a href="https://github.com/nicepkg/vue-lynx" target="_blank" rel="noreferrer">${badge.textContent}</a>`;
    }
  }, []);

  // Tagline → add links on "Lynx" and "Vue 3"
  useEffect(() => {
    const tagline =
      document.querySelector('.rspress-home-hero-tagline') ||
      document.querySelector('.rp-home-hero__tagline');
    if (tagline?.textContent?.includes('Lynx')) {
      tagline.innerHTML = tagline.innerHTML
        .replace(
          'Lynx',
          '<a href="https://lynxjs.org" target="_blank" rel="noreferrer">Lynx</a>',
        )
        .replace(
          'Vue 3',
          '<a href="https://vuejs.org" target="_blank" rel="noreferrer">Vue 3</a>',
        );
    }
  }, []);

  // Cycling typewriter animation — pure DOM, no React state to avoid
  // re-renders that would cause BaseHomeLayout to overwrite our changes.
  useEffect(() => {
    const dynamicSpan = document.querySelector('.hero-title .dynamic-text');
    if (!dynamicSpan) return;

    let wordIndex = 0;
    let text = cyclingWords[0];
    let deleting = false;
    let paused = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const schedule = (delay: number) => {
      if (!cancelled) {
        timerId = setTimeout(tick, delay);
      }
    };

    const tick = () => {
      const word = cyclingWords[wordIndex];

      if (!deleting && text === word) {
        if (!paused) {
          paused = true;
          schedule(2000);
        } else {
          paused = false;
          deleting = true;
          schedule(100);
        }
      } else if (deleting) {
        text = word.substring(0, text.length - 1);
        dynamicSpan.textContent = text;
        if (text === '') {
          deleting = false;
          wordIndex = (wordIndex + 1) % cyclingWords.length;
          schedule(140);
        } else {
          schedule(100);
        }
      } else {
        text = cyclingWords[wordIndex].substring(0, text.length + 1);
        dynamicSpan.textContent = text;
        schedule(200);
      }
    };

    // Start with a pause on the initial word
    schedule(2000);

    return () => {
      cancelled = true;
      if (timerId !== null) clearTimeout(timerId);
    };
  }, []);
  const { pre: PreWithCodeButtonGroup, code: Code } =
    basicGetCustomMDXComponent();

  const {
    afterHero = (
      <>
        <Features />
        <ShowCase />
        <Banner />
      </>
    ),
    afterHeroActions = (
      <div
        className="rp-doc home-hero-codeblock"
        style={{ minHeight: 'auto', width: '100%', maxWidth: 360 }}
      >
        <PreWithCodeButtonGroup
          containerElementClassName="language-bash"
          codeButtonGroupProps={{
            showCodeWrapButton: false,
          }}
        >
          <Code className="language-bash" style={{ textAlign: 'center' }}>
            npm create vue-lynx@latest
          </Code>
        </PreWithCodeButtonGroup>
      </div>
    ),
  } = props;

  return (
    <>
      <MeteorsBackground gridSize={120} meteorCount={3} />
      <div className="home-layout-container">
        <BaseHomeLayout
          {...props}
          afterHero={afterHero}
          afterHeroActions={afterHeroActions}
        />
      </div>
    </>
  );
}

export { HomeLayout };

export * from '@rspress/core/theme-original';
