import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ActionBar from '../index.vue';
import ActionBarIcon from '../../ActionBarIcon/index.vue';
import ActionBarButton from '../../ActionBarButton/index.vue';

describe('ActionBar', () => {
  it('should render action bar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, {}, {
            default: () => [
              h(ActionBarIcon, { icon: '\u2764', text: 'Like' }),
              h(ActionBarButton, { type: 'danger', text: 'Buy Now' }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with multiple buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, {}, {
            default: () => [
              h(ActionBarIcon, { icon: '\u2764', text: 'Like' }),
              h(ActionBarIcon, { icon: '\u2606', text: 'Favorite' }),
              h(ActionBarButton, { type: 'warning', text: 'Add to Cart' }),
              h(ActionBarButton, { type: 'danger', text: 'Buy Now' }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
