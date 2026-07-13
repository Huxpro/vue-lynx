import { describe, expect, it } from 'vitest';

import { defineComponent, h, useCssModule } from 'vue-lynx';
import { render } from '../index.js';

describe('useCssModule', () => {
  it('resolves a loader-injected CSS module from setup', () => {
    const Comp = defineComponent({
      __cssModules: { $style: { card: 'card_hash' } },
      setup() {
        const styles = useCssModule();
        return () => h('view', { class: styles.card });
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('view')?.getAttribute('class')).toBe('card_hash');
  });
});
