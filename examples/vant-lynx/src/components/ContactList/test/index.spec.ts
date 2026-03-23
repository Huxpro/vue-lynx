import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ContactList from '../index.vue';

const contactInfo = {
  id: '1',
  name: 'jack',
  tel: '12345678',
  isDefault: true,
};

const contactInfo2 = {
  id: '2',
  name: 'tom',
  tel: '87654321',
};

describe('ContactList', () => {
  it('should render ContactList correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo],
            defaultTagText: '默认',
          });
        },
      }),
    );
    // Should have the root van-contact-list class
    expect(container.querySelector('.van-contact-list')).toBeTruthy();
    // Should render contact name and tel
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents.some((t) => t?.includes('jack'))).toBe(true);
    expect(textContents.some((t) => t?.includes('12345678'))).toBe(true);
    // Should render default tag text
    expect(textContents.some((t) => t === '默认')).toBe(true);
  });

  it('should emit add event when add button is clicked', () => {
    const onAdd = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { onAdd });
        },
      }),
    );
    const addButton = container.querySelector('.van-contact-list__add');
    expect(addButton).toBeTruthy();
    fireEvent.tap(addButton!);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('should emit select event when contact item is clicked', () => {
    const onSelect = vi.fn();
    const onUpdateModelValue = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo],
            onSelect,
            'onUpdate:modelValue': onUpdateModelValue,
          });
        },
      }),
    );
    const item = container.querySelector('.van-contact-list__item');
    expect(item).toBeTruthy();
    fireEvent.tap(item!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(contactInfo, 0);
    expect(onUpdateModelValue).toHaveBeenCalledWith('1');
  });

  it('should emit edit event when edit icon is clicked', () => {
    const onEdit = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo],
            onEdit,
          });
        },
      }),
    );
    const editIcon = container.querySelector('.van-contact-list__edit');
    expect(editIcon).toBeTruthy();
    // The edit icon is inside a catchtap wrapper
    const editWrapper = editIcon!.parentElement;
    expect(editWrapper).toBeTruthy();
    fireEvent.tap(editWrapper!);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(contactInfo, 0);
  });

  it('should render multiple contacts', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo, contactInfo2],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-contact-list__item');
    expect(items.length).toBe(2);
  });

  it('should render with custom add text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            addText: 'Add Contact',
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents.some((t) => t === 'Add Contact')).toBe(true);
  });

  it('should render default add text when addText is empty', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList);
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents.some((t) => t === '添加联系人')).toBe(true);
  });

  it('should render RadioGroup with modelValue', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo, contactInfo2],
            modelValue: '1',
          });
        },
      }),
    );
    const group = container.querySelector('.van-contact-list__group');
    expect(group).toBeTruthy();
    const radios = container.querySelectorAll('.van-contact-list__radio');
    expect(radios.length).toBe(2);
  });

  it('should not render default tag when isDefault is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo2],
            defaultTagText: '默认',
          });
        },
      }),
    );
    const tags = container.querySelectorAll('.van-tag');
    expect(tags.length).toBe(0);
  });

  it('should not render default tag when defaultTagText is empty', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo],
            defaultTagText: '',
          });
        },
      }),
    );
    const tags = container.querySelectorAll('.van-tag');
    expect(tags.length).toBe(0);
  });

  it('should render edit icon for each item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo, contactInfo2],
          });
        },
      }),
    );
    const editIcons = container.querySelectorAll('.van-contact-list__edit');
    expect(editIcons.length).toBe(2);
  });

  it('should render BEM class structure', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo],
            modelValue: '1',
            defaultTagText: '默认',
          });
        },
      }),
    );
    expect(container.querySelector('.van-contact-list')).toBeTruthy();
    expect(container.querySelector('.van-contact-list__group')).toBeTruthy();
    expect(container.querySelector('.van-contact-list__item')).toBeTruthy();
    expect(container.querySelector('.van-contact-list__edit')).toBeTruthy();
    expect(container.querySelector('.van-contact-list__radio')).toBeTruthy();
    expect(container.querySelector('.van-contact-list__bottom')).toBeTruthy();
    expect(container.querySelector('.van-contact-list__add')).toBeTruthy();
  });

  it('should render name and tel with Chinese comma separator', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, {
            list: [contactInfo],
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents.some((t) => t?.includes('jack，12345678'))).toBe(true);
  });
});
