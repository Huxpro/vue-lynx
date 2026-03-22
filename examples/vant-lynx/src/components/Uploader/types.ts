import type { Numeric } from '../../utils/format';

export type UploaderResultType = 'dataUrl' | 'text' | 'file';

export type UploaderFileListItem = {
  url?: string;
  file?: File;
  objectUrl?: string;
  content?: string;
  isImage?: boolean;
  status?: '' | 'uploading' | 'done' | 'failed';
  message?: string;
  imageFit?: string;
  deletable?: boolean;
  reupload?: boolean;
  previewSize?: Numeric;
  beforeDelete?: (...args: unknown[]) => boolean | Promise<boolean>;
};

export type UploaderMaxSize = Numeric | ((file: File) => boolean);

export type UploaderBeforeRead = (
  file: File | File[],
  detail: {
    name: Numeric;
    index: number;
  },
) => boolean | undefined | Promise<File | File[] | undefined>;

export type UploaderAfterRead = (
  items: UploaderFileListItem | UploaderFileListItem[],
  detail: {
    name: Numeric;
    index: number;
  },
) => void;

export type UploaderExpose = {
  chooseFile: () => void;
  closeImagePreview: () => void;
  reuploadFile: (index: number) => void;
};
