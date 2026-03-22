import type {
  UploaderMaxSize,
  UploaderFileListItem,
} from './types';

const IMAGE_REGEXP = /\.(jpeg|jpg|gif|png|svg|webp|jfif|bmp|dpg|avif)/i;

export const isImageUrl = (url: string): boolean => IMAGE_REGEXP.test(url);

export function isImageFile(item: UploaderFileListItem): boolean {
  if (item.isImage) {
    return true;
  }

  if (item.file && item.file.type) {
    return item.file.type.indexOf('image') === 0;
  }

  if (item.url) {
    return isImageUrl(item.url);
  }

  if (typeof item.content === 'string') {
    return item.content.indexOf('data:image') === 0;
  }

  return false;
}

function isFunction(val: unknown): val is Function {
  return typeof val === 'function';
}

function toArray<T>(item: T | T[]): T[] {
  return Array.isArray(item) ? item : [item];
}

export function isOversize(
  items: UploaderFileListItem | UploaderFileListItem[],
  maxSize: UploaderMaxSize,
): boolean {
  return toArray(items).some((item) => {
    if (item.file) {
      if (isFunction(maxSize)) {
        return maxSize(item.file);
      }
      return item.file.size > +maxSize;
    }
    return false;
  });
}

export function filterFiles(
  items: UploaderFileListItem[],
  maxSize: UploaderMaxSize,
) {
  const valid: UploaderFileListItem[] = [];
  const invalid: UploaderFileListItem[] = [];

  items.forEach((item) => {
    if (isOversize(item, maxSize)) {
      invalid.push(item);
    } else {
      valid.push(item);
    }
  });

  return { valid, invalid };
}

export function getSizeStyle(
  originSize?: string | number | [string | number, string | number],
): Record<string, string> | undefined {
  if (originSize === undefined) return undefined;
  if (Array.isArray(originSize)) {
    return {
      width: addPx(originSize[0]),
      height: addPx(originSize[1]),
    };
  }
  const size = addPx(originSize);
  return { width: size, height: size };
}

function addPx(value: string | number): string {
  if (typeof value === 'number') return `${value}px`;
  return value;
}
