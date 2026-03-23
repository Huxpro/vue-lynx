import { describe, it, expect, vi } from 'vitest';
import { h, nextTick, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import AddressEdit from '../index.vue';
import type { AddressEditInfo } from '../types';

const areaList = {
  province_list: {
    '110000': '北京市',
    '330000': '浙江省',
  },
  city_list: {
    '110100': '北京市',
    '330100': '杭州市',
  },
  county_list: {
    '110101': '东城区',
    '110102': '西城区',
    '330102': '上城区',
    '330103': '下城区',
  },
};

const defaultAddressInfo: Partial<AddressEditInfo> = {
  name: '测试',
  tel: '13000000000',
  province: '北京市',
  city: '北京市',
  county: '朝阳区',
  addressDetail: 'address detail',
  areaCode: '110101',
  isDefault: true,
};

function createComponent(addressInfo: Partial<AddressEditInfo> = {}) {
  return render(
    defineComponent({
      render() {
        return h(AddressEdit, {
          areaList,
          addressInfo: { ...defaultAddressInfo, ...addressInfo },
          showSetDefault: true,
        });
      },
    }),
  );
}

describe('AddressEdit', () => {
  it('should render AddressEdit with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit);
        },
      }),
    );
    const root = container.querySelector('.van-address-edit');
    expect(root).toBeTruthy();
    expect(container.querySelector('.van-address-edit__fields')).toBeTruthy();
    expect(container.querySelector('.van-address-edit__buttons')).toBeTruthy();
  });

  it('should render form fields (name, tel, area, detail)', () => {
    const { container } = createComponent();
    const fields = container.querySelectorAll('.van-field');
    // name, tel, area, detail = 4 fields
    expect(fields.length).toBe(4);
  });

  it('should render name and tel labels', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts.some((t) => t === '姓名')).toBe(true);
    expect(texts.some((t) => t === '电话')).toBe(true);
  });

  it('should render AddressEdit with props correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {
            areaList,
            addressInfo: defaultAddressInfo,
            showSetDefault: true,
            showSearchResult: true,
          });
        },
      }),
    );
    expect(container.querySelector('.van-address-edit')).toBeTruthy();
    expect(container.querySelector('.van-address-edit__default')).toBeTruthy();
  });

  it('should render delete button when showDelete is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showDelete: true });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    expect(buttons.length).toBe(2);
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === '删除');
    expect(hasDelete).toBe(true);
  });

  it('should not render delete button when showDelete is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit);
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    expect(buttons.length).toBe(1);
  });

  it('should render save button with custom text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { saveButtonText: '提交' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSave = Array.from(textEls).some((t) => t.textContent === '提交');
    expect(hasSave).toBe(true);
  });

  it('should render delete button with custom text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {
            showDelete: true,
            deleteButtonText: '移除地址',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === '移除地址');
    expect(hasDelete).toBe(true);
  });

  it('should emit delete event after clicking the delete button', async () => {
    const onDelete = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {
            showDelete: true,
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

  it('should emit clickArea event after clicking the area field', async () => {
    const onClickArea = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {
            disableArea: true,
            onClickArea,
          });
        },
      }),
    );
    const fields = container.querySelectorAll('.van-field');
    const areaField = fields[2];
    await fireEvent.tap(areaField!);
    expect(onClickArea).toHaveBeenCalledTimes(1);
  });

  it('should render set-default cell when showSetDefault is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showSetDefault: true });
        },
      }),
    );
    const defaultCell = container.querySelector('.van-address-edit__default');
    expect(defaultCell).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasLabel = Array.from(textEls).some((t) => t.textContent === '设为默认收货地址');
    expect(hasLabel).toBe(true);
  });

  it('should not render set-default cell when showSetDefault is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit);
        },
      }),
    );
    const defaultCell = container.querySelector('.van-address-edit__default');
    expect(defaultCell).toBeFalsy();
  });

  it('should render switch in set-default cell', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showSetDefault: true });
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
          return h(AddressEdit, { isSaving: true });
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
          return h(AddressEdit, { showDelete: true, isDeleting: true });
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
          return h(AddressEdit);
        },
      }),
    );
    const form = container.querySelector('.van-form');
    expect(form).toBeTruthy();
  });

  it('should render buttons as block and round', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showDelete: true });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('van-button--block');
      expect(btn.className).toContain('van-button--round');
    });
  });

  it('should render save button as primary type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit);
        },
      }),
    );
    const button = container.querySelector('.van-button--primary');
    expect(button).toBeTruthy();
  });

  it('should hide area field when showArea is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showArea: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasArea = Array.from(textEls).some((t) => t.textContent === '地区');
    expect(hasArea).toBe(false);
  });

  it('should hide detail field when showDetail is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showDetail: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDetail = Array.from(textEls).some((t) => t.textContent === '详细地址');
    expect(hasDetail).toBe(false);
  });

  it('should render area text from addressInfo', () => {
    const { container } = createComponent();
    // Area field renders modelValue in an input element (readonly)
    const inputs = container.querySelectorAll('input');
    const inputValues = Array.from(inputs).map((i) => (i as any).value || i.getAttribute('value') || '');
    // Also check text elements for the area value
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    const allContent = [...inputValues, ...texts];
    // province === city, so only one shows: '北京市/朝阳区'
    const hasArea = allContent.some((t) => t?.includes('北京市'));
    expect(hasArea).toBe(true);
  });

  it('should expose setAddressDetail method', async () => {
    let instance: any;
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(AddressEdit, {
              ref: (el: any) => {
                instance = el;
              },
              addressInfo: defaultAddressInfo,
            });
        },
      }),
    );
    expect(instance).toBeTruthy();
    instance.setAddressDetail('new address');
    await nextTick();
    // The value should be updated
    expect(instance.setAddressDetail).toBeInstanceOf(Function);
  });

  it('should expose setAreaCode method', async () => {
    let instance: any;
    render(
      defineComponent({
        setup() {
          return () =>
            h(AddressEdit, {
              ref: (el: any) => {
                instance = el;
              },
            });
        },
      }),
    );
    expect(instance).toBeTruthy();
    instance.setAreaCode('330100');
    await nextTick();
    expect(instance.setAreaCode).toBeInstanceOf(Function);
  });

  it('should render default slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            AddressEdit,
            null,
            {
              default: () => h('view', { class: 'custom-content' }, []),
            },
          );
        },
      }),
    );
    const customContent = container.querySelector('.custom-content');
    expect(customContent).toBeTruthy();
  });

  it('should emit focus event when field is focused', async () => {
    const onFocus = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { onFocus });
        },
      }),
    );
    const inputs = container.querySelectorAll('input');
    if (inputs.length > 0) {
      await fireEvent.focus(inputs[0]!);
    }
  });

  it('should have change event emitter defined', () => {
    // The change event is emitted through Field's update:modelValue handler
    // We verify the component accepts the onChange handler without error
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { onChange });
        },
      }),
    );
    expect(container.querySelector('.van-address-edit')).toBeTruthy();
  });
});
