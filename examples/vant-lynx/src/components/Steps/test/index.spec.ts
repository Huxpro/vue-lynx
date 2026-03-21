import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Steps from '../index.vue';
import Step from '../../Step/index.vue';

describe('Steps', () => {
  it('should render steps container with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 1 }, {
            default: () => [
              h(Step, { index: 0 }, { default: () => 'Step 1' }),
              h(Step, { index: 1 }, { default: () => 'Step 2' }),
              h(Step, { index: 2 }, { default: () => 'Step 3' }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(3);
  });
});
