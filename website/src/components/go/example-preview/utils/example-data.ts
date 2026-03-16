export const isImgType = (fileName: string) => {
  const imgTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  return imgTypes.some((type) => fileName.endsWith(type));
};

export const isAssetFileType = (fileName: string) => {
  const assetExtension = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.mp4',
    '.avi',
    '.pdf',
    '.tif',
    '.psd',
    '.zip',
    '.tar',
    '.tgz',
    '.ttf',
    '.woff',
    '.woff2',
    '.eot',
    '.svg',
    '.ico',
  ];
  return assetExtension.some((type) => fileName.endsWith(type));
};

export const getFileCodeLanguage = (
  fileName: string,
  langAlias: Record<string, string> = {},
) => {
  const fileType = fileName.split('.').pop();
  if (fileType === 'mjs') {
    return 'js';
  }
  return langAlias[fileType || ''] || fileType || 'txt';
};

export const getHighlightLines = (meta: string) => {
  let highlightMeta = '';
  let highlightLines: number[] = [];
  if (meta) {
    const highlightReg = /{[\d,-]*}/i;
    highlightMeta = highlightReg.exec(meta)?.[0] || '';
    if (highlightMeta) {
      highlightLines = highlightMeta
        .replace(/[{}]/g, '')
        .split(',')
        .flatMap((item) => {
          const [start, end] = item.split('-');
          if (end) {
            return Array.from(
              { length: Number(end) - Number(start) + 1 },
              (_, i) => i + Number(start),
            );
          }
          return Number(start);
        });
    }
  }
  return highlightLines;
};

export const isVideo = (filename: string) => {
  let ext = filename.split('.').pop();
  if (!ext) {
    return false;
  }
  ext = ext.toLowerCase();
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
  if (videoExtensions.includes(ext)) {
    return true;
  }
  return false;
};
