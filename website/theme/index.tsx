import { useEffect, useState, useCallback } from 'react';
import {
  HomeLayout as BaseHomeLayout,
} from '@rspress/core/theme-original';
import { Analytics } from '@vercel/analytics/react';

import './index.scss';

import {
  Banner,
  Features,
  MeteorsBackground,
  ShowCase,
} from '../src/components/home-comps';

import { AGENT_PROMPT } from './agent-prompt';

const cyclingWords = ['Unlock', 'Vibe', 'Render'];

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
    <path fill="currentColor" d="M20 8v12H8V8zm0-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2" />
    <path fill="currentColor" d="M4 16H2V4a2 2 0 0 1 2-2h12v2H4Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#agent-sparkle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
    <defs>
      <linearGradient id="agent-sparkle" x1="2" y1="4" x2="22" y2="20">
        <stop stopColor="var(--major-brand-color)" />
        <stop offset="1" stopColor="var(--second-brand-color)" />
      </linearGradient>
    </defs>
  </svg>
);

function HeroCommandBox() {
  const [cmdCopied, setCmdCopied] = useState(false);
  const [agentCopied, setAgentCopied] = useState(false);

  const copyCommand = useCallback(() => {
    navigator.clipboard.writeText('npm create vue-lynx@latest').then(() => {
      setCmdCopied(true);
      setTimeout(() => setCmdCopied(false), 2000);
    });
  }, []);

  const copyAgent = useCallback(() => {
    navigator.clipboard.writeText(AGENT_PROMPT).then(() => {
      setAgentCopied(true);
      setTimeout(() => setAgentCopied(false), 2000);
    });
  }, []);

  return (
    <div className="hero-command-box">
      <button 
        type="button"
        className={`hero-command-box__cmd ${cmdCopied ? 'copied' : ''}`} 
        onClick={copyCommand}
        aria-label="Copy command"
      >
        <span className="prompt">$</span>
        <span className="text">npm create vue-lynx@latest</span>
        <span className="icon" aria-hidden="true">
          {cmdCopied ? <CheckIcon /> : <CopyIcon />}
        </span>
      </button>
      
      <div className="hero-command-box__divider" />

      <button 
        type="button"
        className={`hero-command-box__agent ${agentCopied ? 'copied' : ''}`} 
        onClick={copyAgent}
      >
        <div className="content-wrapper">
          <span className="icon-wrapper" aria-hidden="true">
            {agentCopied ? <CheckIcon /> : <BotIcon />}
          </span>
          <span className="text">
            {agentCopied ? 'copied!' : 'for Agent'}
          </span>
        </div>
      </button>
    </div>
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
  const {
    afterHero = (
      <>
        <Features />
        <ShowCase />
        <Banner />
      </>
    ),
    afterHeroActions = (
      <HeroCommandBox />
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

// Add Vercel Analytics to all pages
export const Layout = (props: React.PropsWithChildren) => {
  return (
    <>
      {props.children}
      <Analytics />
    </>
  );
};
