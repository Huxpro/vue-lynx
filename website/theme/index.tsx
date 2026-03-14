import { useEffect, useState, useCallback } from 'react';
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
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState(cyclingWords[0]);
  const [delta, setDelta] = useState(200);
  const [isPaused, setIsPaused] = useState(false);

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

  // Cycling typewriter animation
  const updateText = useCallback(() => {
    const dynamicSpan = document.querySelector('.hero-title .dynamic-text');
    if (!dynamicSpan) return;

    const currentWord = cyclingWords[currentWordIndex];

    if (!isDeleting && displayText === currentWord) {
      if (!isPaused) {
        setIsPaused(true);
        setDelta(2000);
      } else {
        setIsPaused(false);
        setIsDeleting(true);
        setDelta(100);
      }
    } else if (isDeleting) {
      const newText = currentWord.substring(0, displayText.length - 1);
      setDisplayText(newText);
      dynamicSpan.textContent = newText;
      if (newText === '') {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % cyclingWords.length);
        setDelta(140);
      } else {
        setDelta(100);
      }
    } else {
      const newText = cyclingWords[currentWordIndex].substring(
        0,
        displayText.length + 1,
      );
      setDisplayText(newText);
      dynamicSpan.textContent = newText;
      setDelta(200);
    }
  }, [currentWordIndex, isDeleting, displayText, isPaused]);

  useEffect(() => {
    const ticker = setInterval(updateText, delta);
    return () => clearInterval(ticker);
  }, [updateText, delta]);
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
