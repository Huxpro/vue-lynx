import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Icon from '../index.vue';

// Ported from Vant's packages/vant/src/icon/test/index.spec.ts
// 10 test cases matching Vant's test suite

describe('Icon', () => {
  it('should render icon with builtin icon name correctly', () => {
    const { container } = render(Icon, {
      props: { name: 'success' },
    });
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('should render icon with url name correctly', () => {
    const { container } = render(Icon, {
      props: { name: 'https://example.com/icon.png' },
    });
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('should render icon with local image correctly', () => {
    const { container } = render(Icon, {
      props: { name: '/assets/icon.jpg' },
    });
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('should render default slot correctly', () => {
    const { getByText } = render(Icon, {
      slots: {
        default: () => 'Default Slot',
      },
    });
    expect(getByText('Default Slot')).toBeTruthy();
  });

  it('should accept tag prop', () => {
    const { container } = render(Icon, {
      props: {
        tag: 'div',
        name: 'success',
      },
    });
    expect(container.innerHTML).toContain('div');
  });

  it('should render dot correctly', () => {
    const { container } = render(Icon, {
      props: {
        name: 'success',
        dot: true,
      },
    });
    expect(container.querySelector('.van-badge--dot')).toBeTruthy();
  });

  it('should render badge correctly', () => {
    const { container } = render(Icon, {
      props: {
        name: 'success',
        badge: '1',
      },
    });
    expect(container.querySelector('.van-badge')?.textContent).toBe('1');
  });

  it('should change icon size when using size prop', () => {
    const { container } = render(Icon, {
      props: {
        name: 'success',
        size: '2rem',
      },
    });
    const icon = container.querySelector('.van-icon');
    expect(icon.style.fontSize).toBe('2rem');
  });

  it('should apply color prop correctly', () => {
    const { container } = render(Icon, {
      props: {
        name: 'success',
        color: 'red',
      },
    });
    const icon = container.querySelector('.van-icon');
    expect(icon.style.color).toBe('red');
  });

  it('should handle click event correctly', async () => {
    const onClick = vi.fn();
    const { container } = render(Icon, {
      props: {
        name: 'success',
      },
      listeners: {
        click: onClick,
      },
    });

    await fireEvent.tap(container.firstChild);
    expect(onClick).toHaveBeenCalled();
  });

  it('should render spin icon correctly', () => {
    const { container } = render(Icon, {
      props: {
        name: 'success',
        spin: true,
      },
    });
    expect(container.querySelector('.van-icon--spin')).toBeTruthy();
  });
});

