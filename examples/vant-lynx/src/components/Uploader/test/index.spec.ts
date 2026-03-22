import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Uploader from '../index.vue';
import type { UploaderFileListItem } from '../types';
import { isImageFile, isImageUrl, isOversize, filterFiles } from '../utils';

const IMAGE = 'https://example.com/cat.jpeg';
const PDF = 'https://example.com/test.pdf';

describe('Uploader', () => {
  // BEM class structure tests
  it('should render with BEM base class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader);
        },
      }),
    );
    const root = container.querySelector('.van-uploader');
    expect(root).toBeTruthy();
  });

  it('should render wrapper class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader);
        },
      }),
    );
    const wrapper = container.querySelector('.van-uploader__wrapper');
    expect(wrapper).toBeTruthy();
  });

  it('should render wrapper--disabled class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { disabled: true });
        },
      }),
    );
    const wrapper = container.querySelector('.van-uploader__wrapper');
    expect(wrapper?.getAttribute('class')).toContain('van-uploader__wrapper--disabled');
  });

  it('should render upload area', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader);
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload).toBeTruthy();
  });

  it('should render upload icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader);
        },
      }),
    );
    const icon = container.querySelector('.van-uploader__upload-icon');
    expect(icon).toBeTruthy();
  });

  it('should render upload text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { uploadText: 'Upload' });
        },
      }),
    );
    const texts = container.querySelectorAll('.van-uploader__upload-text');
    const textEl = Array.from(texts).find(
      (t) => t.textContent === 'Upload',
    );
    expect(textEl).toBeTruthy();
  });

  it('should render custom upload icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { uploadIcon: 'add' });
        },
      }),
    );
    const icon = container.querySelector('.van-uploader__upload-icon');
    expect(icon).toBeTruthy();
  });

  // Preview tests
  it('should render preview items', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE },
      { url: 'https://example.com/img2.jpeg' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const previews = container.querySelectorAll('.van-uploader__preview');
    expect(previews.length).toBe(2);
  });

  it('should render preview image', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const previewImage = container.querySelector('.van-uploader__preview-image');
    expect(previewImage).toBeTruthy();
  });

  it('should render file preview for non-image files', () => {
    const files: UploaderFileListItem[] = [{ url: PDF }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const file = container.querySelector('.van-uploader__file');
    expect(file).toBeTruthy();
  });

  it('should render file icon for non-image files', () => {
    const files: UploaderFileListItem[] = [{ url: PDF }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const fileIcon = container.querySelector('.van-uploader__file-icon');
    expect(fileIcon).toBeTruthy();
  });

  it('should render file name for non-image files', () => {
    const files: UploaderFileListItem[] = [{ url: PDF }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const fileName = container.querySelector('.van-uploader__file-name');
    expect(fileName).toBeTruthy();
    expect(fileName?.textContent).toContain('test.pdf');
  });

  // Delete button tests
  it('should render delete button by default', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    expect(deleteBtn).toBeTruthy();
  });

  it('should not render delete button when deletable is false', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files, deletable: false });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    expect(deleteBtn).toBeFalsy();
  });

  it('should render delete shadow class', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete--shadow');
    expect(deleteBtn).toBeTruthy();
  });

  it('should emit delete event on delete tap', async () => {
    const onDelete = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            onDelete,
          });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    if (deleteBtn) {
      await fireEvent.tap(deleteBtn);
    }
    expect(onDelete).toHaveBeenCalled();
  });

  it('should emit update:modelValue on delete', async () => {
    const onUpdate = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }, { url: PDF }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            'onUpdate:modelValue': onUpdate,
          });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    if (deleteBtn) {
      await fireEvent.tap(deleteBtn);
    }
    expect(onUpdate).toHaveBeenCalledWith([{ url: PDF }]);
  });

  // Max count tests
  it('should not show upload button when maxCount reached', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files, maxCount: 1 });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload).toBeFalsy();
  });

  it('should show upload button when below maxCount', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files, maxCount: 2 });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload).toBeTruthy();
  });

  // Show upload tests
  it('should hide upload area when showUpload is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { showUpload: false });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload).toBeFalsy();
  });

  // Disabled tests
  it('should not emit click-upload when disabled', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            disabled: true,
            'onClick-upload': onClick,
          });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    if (upload) {
      await fireEvent.tap(upload);
    }
    expect(onClick).not.toHaveBeenCalled();
  });

  // Readonly tests
  it('should add readonly modifier class to upload', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { readonly: true });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload?.getAttribute('class')).toContain('van-uploader__upload--readonly');
  });

  it('should not emit click-upload when readonly', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            readonly: true,
            'onClick-upload': onClick,
          });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    if (upload) {
      await fireEvent.tap(upload);
    }
    expect(onClick).not.toHaveBeenCalled();
  });

  // Click events
  it('should emit click-upload on upload button tap', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            'onClick-upload': onClick,
          });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    if (upload) {
      await fireEvent.tap(upload);
    }
    expect(onClick).toHaveBeenCalled();
  });

  it('should emit click-preview on preview tap', async () => {
    const onClickPreview = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            previewFullImage: false,
            'onClick-preview': onClickPreview,
          });
        },
      }),
    );
    const previewImage = container.querySelector('.van-uploader__preview-image');
    if (previewImage) {
      await fireEvent.tap(previewImage);
    }
    expect(onClickPreview).toHaveBeenCalled();
  });

  it('should emit click-preview with correct detail', async () => {
    const onClickPreview = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            name: 'uploader',
            'onClick-preview': onClickPreview,
          });
        },
      }),
    );
    const previewImage = container.querySelector('.van-uploader__preview-image');
    if (previewImage) {
      await fireEvent.tap(previewImage);
    }
    expect(onClickPreview).toHaveBeenCalledWith(
      { url: IMAGE },
      { name: 'uploader', index: 0 },
    );
  });

  // Mask overlay tests
  it('should render mask for uploading status', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: 'uploading', message: '50%' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const mask = container.querySelector('.van-uploader__mask');
    expect(mask).toBeTruthy();
  });

  it('should render loading in mask for uploading status', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: 'uploading' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const loading = container.querySelector('.van-uploader__loading');
    expect(loading).toBeTruthy();
  });

  it('should render close icon in mask for failed status', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: 'failed' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const maskIcon = container.querySelector('.van-uploader__mask-icon');
    expect(maskIcon).toBeTruthy();
  });

  it('should render mask message', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: 'uploading', message: '50%' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const message = container.querySelector('.van-uploader__mask-message');
    expect(message).toBeTruthy();
    expect(message?.textContent).toContain('50%');
  });

  it('should not render mask for done status', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: 'done' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const mask = container.querySelector('.van-uploader__mask');
    expect(mask).toBeFalsy();
  });

  it('should not render mask for empty status', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: '' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const mask = container.querySelector('.van-uploader__mask');
    expect(mask).toBeFalsy();
  });

  // Preview size tests
  it('should apply preview size to upload area', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { previewSize: 60 });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload?.getAttribute('style')).toContain('width: 60px');
    expect(upload?.getAttribute('style')).toContain('height: 60px');
  });

  it('should support array preview size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { previewSize: [40, 60] });
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload?.getAttribute('style')).toContain('width: 40px');
    expect(upload?.getAttribute('style')).toContain('height: 60px');
  });

  // Preview image prop
  it('should not render preview items when previewImage is false', () => {
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files, previewImage: false });
        },
      }),
    );
    const previews = container.querySelectorAll('.van-uploader__preview');
    expect(previews.length).toBe(0);
  });

  // Default slot
  it('should render custom upload area via default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Uploader,
            {},
            {
              default: () => h('view', { class: 'custom-upload' }),
            },
          );
        },
      }),
    );
    const inputWrapper = container.querySelector('.van-uploader__input-wrapper');
    expect(inputWrapper).toBeTruthy();
    const customEl = container.querySelector('.custom-upload');
    expect(customEl).toBeTruthy();
  });

  it('should not render default upload button when default slot is provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Uploader,
            {},
            {
              default: () => h('view', { class: 'custom-upload' }),
            },
          );
        },
      }),
    );
    const upload = container.querySelector('.van-uploader__upload');
    expect(upload).toBeFalsy();
  });

  // Reupload tests
  it('should emit click-reupload when reupload is true', async () => {
    const onClickReupload = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            reupload: true,
            'onClick-reupload': onClickReupload,
          });
        },
      }),
    );
    const previewImage = container.querySelector('.van-uploader__preview-image');
    if (previewImage) {
      await fireEvent.tap(previewImage);
    }
    expect(onClickReupload).toHaveBeenCalled();
  });

  // beforeDelete tests
  it('should not delete when beforeDelete returns false', async () => {
    const onDelete = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            beforeDelete: () => false,
            onDelete,
          });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    if (deleteBtn) {
      await fireEvent.tap(deleteBtn);
    }
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should delete when beforeDelete returns true', async () => {
    const onDelete = vi.fn();
    const files: UploaderFileListItem[] = [{ url: IMAGE }];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: files,
            beforeDelete: () => true,
            onDelete,
          });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    if (deleteBtn) {
      await fireEvent.tap(deleteBtn);
    }
    expect(onDelete).toHaveBeenCalled();
  });

  // Per-item deletable override
  it('should respect per-item deletable', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, deletable: false },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files, deletable: true });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    expect(deleteBtn).toBeFalsy();
  });

  // Expose methods
  it('should expose chooseFile method', () => {
    const onClick = vi.fn();
    let instance: any;
    render(
      defineComponent({
        setup() {
          return () =>
            h(Uploader, {
              ref: (el: any) => {
                instance = el;
              },
              'onClick-upload': onClick,
            });
        },
      }),
    );
    expect(instance?.chooseFile).toBeTypeOf('function');
  });

  it('should expose closeImagePreview method', () => {
    let instance: any;
    render(
      defineComponent({
        setup() {
          return () =>
            h(Uploader, {
              ref: (el: any) => {
                instance = el;
              },
            });
        },
      }),
    );
    expect(instance?.closeImagePreview).toBeTypeOf('function');
  });

  it('should expose reuploadFile method', () => {
    let instance: any;
    render(
      defineComponent({
        setup() {
          return () =>
            h(Uploader, {
              ref: (el: any) => {
                instance = el;
              },
            });
        },
      }),
    );
    expect(instance?.reuploadFile).toBeTypeOf('function');
  });

  // Not show delete during uploading
  it('should not render delete button during uploading', () => {
    const files: UploaderFileListItem[] = [
      { url: IMAGE, status: 'uploading' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const deleteBtn = container.querySelector('.van-uploader__preview-delete');
    expect(deleteBtn).toBeFalsy();
  });
});

// Utils tests
describe('Uploader Utils', () => {
  it('isImageUrl should detect image URLs', () => {
    expect(isImageUrl('test.jpeg')).toBe(true);
    expect(isImageUrl('test.jpg')).toBe(true);
    expect(isImageUrl('test.png')).toBe(true);
    expect(isImageUrl('test.gif')).toBe(true);
    expect(isImageUrl('test.svg')).toBe(true);
    expect(isImageUrl('test.webp')).toBe(true);
    expect(isImageUrl('test.bmp')).toBe(true);
    expect(isImageUrl('test.pdf')).toBe(false);
    expect(isImageUrl('test.txt')).toBe(false);
    expect(isImageUrl('test.doc')).toBe(false);
  });

  it('isImageFile should detect image files by isImage flag', () => {
    expect(isImageFile({ isImage: true })).toBe(true);
    expect(isImageFile({ isImage: false, url: 'test.pdf' })).toBe(false);
  });

  it('isImageFile should detect image files by file type', () => {
    expect(
      isImageFile({ file: { type: 'image/jpeg' } as File }),
    ).toBe(true);
    expect(
      isImageFile({ file: { type: 'application/pdf' } as File }),
    ).toBe(false);
  });

  it('isImageFile should detect image files by URL', () => {
    expect(isImageFile({ url: 'https://example.com/test.jpeg' })).toBe(true);
    expect(isImageFile({ url: 'https://example.com/test.pdf' })).toBe(false);
  });

  it('isImageFile should detect image files by content', () => {
    expect(isImageFile({ content: 'data:image/jpeg;base64,...' })).toBe(true);
    expect(isImageFile({ content: 'data:text/plain;...' })).toBe(false);
  });

  it('isImageFile should return false for empty item', () => {
    expect(isImageFile({})).toBe(false);
  });

  it('isOversize should detect oversized files', () => {
    const item: UploaderFileListItem = {
      file: { size: 1000 } as File,
    };
    expect(isOversize(item, 500)).toBe(true);
    expect(isOversize(item, 2000)).toBe(false);
  });

  it('isOversize should support function maxSize', () => {
    const item: UploaderFileListItem = {
      file: { size: 1000, type: 'image/jpeg' } as File,
    };
    expect(isOversize(item, (f: File) => f.size > 500)).toBe(true);
    expect(isOversize(item, (f: File) => f.size > 2000)).toBe(false);
  });

  it('isOversize should handle items without file', () => {
    const item: UploaderFileListItem = { url: IMAGE };
    expect(isOversize(item, 500)).toBe(false);
  });

  it('filterFiles should separate valid and invalid files', () => {
    const items: UploaderFileListItem[] = [
      { file: { size: 100 } as File },
      { file: { size: 2000 } as File },
      { file: { size: 500 } as File },
    ];
    const result = filterFiles(items, 1000);
    expect(result.valid.length).toBe(2);
    expect(result.invalid.length).toBe(1);
  });
});
