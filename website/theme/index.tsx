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

function HomeLayout(props: Parameters<typeof BaseHomeLayout>[0]) {
  useEffect(() => {
    const badge = document.querySelector('.rp-home-hero__title-brand');
    if (badge) {
      badge.innerHTML = `<a href="https://github.com/huxpro/vue-lynx" target="_blank" rel="noreferrer">${badge.textContent}</a>`;
    }
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
