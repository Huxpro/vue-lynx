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

import { AGENT_PROMPT } from './agent-prompt';

const cyclingWords = ['Unlock', 'Vibe', 'Render'];

function ForAgentButton() {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(AGENT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <button
      type="button"
      className={`for-agent-btn${copied ? ' is-copied' : ''}`}
      onClick={handleClick}
    >
      <span className="for-agent-btn__icon" aria-hidden="true">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.2 4.8L12 5.2L9.2 7.8L10 12L7 9.8L4 12L4.8 7.8L2 5.2L5.8 4.8L7 1Z" fill="url(#agent-sparkle)" />
            <defs>
              <linearGradient id="agent-sparkle" x1="2" y1="1" x2="12" y2="12">
                <stop stopColor="var(--major-brand-color)" />
                <stop offset="1" stopColor="var(--second-brand-color)" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </span>
      <span className="for-agent-btn__label">
        {copied ? 'copied!' : 'for Agent'}
      </span>
    </button>
  );
}

/** Poll with rAF until `selector` matches, then call `cb`. Gives up after 5 s. */
function whenReady(selector: string, cb: (el: Element) => void): () => void {
  let cancelled = false;
  let rafId: number;
  let attempts = 0;
  const maxAttempts = 300; // ~5 s at 60 fps

  const poll = () => {
    if (cancelled || ++attempts > maxAttempts) return;
    const el = document.querySelector(selector);
    if (el) {
      cb(el);
    } else {
      rafId = requestAnimationFrame(poll);
    }
  };

  rafId = requestAnimationFrame(poll);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}

function HomeLayout(props: Parameters<typeof BaseHomeLayout>[0]) {
  // Tagline → add links on "Lynx" and "Vue 3"
  useEffect(() => {
    const cleanTagline = whenReady(
      '.rspress-home-hero-tagline, .rp-home-hero__tagline',
      (tagline) => {
        if (tagline.textContent?.includes('Lynx')) {
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
      },
    );
    return () => {
      cleanTagline();
    };
  }, []);

  // Cycling typewriter animation — pure DOM, no React state to avoid
  // re-renders that would cause BaseHomeLayout to overwrite our changes.
  useEffect(() => {
    let wordIndex = 0;
    let text = cyclingWords[0];
    let deleting = false;
    let paused = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let cachedEl: Element | null = null;

    const schedule = (delay: number) => {
      if (!cancelled) {
        timerId = setTimeout(tick, delay);
      }
    };

    const tick = () => {
      // Re-query only when the cached element is gone (e.g. hydration swap).
      if (!cachedEl || !cachedEl.isConnected) {
        cachedEl = document.querySelector('.hero-title .dynamic-text');
      }
      if (!cachedEl) return schedule(200);

      const word = cyclingWords[wordIndex];

      if (!deleting && text === word) {
        if (!paused) {
          paused = true;
          schedule(1000);
        } else {
          paused = false;
          deleting = true;
          schedule(100);
        }
      } else if (deleting) {
        text = word.substring(0, text.length - 1);
        cachedEl.textContent = text;
        if (text === '') {
          deleting = false;
          wordIndex = (wordIndex + 1) % cyclingWords.length;
          schedule(140);
        } else {
          schedule(100);
        }
      } else {
        text = cyclingWords[wordIndex].substring(0, text.length + 1);
        cachedEl.textContent = text;
        schedule(200);
      }
    };

    // Start with a pause on the initial word
    schedule(1000);

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
      <div className="home-hero-actions-row">
        <div
          className="rp-doc home-hero-codeblock"
          style={{ minHeight: 'auto' }}
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
        <span className="home-hero-actions-row__divider">or</span>
        <ForAgentButton />
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
