import { describe, it, expect, vi } from 'vitest';
import { h, ref, nextTick, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ContactEdit from '../index.vue';

const contactInfo = {
  name: 'foo',
  tel: '13000000000',
};

describe('ContactEdit', () => {
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const root = container.querySelector('.van-contact-edit');
    expect(root).toBeTruthy();
    expect(container.querySelector('.van-contact-edit__fields')).toBeTruthy();
    expect(container.querySelector('.van-contact-edit__buttons')).toBeTruthy();
  });

  it('should render name and tel fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts.some((t) => t === '姓名')).toBe(true);
    expect(texts.some((t) => t === '电话')).toBe(true);
  });

  it('should render save button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const textEls = container.querySelectorAll('text');
    const hasSave = Array.from(textEls).some((t) => t.textContent === '保存');
    expect(hasSave).toBe(true);
  });

  it('should render delete button when isEdit is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: true });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    expect(buttons.length).toBe(2);
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === '删除');
    expect(hasDelete).toBe(true);
  });

  it('should not render delete button when isEdit is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === '删除');
    expect(hasDelete).toBe(false);
  });

  it('should emit delete event when delete button clicked', async () => {
    const onDelete = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {
            isEdit: true,
            contactInfo,
            onDelete,
          });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    const deleteButton = buttons[1];
    await fireEvent.tap(deleteButton!);
    expect(onDelete).toHaveBeenCalled();
  });

  it('should render switch cell when showSetDefault is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {
            showSetDefault: true,
            setDefaultLabel: '设为默认联系人',
          });
        },
      }),
    );
    const switchCell = container.querySelector('.van-contact-edit__switch-cell');
    expect(switchCell).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasLabel = Array.from(textEls).some((t) => t.textContent === '设为默认联系人');
    expect(hasLabel).toBe(true);
  });

  it('should not render switch cell when showSetDefault is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const switchCell = container.querySelector('.van-contact-edit__switch-cell');
    expect(switchCell).toBeFalsy();
  });

  it('should render switch component in switch cell', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {
            showSetDefault: true,
            setDefaultLabel: '设为默认联系人',
          });
        },
      }),
    );
    const switchEl = container.querySelector('.van-switch');
    expect(switchEl).toBeTruthy();
  });

  it('should show loading state on save button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isSaving: true });
        },
      }),
    );
    const button = container.querySelector('.van-button');
    expect(button?.className).toContain('van-button--loading');
  });

  it('should show loading state on delete button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: true, isDeleting: true });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    const deleteButton = buttons[1];
    expect(deleteButton?.className).toContain('van-button--loading');
  });

  it('should render fields inside Form component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const form = container.querySelector('.van-form');
    expect(form).toBeTruthy();
    const fields = container.querySelectorAll('.van-field');
    expect(fields.length).toBe(2);
  });

  it('should render save button as primary type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const button = container.querySelector('.van-button--primary');
    expect(button).toBeTruthy();
  });

  it('should render buttons as block and round', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: true });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('van-button--block');
      expect(btn.className).toContain('van-button--round');
    });
  });
});
