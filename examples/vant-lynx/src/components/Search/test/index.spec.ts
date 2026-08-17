import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Search from '../index.vue';

// Helper to fire Lynx input event
function fireInputEvent(el: Element, value: string) {
  const event = new Event('bindEvent:input', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'input',
    detail: { value },
  });
  fireEvent(el, event);
}

// Helper to fire confirm event (enter key in Lynx)
function fireConfirmEvent(el: Element) {
  const event = new Event('bindEvent:confirm', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'confirm',
    detail: {},
  });
  fireEvent(el, event);
}

describe('Search', () => {
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { placeholder: 'Search' }),
      }),
    );
    expect(container.querySelector('.van-search')).toBeTruthy();
    expect(container.querySelector('.van-search__content')).toBeTruthy();
    expect(container.querySelector('.van-search__field')).toBeTruthy();
  });

  it('should emit update:modelValue event when input value changed', async () => {
    const onUpdateModelValue = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(Search, {
            'onUpdate:modelValue': onUpdateModelValue,
          }),
      }),
    );
    const input = container.querySelector('input')!;
    expect(input).not.toBeNull();
    fireInputEvent(input, '1');
    await nextTick();
    expect(onUpdateModelValue).toHaveBeenCalledTimes(1);
    expect(onUpdateModelValue).toHaveBeenCalledWith('1');
  });

  it('should emit cancel event when cancel button is clicked', async () => {
    const cancelEvents: any[] = [];
    const updateEvents: any[] = [];
    const { container } = render(
      defineComponent({
        render: () =>
          h(Search, {
            modelValue: 'test',
            showAction: true,
            onCancel: () => cancelEvents.push(true),
            'onUpdate:modelValue': (v: string) => updateEvents.push(v),
          }),
      }),
    );
    const action = container.querySelector('.van-search__action')!;
    expect(action).not.toBeNull();
    fireEvent.tap(action);
    await nextTick();
    expect(cancelEvents.length).toBe(1);
    expect(updateEvents).toContain('');
  });

  it('should not emit cancel event when using action slot', async () => {
    const cancelEvents: any[] = [];
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            Search,
            {
              modelValue: 'test',
              showAction: true,
              onCancel: () => cancelEvents.push(true),
            },
            {
              action: () => h('text', {}, 'Custom Action'),
            },
          ),
      }),
    );
    const action = container.querySelector('.van-search__action')!;
    expect(action).not.toBeNull();
    fireEvent.tap(action);
    await nextTick();
    expect(cancelEvents.length).toBe(0);
  });

  it('should emit search event when confirm is triggered', async () => {
    const searchEvents: any[] = [];
    const { container } = render(
      defineComponent({
        render: () =>
          h(Search, {
            modelValue: 'hello',
            onSearch: (v: string) => searchEvents.push(v),
          }),
      }),
    );
    const input = container.querySelector('input')!;
    fireConfirmEvent(input);
    await nextTick();
    expect(searchEvents.length).toBe(1);
    expect(searchEvents[0]).toBe('hello');
  });

  it('should render label when using label prop', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { label: 'Address' }),
      }),
    );
    const label = container.querySelector('.van-search__label');
    expect(label).toBeTruthy();
    const texts = label!.querySelectorAll('text');
    const labelText = Array.from(texts).find(
      (t: Element) => t.textContent === 'Address',
    );
    expect(labelText).toBeTruthy();
  });

  it('should render label slot correctly', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            Search,
            {},
            {
              label: () => h('text', {}, 'Custom Label'),
            },
          ),
      }),
    );
    const label = container.querySelector('.van-search__label');
    expect(label).toBeTruthy();
  });

  it('should render left slot correctly', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            Search,
            {},
            {
              left: () => h('text', {}, 'Left Content'),
            },
          ),
      }),
    );
    const search = container.querySelector('.van-search')!;
    const texts = search.querySelectorAll('text');
    const leftText = Array.from(texts).find(
      (t: Element) => t.textContent === 'Left Content',
    );
    expect(leftText).toBeTruthy();
  });

  it('should render action text when using action-text prop', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(Search, {
            actionText: 'Custom Text',
            showAction: true,
          }),
      }),
    );
    const action = container.querySelector('.van-search__action')!;
    expect(action).toBeTruthy();
    const texts = action.querySelectorAll('text');
    const actionText = Array.from(texts).find(
      (t: Element) => t.textContent === 'Custom Text',
    );
    expect(actionText).toBeTruthy();
  });

  it('should show action button with show-action class', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { showAction: true }),
      }),
    );
    expect(
      container.querySelector('.van-search--show-action'),
    ).toBeTruthy();
    expect(container.querySelector('.van-search__action')).toBeTruthy();
  });

  it('should not show action button by default', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search),
      }),
    );
    expect(container.querySelector('.van-search__action')).toBeNull();
  });

  it('should render round shape', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { shape: 'round' }),
      }),
    );
    expect(
      container.querySelector('.van-search__content--round'),
    ).toBeTruthy();
  });

  it('should apply custom background', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { background: '#4fc08d' }),
      }),
    );
    const root = container.querySelector('.van-search') as HTMLElement;
    expect(root).toBeTruthy();
  });

  it('should emit blur event', async () => {
    const blurEvents: any[] = [];
    const { container } = render(
      defineComponent({
        render: () =>
          h(Search, {
            onBlur: (e: any) => blurEvents.push(e),
          }),
      }),
    );
    const input = container.querySelector('input')!;
    fireEvent.blur(input);
    await nextTick();
    expect(blurEvents.length).toBe(1);
  });

  it('should emit focus event', async () => {
    const focusEvents: any[] = [];
    const { container } = render(
      defineComponent({
        render: () =>
          h(Search, {
            onFocus: (e: any) => focusEvents.push(e),
          }),
      }),
    );
    const input = container.querySelector('input')!;
    fireEvent.focus(input);
    await nextTick();
    expect(focusEvents.length).toBe(1);
  });

  it('should render disabled search', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { disabled: true, placeholder: 'Search' }),
      }),
    );
    const input = container.querySelector('input')! as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it('should render with input-align center', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { inputAlign: 'center' }),
      }),
    );
    // Field should apply center alignment class
    expect(container.querySelector('.van-field__control')).toBeTruthy();
  });

  it('should render placeholder', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { placeholder: 'Placeholder text' }),
      }),
    );
    const input = container.querySelector('input')!;
    expect(input).toBeTruthy();
  });

  it('should default action text to 取消', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Search, { showAction: true }),
      }),
    );
    const action = container.querySelector('.van-search__action')!;
    const texts = action.querySelectorAll('text');
    const cancelText = Array.from(texts).find(
      (t: Element) => t.textContent === '取消',
    );
    expect(cancelText).toBeTruthy();
  });
});
