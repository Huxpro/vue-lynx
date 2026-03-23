import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ContactCard from '../index.vue';

describe('ContactCard', () => {
  it('should emit click event when clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { onClick });
        },
      }),
    );
    const root = container.firstElementChild;
    await fireEvent.tap(root!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not emit click event when editable is false and clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { editable: false, onClick });
        },
      }),
    );
    const root = container.firstElementChild;
    await fireEvent.tap(root!);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render add type by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, {});
        },
      }),
    );
    // Should have van-contact-card--add class
    const root = container.firstElementChild;
    expect(root?.className).toContain('van-contact-card--add');
    // Should show default add text
    const textEls = container.querySelectorAll('text');
    const hasAddText = Array.from(textEls).some((t) => t.textContent === '添加联系人');
    expect(hasAddText).toBe(true);
  });

  it('should render custom add text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'add', addText: 'New Contact' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomText = Array.from(textEls).some((t) => t.textContent === 'New Contact');
    expect(hasCustomText).toBe(true);
  });

  it('should render edit type with name and tel', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'John', tel: '13000000000' });
        },
      }),
    );
    // Should have van-contact-card--edit class
    const root = container.firstElementChild;
    expect(root?.className).toContain('van-contact-card--edit');
    // Should display name and tel
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts.some((t) => t?.includes('John'))).toBe(true);
    expect(texts.some((t) => t?.includes('13000000000'))).toBe(true);
  });

  it('should render stripe decoration', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, {});
        },
      }),
    );
    const stripe = container.querySelector('.van-contact-card__stripe');
    expect(stripe).toBeTruthy();
  });

  it('should render Cell with center and no border', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'Test', tel: '123' });
        },
      }),
    );
    // Cell should be present with borderless class
    const cell = container.querySelector('.van-cell');
    expect(cell).toBeTruthy();
    expect(cell?.className).toContain('van-cell--borderless');
    expect(cell?.className).toContain('van-cell--center');
  });

  it('should show link arrow when editable', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'Test', tel: '123', editable: true });
        },
      }),
    );
    // Cell should render right icon (arrow) when isLink
    const rightIcon = container.querySelector('.van-cell__right-icon');
    expect(rightIcon).toBeTruthy();
  });

  it('should not show link arrow when not editable', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'Test', tel: '123', editable: false });
        },
      }),
    );
    const rightIcon = container.querySelector('.van-cell__right-icon');
    expect(rightIcon).toBeFalsy();
  });
});
