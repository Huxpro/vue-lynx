import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import TextEllipsis from '../index.vue';

const content =
  'Vant is a lightweight, customizable mobile component library that was open sourced in 2017. Currently Vant officially provides Vue 2 version, Vue 3 version and WeChat applet version, and the community team maintains React version and Alipay applet version.';

const shortContent = 'Vant is a component library';

// Helper: get non-empty text elements
function getTextEls(container: Element) {
  return Array.from(container.querySelectorAll('text')).filter(
    (t) => t.textContent !== '',
  );
}

// Helper: check if element has the action class
function isAction(el: Element): boolean {
  const cls = el.getAttribute('class') || '';
  return cls.includes('van-text-ellipsis__action');
}

describe('TextEllipsis', () => {
  it('should render content correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, { content });
        },
      }),
    );
    const textEls = getTextEls(container);
    expect(textEls.length).toBeGreaterThan(0);
    // Long content should be truncated (contains dots)
    const allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain('...');
  });

  it('should not truncate short content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content: shortContent,
            expandText: 'expand',
            collapseText: 'collapse',
          });
        },
      }),
    );
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toBe(shortContent);
    // No action should be shown for short text
    const actionEls = textEls.filter(isAction);
    expect(actionEls.length).toBe(0);
  });

  it('should show expand/collapse text', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            expandText: 'expand',
            collapseText: 'collapse',
          });
        },
      }),
    );
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    // Should show dots and expand text
    expect(allText).toContain('...');
    expect(allText).toContain('expand');
  });

  it('expand and collapse should work', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            expandText: 'expand',
            collapseText: 'collapse',
          });
        },
      }),
    );

    // Initially truncated
    let textEls = getTextEls(container);
    let allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain('...');

    // Click expand
    const actionEl = textEls.find(isAction);
    expect(actionEl).toBeTruthy();
    fireEvent.tap(actionEl!);
    await nextTick();

    // After expand - should show full content
    textEls = getTextEls(container);
    allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain(content);
    expect(allText).not.toContain('...');
  });

  it('should emit clickAction event when action is clicked', async () => {
    const onClickAction = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            expandText: 'expand',
            collapseText: 'collapse',
            onClickAction,
          });
        },
      }),
    );

    const textEls = getTextEls(container);
    const actionEl = textEls.find(isAction);
    expect(actionEl).toBeTruthy();

    fireEvent.tap(actionEl!);
    await nextTick();
    expect(onClickAction).toHaveBeenCalledTimes(1);
  });

  it('should support toggle method via expose', async () => {
    const compRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            expandText: 'expand',
            collapseText: 'collapse',
            ref: (el: any) => { compRef.value = el; },
          });
        },
      }),
    );

    // Initially truncated
    let textEls = getTextEls(container);
    let allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain('...');

    // Call toggle to expand
    compRef.value?.toggle(true);
    await nextTick();

    textEls = getTextEls(container);
    allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain(content);
    expect(allText).not.toContain('...');

    // Call toggle to collapse
    compRef.value?.toggle(false);
    await nextTick();

    textEls = getTextEls(container);
    allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain('...');
  });

  it('should support custom dots', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            dots: '***',
          });
        },
      }),
    );
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toContain('***');
    expect(allText).not.toContain('...');
  });

  it('should support position start', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            position: 'start',
          });
        },
      }),
    );
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    // For start position, dots should be at the beginning
    expect(allText.startsWith('...')).toBe(true);
  });

  it('should support position middle', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            position: 'middle',
          });
        },
      }),
    );
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    // For middle position, dots should be in the middle (not at start or end)
    expect(allText).toContain('...');
    expect(allText.startsWith('...')).toBe(false);
    expect(allText.endsWith('...')).toBe(false);
  });

  it('should support multiple rows', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content,
            rows: 3,
          });
        },
      }),
    );
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    // With 3 rows, more text should be visible than with 1 row
    expect(allText.length).toBeGreaterThan(30);
  });

  it('should support action slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            TextEllipsis,
            { content },
            {
              action: ({ expanded }: { expanded: boolean }) =>
                expanded ? 'Collapse' : 'Expand',
            },
          );
        },
      }),
    );

    const textEls = getTextEls(container);
    const actionEl = textEls.find(isAction);
    expect(actionEl).toBeTruthy();
    expect(actionEl!.textContent).toBe('Expand');

    // Click to expand
    fireEvent.tap(actionEl!);
    await nextTick();

    const textElsAfter = getTextEls(container);
    const actionElAfter = textElsAfter.find(isAction);
    expect(actionElAfter).toBeTruthy();
    expect(actionElAfter!.textContent).toBe('Collapse');
  });

  it('should have van-text-ellipsis class on root', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, { content: shortContent });
        },
      }),
    );
    const root = container.querySelector('.van-text-ellipsis');
    expect(root).toBeTruthy();
  });
});
